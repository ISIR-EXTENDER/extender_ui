import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

import type { CanvasRect } from "../components/layout/CanvasItem";
import { ModeSelector } from "../components/teleop/ModeSelector";
import { JoystickWidget } from "../components/widgets/JoystickWidget";
import {
  LoadPoseButtonWidget,
  SavePoseButtonWidget,
} from "../components/widgets/PoseButtonsWidget";
import { SliderWidget } from "../components/widgets/SliderWidget";
import {
  WIDGET_CATALOG,
  cloneWidgets,
  createWidgetFromCatalogType,
  DEFAULT_WIDGETS,
  instantiateTsPreset,
  loadConfigurationsFromLocalStorage,
  persistConfigurationsToLocalStorage,
  removeConfiguration,
  syncConfigurationsFromFolder,
  syncConfigurationsToFolder,
  TS_WIDGET_PRESETS,
  type CanvasWidget,
  type JoystickWidget as JoystickWidgetModel,
  type LoadPoseButtonWidget as LoadPoseButtonWidgetModel,
  type PoseSnapshot,
  type PoseTopicValue,
  type SliderWidget as SliderWidgetModel,
  type WidgetIcon,
  type WidgetCatalogType,
  type WidgetConfiguration,
  upsertConfiguration,
} from "../components/widgets";
import { useTeleopStore } from "../store/teleopStore";

type ControlsPageProps = {
  focusOnly?: boolean;
};

type ContextMenuState = {
  clientX: number;
  clientY: number;
  canvasX: number;
  canvasY: number;
};

const ENABLED_WIDGETS = WIDGET_CATALOG.filter((entry) => entry.enabled);
const DEFAULT_ADD_WIDGET_TYPE: WidgetCatalogType =
  (ENABLED_WIDGETS[0]?.type as WidgetCatalogType | undefined) ?? "joystick";
const DEFAULT_TS_PRESET_ID = TS_WIDGET_PRESETS[0]?.id ?? "";
const TOPIC_FRESHNESS_MS = 200;
const TOPIC_FRESHNESS_TICK_MS = 100;

const readNumber = (raw: string, fallback: number) => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const toColorInputValue = (value: string, fallback = "#4a9eff") =>
  HEX_COLOR_PATTERN.test(value.trim()) ? value : fallback;
const clampSignedUnit = (value: number) => Math.max(-1, Math.min(1, value));

export function ControlsPage({ focusOnly = false }: ControlsPageProps) {
  const joyX = useTeleopStore((s) => s.joyX);
  const joyY = useTeleopStore((s) => s.joyY);
  const rotX = useTeleopStore((s) => s.rotX);
  const rotY = useTeleopStore((s) => s.rotY);
  const z = useTeleopStore((s) => s.z);
  const rz = useTeleopStore((s) => s.rz);
  const setJoy = useTeleopStore((s) => s.setJoy);
  const setRot = useTeleopStore((s) => s.setRot);
  const setZ = useTeleopStore((s) => s.setZ);
  const setRz = useTeleopStore((s) => s.setRz);

  const canvasSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [topBarSlotElement, setTopBarSlotElement] = useState<HTMLElement | null>(null);

  const [widgets, setWidgets] = useState<CanvasWidget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [quickAddType, setQuickAddType] = useState<WidgetCatalogType>(DEFAULT_ADD_WIDGET_TYPE);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectedTsPresetId, setSelectedTsPresetId] = useState<string>(DEFAULT_TS_PRESET_ID);

  const [configurations, setConfigurations] = useState<WidgetConfiguration[]>(() =>
    loadConfigurationsFromLocalStorage()
  );
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");
  const [configNameInput, setConfigNameInput] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [widgetPulseMap, setWidgetPulseMap] = useState<Record<string, number>>({});
  const [freshnessClock, setFreshnessClock] = useState<number>(() => Date.now());

  const magnitude = useMemo(() => Math.min(1, Math.hypot(joyX, joyY)), [joyX, joyY]);

  useEffect(() => {
    if (!widgets.length) {
      setSelectedWidgetId(null);
      return;
    }
    if (selectedWidgetId && widgets.some((widget) => widget.id === selectedWidgetId)) {
      return;
    }
    setSelectedWidgetId(widgets[0].id);
  }, [selectedWidgetId, widgets]);

  useEffect(() => {
    persistConfigurationsToLocalStorage(configurations);
  }, [configurations]);

  useEffect(() => {
    if (focusOnly) {
      setTopBarSlotElement(null);
      return;
    }
    setTopBarSlotElement(document.getElementById("topbar-controls-slot"));
  }, [focusOnly]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFreshnessClock(Date.now());
    }, TOPIC_FRESHNESS_TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setWidgetPulseMap((prev) => {
      const currentIds = new Set(widgets.map((widget) => widget.id));
      const next: Record<string, number> = {};
      let changed = false;

      for (const [id, timestamp] of Object.entries(prev)) {
        if (currentIds.has(id)) {
          next[id] = timestamp;
          continue;
        }
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [widgets]);

  useEffect(() => {
    if (!contextMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest(".controls-context-menu")) {
        return;
      }
      setContextMenu(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  const selectedWidget = useMemo(
    () => widgets.find((widget) => widget.id === selectedWidgetId) ?? null,
    [selectedWidgetId, widgets]
  );
  const activeConfiguration = useMemo(
    () => configurations.find((configuration) => configuration.name === selectedConfigName) ?? null,
    [configurations, selectedConfigName]
  );

  const canvasSize = useMemo(() => {
    const maxRight = widgets.reduce((acc, widget) => Math.max(acc, widget.rect.x + widget.rect.w), 220);
    const maxBottom = widgets.reduce((acc, widget) => Math.max(acc, widget.rect.y + widget.rect.h), 220);
    return {
      width: maxRight + 24,
      height: maxBottom + 24,
    };
  }, [widgets]);

  const updateWidget = (id: string, updater: (widget: CanvasWidget) => CanvasWidget) => {
    setWidgets((prev) => prev.map((widget) => (widget.id === id ? updater(widget) : widget)));
  };

  const updateSelectedWidget = (updater: (widget: CanvasWidget) => CanvasWidget) => {
    if (!selectedWidgetId) return;
    updateWidget(selectedWidgetId, updater);
  };

  const updateSelectedRectField = (field: keyof CanvasRect, raw: string) => {
    if (!selectedWidget) return;
    const fallback = selectedWidget.rect[field];
    const value = Math.max(0, Math.round(readNumber(raw, fallback)));

    if (selectedWidget.kind === "joystick" && (field === "w" || field === "h")) {
      updateSelectedWidget((widget) => ({
        ...widget,
        rect: {
          ...widget.rect,
          w: value,
          h: value,
        },
      }));
      return;
    }

    updateSelectedWidget((widget) => ({
      ...widget,
      rect: {
        ...widget.rect,
        [field]: value,
      },
    }));
  };

  const updateSelectedSlider = (updater: (widget: SliderWidgetModel) => SliderWidgetModel) => {
    updateSelectedWidget((widget) => (widget.kind === "slider" ? updater(widget) : widget));
  };

  const updateSelectedJoystick = (updater: (widget: JoystickWidgetModel) => JoystickWidgetModel) => {
    updateSelectedWidget((widget) => (widget.kind === "joystick" ? updater(widget) : widget));
  };
  const updateSelectedLoadPoseButton = (
    updater: (widget: LoadPoseButtonWidgetModel) => LoadPoseButtonWidgetModel
  ) => {
    updateSelectedWidget((widget) => (widget.kind === "load-pose-button" ? updater(widget) : widget));
  };

  const markWidgetPulse = (widgetId: string) => {
    const now = Date.now();
    setWidgetPulseMap((prev) => ({
      ...prev,
      [widgetId]: now,
    }));
  };

  const isWidgetFresh = (widgetId: string) =>
    freshnessClock - (widgetPulseMap[widgetId] ?? 0) <= TOPIC_FRESHNESS_MS;

  const addWidgetByType = (type: WidgetCatalogType, position?: { x: number; y: number }) => {
    const offset = widgets.length * 14;
    const x = Math.max(0, Math.round(position?.x ?? 20 + offset));
    const y = Math.max(0, Math.round(position?.y ?? 20 + offset));

    const widget = createWidgetFromCatalogType(type, x, y);
    if (!widget) {
      setStatusMessage(`Widget type \"${type}\" is not implemented yet.`);
      return;
    }

    setWidgets((prev) => [...prev, widget]);
    setSelectedWidgetId(widget.id);
    setStatusMessage("");
  };

  const removeSelectedWidget = () => {
    if (!selectedWidgetId) return;
    setWidgets((prev) => prev.filter((widget) => widget.id !== selectedWidgetId));
    setSelectedWidgetId(null);
  };

  const clearCanvas = () => {
    setWidgets([]);
    setSelectedWidgetId(null);
  };

  const loadConfigurationByName = (name: string) => {
    const configuration = configurations.find((item) => item.name === name);
    if (!configuration) {
      setStatusMessage("Configuration not found.");
      return;
    }
    setWidgets(cloneWidgets(configuration.widgets));
    setSelectedWidgetId(null);
    setSelectedConfigName(name);
    setConfigNameInput(name);
    setStatusMessage(`Loaded \"${name}\".`);
  };

  const saveCurrentConfiguration = () => {
    const name = (configNameInput || selectedConfigName).trim();
    if (!name) {
      setStatusMessage("Provide a configuration name before saving.");
      return;
    }

    setConfigurations((prev) => upsertConfiguration(prev, name, widgets));
    setSelectedConfigName(name);
    setConfigNameInput(name);
    setStatusMessage(`Saved \"${name}\".`);
  };

  const deleteSelectedConfiguration = () => {
    if (!selectedConfigName) {
      setStatusMessage("Select a configuration to delete.");
      return;
    }

    setConfigurations((prev) => removeConfiguration(prev, selectedConfigName));
    setStatusMessage(`Deleted \"${selectedConfigName}\".`);
    setSelectedConfigName("");
    setConfigNameInput("");
  };

  const loadDemoConfiguration = () => {
    setWidgets(cloneWidgets(DEFAULT_WIDGETS));
    setSelectedWidgetId(null);
    setStatusMessage("Loaded default demo widgets.");
  };

  const loadTsPreset = () => {
    if (!selectedTsPresetId) {
      setStatusMessage("Select a TS preset first.");
      return;
    }

    const widgetsFromPreset = instantiateTsPreset(selectedTsPresetId);
    if (!widgetsFromPreset) {
      setStatusMessage("TS preset not found.");
      return;
    }

    const presetName =
      TS_WIDGET_PRESETS.find((preset) => preset.id === selectedTsPresetId)?.label ??
      selectedTsPresetId;
    setWidgets(widgetsFromPreset);
    setSelectedWidgetId(null);
    setStatusMessage(`Loaded TS preset \"${presetName}\".`);
  };

  const upsertPose = (poses: PoseSnapshot[], pose: PoseSnapshot) => {
    const index = poses.findIndex((item) => item.name === pose.name);
    if (index === -1) {
      return [...poses, pose].sort((a, b) => a.name.localeCompare(b.name));
    }
    return poses.map((item, itemIndex) => (itemIndex === index ? pose : item));
  };

  const collectCurrentPoseTopics = (): Record<string, PoseTopicValue> => {
    const topics: Record<string, PoseTopicValue> = {};

    for (const widget of widgets) {
      if (widget.kind === "slider") {
        const value = widget.binding === "z" ? z : rz;
        topics[widget.topic] = { kind: "scalar", value };
        continue;
      }

      if (widget.kind === "joystick") {
        const source = widget.binding === "joy" ? { x: joyX, y: joyY } : { x: rotX, y: rotY };
        topics[widget.topic] = { kind: "vector2", x: source.x, y: source.y };
      }
    }

    return topics;
  };

  const saveCurrentPose = () => {
    if (!selectedConfigName) {
      setStatusMessage("Select a configuration before saving a pose.");
      return;
    }

    const defaultPoseName = `pose-${(activeConfiguration?.poses.length ?? 0) + 1}`;
    const rawPoseName = window.prompt("Pose name", defaultPoseName);
    if (rawPoseName == null) return;

    const poseName = rawPoseName.trim();
    if (!poseName) {
      setStatusMessage("Pose name cannot be empty.");
      return;
    }

    const nextPose: PoseSnapshot = {
      name: poseName,
      savedAt: new Date().toISOString(),
      topics: collectCurrentPoseTopics(),
    };

    setConfigurations((prev) =>
      prev.map((configuration) =>
        configuration.name !== selectedConfigName
          ? configuration
          : {
              ...configuration,
              poses: upsertPose(configuration.poses ?? [], nextPose),
              updatedAt: new Date().toISOString(),
            }
      )
    );
    setStatusMessage(`Pose \"${poseName}\" saved for configuration \"${selectedConfigName}\".`);
  };

  const loadPoseByName = (poseName: string) => {
    if (!selectedConfigName) {
      setStatusMessage("Select a configuration before loading a pose.");
      return;
    }
    const configuration = configurations.find((item) => item.name === selectedConfigName);
    if (!configuration) {
      setStatusMessage("Configuration not found.");
      return;
    }

    const pose = configuration.poses.find((item) => item.name === poseName);
    if (!pose) {
      setStatusMessage(`Pose \"${poseName}\" not found.`);
      return;
    }

    const touchedWidgetIds: string[] = [];

    for (const widget of widgets) {
      const topicValue = pose.topics[widget.topic];
      if (!topicValue) continue;

      if (widget.kind === "slider" && topicValue.kind === "scalar") {
        const clamped = Math.min(widget.max, Math.max(widget.min, topicValue.value));
        if (widget.binding === "z") {
          setZ(clamped);
        } else {
          setRz(clamped);
        }
        touchedWidgetIds.push(widget.id);
        continue;
      }

      if (widget.kind === "joystick" && topicValue.kind === "vector2") {
        const x = clampSignedUnit(topicValue.x);
        const y = clampSignedUnit(topicValue.y);
        if (widget.binding === "joy") {
          setJoy(x, y);
        } else {
          setRot(x, y);
        }
        touchedWidgetIds.push(widget.id);
      }
    }

    if (touchedWidgetIds.length) {
      const now = Date.now();
      setWidgetPulseMap((prev) => {
        const next = { ...prev };
        for (const widgetId of touchedWidgetIds) {
          next[widgetId] = now;
        }
        return next;
      });
    }

    setStatusMessage(`Pose \"${pose.name}\" loaded.`);
  };

  const handleSyncToFolder = async () => {
    try {
      const count = await syncConfigurationsToFolder(configurations);
      setStatusMessage(`Synced ${count} configuration(s) to folder.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Sync to folder failed.");
    }
  };

  const handleSyncFromFolder = async () => {
    try {
      const merged = await syncConfigurationsFromFolder(configurations);
      setConfigurations(merged);
      setStatusMessage(`Synced ${merged.length} configuration(s) from folder.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Sync from folder failed.");
    }
  };

  const handleCanvasContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const surface = canvasSurfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    setContextMenu({
      clientX: event.clientX,
      clientY: event.clientY,
      canvasX: Math.max(0, Math.round(event.clientX - rect.left + surface.scrollLeft)),
      canvasY: Math.max(0, Math.round(event.clientY - rect.top + surface.scrollTop)),
    });
  };

  const renderCanvasWidget = (widget: CanvasWidget) => {
    const selected = widget.id === selectedWidgetId;

    if (widget.kind === "save-pose-button") {
      return (
        <SavePoseButtonWidget
          key={widget.id}
          widget={widget}
          selected={selected}
          onSelect={() => setSelectedWidgetId(widget.id)}
          onRectChange={(next) => updateWidget(widget.id, (current) => ({ ...current, rect: next }))}
          onTrigger={saveCurrentPose}
        />
      );
    }

    if (widget.kind === "load-pose-button") {
      const poseAvailable = (activeConfiguration?.poses ?? []).some(
        (pose) => pose.name === widget.poseName
      );
      return (
        <LoadPoseButtonWidget
          key={widget.id}
          widget={widget}
          selected={selected}
          onSelect={() => setSelectedWidgetId(widget.id)}
          onRectChange={(next) => updateWidget(widget.id, (current) => ({ ...current, rect: next }))}
          onTrigger={() => loadPoseByName(widget.poseName)}
          poseAvailable={poseAvailable}
        />
      );
    }

    if (widget.kind === "slider") {
      const value = widget.binding === "z" ? z : rz;
      const onChange = widget.binding === "z" ? setZ : setRz;
      const topicPreview = `${widget.topic}: ${value.toFixed(2)}`;
      const isTopicFresh = isWidgetFresh(widget.id);

      return (
        <SliderWidget
          key={widget.id}
          widget={widget}
          value={value}
          onValueChange={(nextValue) => {
            onChange(nextValue);
            markWidgetPulse(widget.id);
          }}
          topicPreview={topicPreview}
          isTopicFresh={isTopicFresh}
          selected={selected}
          onSelect={() => setSelectedWidgetId(widget.id)}
          onRectChange={(next) => updateWidget(widget.id, (current) => ({ ...current, rect: next }))}
        />
      );
    }

    const metrics = widget.binding === "joy" ? { x: joyX, y: joyY, magnitude } : { x: rotX, y: rotY };
    const topicPreview = `${widget.topic}: x=${metrics.x.toFixed(2)} y=${metrics.y.toFixed(2)}`;
    const isTopicFresh = isWidgetFresh(widget.id);

    return (
      <JoystickWidget
        key={widget.id}
        widget={widget}
        selected={selected}
        onSelect={() => setSelectedWidgetId(widget.id)}
        onRectChange={(next) => updateWidget(widget.id, (current) => ({ ...current, rect: next }))}
        onMove={(x, y) => {
          if (widget.binding === "joy") {
            setJoy(x, y);
          } else {
            setRot(x, y);
          }
          markWidgetPulse(widget.id);
        }}
        metrics={metrics}
        topicPreview={topicPreview}
        isTopicFresh={isTopicFresh}
      />
    );
  };

  const configToolbar = (
    <div className="controls-header-inline">
      <div className="controls-config-row">
        <label className="controls-field controls-config-field">
          <span>Configuration</span>
          <select
            className="editor-input"
            value={selectedConfigName}
            onChange={(event) => {
              const name = event.target.value;
              setSelectedConfigName(name);
              setConfigNameInput(name);
            }}
          >
            <option value="">-- select --</option>
            {configurations.map((configuration) => (
              <option key={configuration.name} value={configuration.name}>
                {configuration.name}
              </option>
            ))}
          </select>
        </label>

        <label className="controls-field controls-config-field">
          <span>Name</span>
          <input
            className="editor-input"
            value={configNameInput}
            onChange={(event) => setConfigNameInput(event.target.value)}
            placeholder="new configuration"
          />
        </label>

        <label className="controls-field controls-config-field">
          <span>TS Preset</span>
          <select
            className="editor-input"
            value={selectedTsPresetId}
            onChange={(event) => setSelectedTsPresetId(event.target.value)}
          >
            {TS_WIDGET_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="tab-button" onClick={() => selectedConfigName && loadConfigurationByName(selectedConfigName)}>
          Load
        </button>
        <button type="button" className="tab-button" onClick={loadTsPreset} disabled={!selectedTsPresetId}>
          Load Preset
        </button>
        <button type="button" className="tab-button" onClick={saveCurrentConfiguration}>
          Save
        </button>
        <button type="button" className="tab-button" onClick={deleteSelectedConfiguration} disabled={!selectedConfigName}>
          Delete
        </button>
        <button type="button" className="tab-button" onClick={clearCanvas}>
          Clear Canvas
        </button>
        <button type="button" className="tab-button" onClick={loadDemoConfiguration}>
          Load Demo
        </button>
        <button type="button" className="tab-button" onClick={handleSyncToFolder}>
          Sync To Folder
        </button>
        <button type="button" className="tab-button" onClick={handleSyncFromFolder}>
          Sync From Folder
        </button>
      </div>
      {statusMessage ? <div className="controls-status-message">{statusMessage}</div> : null}
    </div>
  );

  if (focusOnly) {
    return (
      <main className="controls-page controls-page-focus tab-accent tab-controls">
        <section className="controls-workspace">
          <div className="controls-canvas-surface" ref={canvasSurfaceRef} onContextMenu={handleCanvasContextMenu}>
            <div className="controls-canvas" style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}>
              {widgets.map(renderCanvasWidget)}
            </div>
          </div>
        </section>

        {contextMenu ? (
          <div
            className="controls-context-menu"
            style={{ left: `${contextMenu.clientX}px`, top: `${contextMenu.clientY}px` }}
          >
            <div className="controls-context-title">Add Widget</div>
            <div className="controls-context-list">
              {WIDGET_CATALOG.map((entry) => (
                <button
                  key={entry.type}
                  type="button"
                  className="controls-context-item"
                  disabled={!entry.enabled}
                  onClick={() => {
                    addWidgetByType(entry.type, { x: contextMenu.canvasX, y: contextMenu.canvasY });
                    setContextMenu(null);
                  }}
                >
                  <span>{entry.label}</span>
                  <span className="controls-context-tag">{entry.enabled ? "add" : "soon"}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <>
      {topBarSlotElement ? createPortal(configToolbar, topBarSlotElement) : null}
      <main className="controls-page tab-accent tab-controls">
        <section className="controls-workspace">
        <div className="controls-shell">
          <div className="controls-canvas-surface" ref={canvasSurfaceRef} onContextMenu={handleCanvasContextMenu}>
            <div className="controls-canvas" style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}>
              {widgets.map(renderCanvasWidget)}
            </div>
          </div>

          <aside className="controls-aside">
            <section className="card controls-aside-menu">
              <h2>Widgets</h2>

              <div className="controls-widget-actions">
                <select
                  className="editor-input"
                  value={quickAddType}
                  onChange={(event) => setQuickAddType(event.target.value as WidgetCatalogType)}
                >
                  {ENABLED_WIDGETS.map((entry) => (
                    <option key={entry.type} value={entry.type}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="tab-button" onClick={() => addWidgetByType(quickAddType)}>
                  Add
                </button>
                <button type="button" className="tab-button" onClick={removeSelectedWidget} disabled={!selectedWidget}>
                  Remove
                </button>
              </div>

              <div className="controls-hint">Right click on canvas to add at cursor.</div>

              <div className="controls-menu-list">
                {widgets.map((widget) => (
                  <button
                    key={widget.id}
                    type="button"
                    className={`controls-menu-item ${selectedWidgetId === widget.id ? "is-selected" : ""}`}
                    onClick={() => setSelectedWidgetId(widget.id)}
                  >
                    <span>{widget.label || widget.id}</span>
                    <span className="controls-menu-state">{widget.kind}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="card controls-inspector-card">
              <h2>Properties</h2>
              {!selectedWidget ? (
                <div className="placeholder">Select a widget to edit properties.</div>
              ) : (
                <div className="controls-inspector-grid">
                  <label className="controls-field">
                    <span>Type</span>
                    <input className="editor-input" value={selectedWidget.kind} readOnly />
                  </label>

                  <label className="controls-field">
                    <span>Label</span>
                    <input
                      className="editor-input"
                      value={selectedWidget.label}
                      onChange={(event) =>
                        updateSelectedWidget((widget) => ({
                          ...widget,
                          label: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="controls-field">
                    <span>Topic</span>
                    <input
                      className="editor-input"
                      value={selectedWidget.topic}
                      onChange={(event) =>
                        updateSelectedWidget((widget) => ({
                          ...widget,
                          topic: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className="controls-field-row">
                    <label className="controls-field">
                      <span>X</span>
                      <input
                        type="number"
                        className="editor-input"
                        value={selectedWidget.rect.x}
                        onChange={(event) => updateSelectedRectField("x", event.target.value)}
                      />
                    </label>
                    <label className="controls-field">
                      <span>Y</span>
                      <input
                        type="number"
                        className="editor-input"
                        value={selectedWidget.rect.y}
                        onChange={(event) => updateSelectedRectField("y", event.target.value)}
                      />
                    </label>
                    <label className="controls-field">
                      <span>W</span>
                      <input
                        type="number"
                        className="editor-input"
                        value={selectedWidget.rect.w}
                        onChange={(event) => updateSelectedRectField("w", event.target.value)}
                      />
                    </label>
                    <label className="controls-field">
                      <span>H</span>
                      <input
                        type="number"
                        className="editor-input"
                        value={selectedWidget.rect.h}
                        onChange={(event) => updateSelectedRectField("h", event.target.value)}
                      />
                    </label>
                  </div>

                  {selectedWidget.kind === "joystick" ? (
                    <>
                      <div className="controls-property-title">Joystick</div>
                      <div className="controls-field-row">
                        <label className="controls-field">
                          <span>Binding</span>
                          <select
                            className="editor-input"
                            value={selectedWidget.binding}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                binding: event.target.value === "rot" ? "rot" : "joy",
                              }))
                            }
                          >
                            <option value="joy">translation</option>
                            <option value="rot">rotation</option>
                          </select>
                        </label>

                        <label className="controls-field">
                          <span>Deadzone (0..1)</span>
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            className="editor-input"
                            value={selectedWidget.deadzone}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                deadzone: clamp01(readNumber(event.target.value, widget.deadzone)),
                              }))
                            }
                          />
                        </label>

                        <label className="controls-field">
                          <span>Disk Radius</span>
                          <input
                            type="number"
                            min={20}
                            step={1}
                            className="editor-input"
                            value={selectedWidget.diskSize}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                diskSize: Math.max(20, Math.round(readNumber(event.target.value, widget.diskSize))),
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="controls-field-row">
                        <label className="controls-field">
                          <span>Color Picker</span>
                          <input
                            type="color"
                            className="editor-input"
                            value={toColorInputValue(selectedWidget.color)}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                color: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="controls-field">
                          <span>Color Hex</span>
                          <input
                            className="editor-input"
                            value={selectedWidget.color}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                color: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="controls-field-row">
                        <label className="controls-field">
                          <span>Top Label</span>
                          <input
                            className="editor-input"
                            value={selectedWidget.labels.top}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                labels: { ...widget.labels, top: event.target.value },
                              }))
                            }
                          />
                        </label>
                        <label className="controls-field">
                          <span>Right Label</span>
                          <input
                            className="editor-input"
                            value={selectedWidget.labels.right}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                labels: { ...widget.labels, right: event.target.value },
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="controls-field-row">
                        <label className="controls-field">
                          <span>Bottom Label</span>
                          <input
                            className="editor-input"
                            value={selectedWidget.labels.bottom}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                labels: { ...widget.labels, bottom: event.target.value },
                              }))
                            }
                          />
                        </label>
                        <label className="controls-field">
                          <span>Left Label</span>
                          <input
                            className="editor-input"
                            value={selectedWidget.labels.left}
                            onChange={(event) =>
                              updateSelectedJoystick((widget) => ({
                                ...widget,
                                labels: { ...widget.labels, left: event.target.value },
                              }))
                            }
                          />
                        </label>
                      </div>
                    </>
                  ) : selectedWidget.kind === "slider" ? (
                    <>
                      <div className="controls-property-title">Slider</div>
                      <div className="controls-field-row">
                        <label className="controls-field">
                          <span>Binding</span>
                          <select
                            className="editor-input"
                            value={selectedWidget.binding}
                            onChange={(event) =>
                              updateSelectedSlider((widget) => ({
                                ...widget,
                                binding: event.target.value === "rz" ? "rz" : "z",
                              }))
                            }
                          >
                            <option value="z">z</option>
                            <option value="rz">rz</option>
                          </select>
                        </label>

                        <label className="controls-field">
                          <span>Direction</span>
                          <select
                            className="editor-input"
                            value={selectedWidget.direction}
                            onChange={(event) =>
                              updateSelectedSlider((widget) => ({
                                ...widget,
                                direction: event.target.value === "horizontal" ? "horizontal" : "vertical",
                              }))
                            }
                          >
                            <option value="vertical">vertical</option>
                            <option value="horizontal">horizontal</option>
                          </select>
                        </label>
                      </div>

                      <div className="controls-field-row">
                        <label className="controls-field">
                          <span>Min</span>
                          <input
                            type="number"
                            step={0.01}
                            className="editor-input"
                            value={selectedWidget.min}
                            onChange={(event) =>
                              updateSelectedSlider((widget) => ({
                                ...widget,
                                min: readNumber(event.target.value, widget.min),
                              }))
                            }
                          />
                        </label>

                        <label className="controls-field">
                          <span>Max</span>
                          <input
                            type="number"
                            step={0.01}
                            className="editor-input"
                            value={selectedWidget.max}
                            onChange={(event) =>
                              updateSelectedSlider((widget) => ({
                                ...widget,
                                max: readNumber(event.target.value, widget.max),
                              }))
                            }
                          />
                        </label>

                        <label className="controls-field">
                          <span>Step</span>
                          <input
                            type="number"
                            step={0.01}
                            className="editor-input"
                            value={selectedWidget.step}
                            onChange={(event) =>
                              updateSelectedSlider((widget) => ({
                                ...widget,
                                step: Math.max(0.001, readNumber(event.target.value, widget.step)),
                              }))
                            }
                          />
                        </label>
                      </div>
                    </>
                  ) : selectedWidget.kind === "load-pose-button" ? (
                    <>
                      <div className="controls-property-title">Load Pose Button</div>
                      <div className="controls-field-row">
                        <label className="controls-field">
                          <span>Pose</span>
                          <select
                            className="editor-input"
                            value={selectedWidget.poseName}
                            onChange={(event) =>
                              updateSelectedLoadPoseButton((widget) => ({
                                ...widget,
                                poseName: event.target.value,
                              }))
                            }
                          >
                            <option value="">-- select pose --</option>
                            {(activeConfiguration?.poses ?? []).map((pose) => (
                              <option key={pose.name} value={pose.name}>
                                {pose.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="controls-field">
                          <span>Icon</span>
                          <select
                            className="editor-input"
                            value={selectedWidget.icon}
                            onChange={(event) =>
                              updateSelectedLoadPoseButton((widget) => ({
                                ...widget,
                                icon: (event.target.value === "save" ? "save" : "home") as WidgetIcon,
                              }))
                            }
                          >
                            <option value="home">home</option>
                            <option value="save">save</option>
                          </select>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="controls-property-title">Save Pose Button</div>
                      <div className="controls-hint">
                        Saves the current canvas topic state into the selected configuration.
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>

            <section className="card">
              <h2>Mode</h2>
              <ModeSelector />
            </section>
          </aside>
        </div>
        </section>

        {contextMenu ? (
          <div
            className="controls-context-menu"
            style={{ left: `${contextMenu.clientX}px`, top: `${contextMenu.clientY}px` }}
          >
            <div className="controls-context-title">Add Widget</div>
            <div className="controls-context-list">
              {WIDGET_CATALOG.map((entry) => (
                <button
                  key={entry.type}
                  type="button"
                  className="controls-context-item"
                  disabled={!entry.enabled}
                  onClick={() => {
                    addWidgetByType(entry.type, { x: contextMenu.canvasX, y: contextMenu.canvasY });
                    setContextMenu(null);
                  }}
                >
                  <span>{entry.label}</span>
                  <span className="controls-context-tag">{entry.enabled ? "add" : "soon"}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
