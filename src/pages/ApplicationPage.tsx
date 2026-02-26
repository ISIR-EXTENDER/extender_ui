import { useEffect, useMemo, useRef, useState } from "react";

import { loadApplicationsFromLocalStorage } from "../app/applications";
import type { CanvasRect } from "../components/layout/CanvasItem";
import {
  ActionButtonWidget,
  CurvesWidget,
  GripperControlWidget,
  JoystickWidget,
  LoadPoseButtonWidget,
  LogsWidget,
  ModeButtonWidget,
  MaxVelocityWidget,
  NavigationBarWidget,
  NavigationButtonWidget,
  RosbagControlWidget,
  SavePoseButtonWidget,
  SliderWidget,
  StreamDisplayWidget,
  TextareaWidget,
  TextWidget,
  DEFAULT_CANVAS_SETTINGS,
  resolveCanvasFitScale,
  resolveCanvasPresetSize,
  cloneWidgets,
  loadConfigurationsFromLocalStorage,
  persistConfigurationsToLocalStorage,
  type CanvasWidget,
  type PoseSnapshot,
  type PoseTopicValue,
  type WidgetConfiguration,
} from "../components/widgets";
import { wsClient } from "../services/wsClient";
import { useTeleopStore } from "../store/teleopStore";
import { useUiStore } from "../store/uiStore";

type ApplicationPageProps = {
  applicationId: string;
  routeScreenId: string | null;
  onNavigateToScreen: (screenId: string) => void;
};

const TOPIC_FRESHNESS_MS = 200;
const TOPIC_FRESHNESS_TICK_MS = 100;
const PETANQUE_STATE_TOPIC = "/petanque_state_machine/change_state";
const PETANQUE_TOTAL_DURATION_TOPIC = "/petanque_throw/total_duration";
const PETANQUE_TOTAL_DURATION_MIN_S = 0.4;
const PETANQUE_TOTAL_DURATION_MAX_S = 3.0;
const PETANQUE_DEFAULT_TOTAL_DURATION_S = 1.0;
const PETANQUE_COMMANDS = [
  "teleop",
  "activate_throw",
  "go_to_start",
  "throw",
  "pick_up",
  "stop",
] as const;
type PetanqueStateCommand = (typeof PETANQUE_COMMANDS)[number];
type PetanqueFlowStage = "teleop" | "start_ready";

const clampSignedUnit = (value: number) => Math.max(-1, Math.min(1, value));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const mapGainToPetanqueDuration = (gain: number) => {
  if (gain <= 0) return PETANQUE_TOTAL_DURATION_MAX_S;
  const duration = PETANQUE_DEFAULT_TOTAL_DURATION_S / gain;
  return clamp(duration, PETANQUE_TOTAL_DURATION_MIN_S, PETANQUE_TOTAL_DURATION_MAX_S);
};

const NOOP_RECT_CHANGE: (next: CanvasRect) => void = () => {};
const NOOP_TEXT_CHANGE: (next: string) => void = () => {};
const toScreenClassToken = (screenId: string) =>
  screenId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
const resolveVisualizationUrlForRuntime = (rawUrl: string) => {
  if (!rawUrl || typeof window === "undefined") return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") {
      parsed.hostname = window.location.hostname;
      return parsed.toString();
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};

export function ApplicationPage({
  applicationId,
  routeScreenId,
  onNavigateToScreen,
}: ApplicationPageProps) {
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
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);
  const setMaxVelocity = useTeleopStore((s) => s.setMaxVelocity);
  const gripperSpeed = useUiStore((s) => s.gripperSpeed);
  const gripperForce = useUiStore((s) => s.gripperForce);
  const setGripperSpeed = useUiStore((s) => s.setGripperSpeed);
  const setGripperForce = useUiStore((s) => s.setGripperForce);
  const cameraStreamUrl = useUiStore((s) => s.cameraStreamUrl);
  const rvizStreamUrl = useUiStore((s) => s.rvizStreamUrl);

  const [configurations, setConfigurations] = useState<WidgetConfiguration[]>(() =>
    loadConfigurationsFromLocalStorage()
  );
  const [widgetPulseMap, setWidgetPulseMap] = useState<Record<string, number>>({});
  const [freshnessClock, setFreshnessClock] = useState<number>(() => Date.now());
  const [rosbagRecording, setRosbagRecording] = useState(false);
  const [rosbagStatus, setRosbagStatus] = useState("idle");
  const [petanqueFlowStage, setPetanqueFlowStage] = useState<PetanqueFlowStage>("teleop");
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const [canvasViewportSize, setCanvasViewportSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const applications = useMemo(() => loadApplicationsFromLocalStorage(), []);
  const activeApplication = useMemo(
    () => applications.find((application) => application.id === applicationId) ?? null,
    [applicationId, applications]
  );

  const activeScreenId = useMemo(() => {
    if (!activeApplication) return null;
    if (routeScreenId && activeApplication.screenIds.includes(routeScreenId)) {
      return routeScreenId;
    }
    if (activeApplication.homeScreenId && activeApplication.screenIds.includes(activeApplication.homeScreenId)) {
      return activeApplication.homeScreenId;
    }
    return activeApplication.screenIds[0] ?? null;
  }, [activeApplication, routeScreenId]);

  const activeConfiguration = useMemo(
    () => configurations.find((configuration) => configuration.name === activeScreenId) ?? null,
    [activeScreenId, configurations]
  );

  const widgets: CanvasWidget[] = useMemo(
    () => cloneWidgets(activeConfiguration?.widgets ?? []),
    [activeConfiguration]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFreshnessClock(Date.now());
    }, TOPIC_FRESHNESS_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;

    const updateSize = () => {
      setCanvasViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [activeScreenId]);

  useEffect(() => {
    persistConfigurationsToLocalStorage(configurations);
  }, [configurations]);

  useEffect(() => {
    if (!activeScreenId) return;
    if (routeScreenId === activeScreenId) return;
    onNavigateToScreen(activeScreenId);
  }, [activeScreenId, onNavigateToScreen, routeScreenId]);

  const allowedScreenIds = useMemo(
    () => new Set(activeApplication?.screenIds ?? []),
    [activeApplication]
  );

  const canvasSettings = activeConfiguration?.canvas ?? DEFAULT_CANVAS_SETTINGS;
  const canvasSize = useMemo(
    () => resolveCanvasPresetSize(canvasSettings),
    [canvasSettings]
  );
  const canvasScale = useMemo(
    () => resolveCanvasFitScale(canvasSettings.runtimeMode, canvasSize, canvasViewportSize),
    [canvasSettings.runtimeMode, canvasSize, canvasViewportSize]
  );
  const scaledCanvasSize = useMemo(
    () => ({
      width: Math.round(canvasSize.width * canvasScale),
      height: Math.round(canvasSize.height * canvasScale),
    }),
    [canvasScale, canvasSize]
  );

  const markWidgetPulse = (widgetId: string) => {
    setWidgetPulseMap((prev) => ({
      ...prev,
      [widgetId]: Date.now(),
    }));
  };

  const isWidgetFresh = (widgetId: string) =>
    freshnessClock - (widgetPulseMap[widgetId] ?? 0) <= TOPIC_FRESHNESS_MS;

  const isPetanqueStateCommand = (value: string): value is PetanqueStateCommand =>
    (PETANQUE_COMMANDS as readonly string[]).includes(value);

  const getPetanqueButtonState = (command: PetanqueStateCommand) => {
    if (command === "teleop") {
      return {
        disabled: false,
        active: petanqueFlowStage === "teleop",
        tone: "default" as const,
      };
    }
    if (command === "activate_throw") {
      return {
        disabled: false,
        active: petanqueFlowStage === "start_ready",
        tone: "accent" as const,
      };
    }
    if (command === "go_to_start") {
      return {
        disabled: petanqueFlowStage === "teleop",
        active: petanqueFlowStage === "start_ready",
        tone: "success" as const,
      };
    }
    if (command === "throw") {
      return {
        disabled: petanqueFlowStage !== "start_ready",
        active: false,
        tone: "danger" as const,
      };
    }
    if (command === "pick_up") {
      return {
        disabled: petanqueFlowStage !== "start_ready",
        active: false,
        tone: "accent" as const,
      };
    }
    if (command === "stop") {
      return {
        disabled: petanqueFlowStage !== "start_ready",
        active: false,
        tone: "danger" as const,
      };
    }
    return {
      disabled: false,
      active: false,
      tone: "danger" as const,
    };
  };

  const advancePetanqueFlow = (command: PetanqueStateCommand) => {
    if (command === "teleop" || command === "stop") {
      setPetanqueFlowStage("teleop");
      return;
    }
    if (command === "activate_throw") {
      // Current state machine flow auto-transitions activate_throw -> go_to_start.
      // Mark UI as "start ready" immediately so START + HOME are both lit
      // and the next action is directly THROW.
      setPetanqueFlowStage("start_ready");
      return;
    }
    if (command === "go_to_start") {
      setPetanqueFlowStage("start_ready");
      return;
    }
    if (command === "pick_up") {
      // pick_up sequence returns to teleop mode in current state machine.
      setPetanqueFlowStage("teleop");
      return;
    }
    if (command === "throw") {
      // Throwing controller remains active after throw; keep throw-ready state.
      setPetanqueFlowStage("start_ready");
    }
  };

  const upsertPose = (poses: PoseSnapshot[], pose: PoseSnapshot) => {
    const index = poses.findIndex((item) => item.name === pose.name);
    if (index === -1) return [...poses, pose].sort((a, b) => a.name.localeCompare(b.name));
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
    if (!activeConfiguration) return;
    const defaultPoseName = `pose-${(activeConfiguration.poses.length ?? 0) + 1}`;
    const rawPoseName = window.prompt("Pose name", defaultPoseName);
    if (rawPoseName == null) return;
    const poseName = rawPoseName.trim();
    if (!poseName) return;

    const nextPose: PoseSnapshot = {
      name: poseName,
      savedAt: new Date().toISOString(),
      topics: collectCurrentPoseTopics(),
    };

    setConfigurations((prev) =>
      prev.map((configuration) =>
        configuration.name !== activeConfiguration.name
          ? configuration
          : {
              ...configuration,
              poses: upsertPose(configuration.poses, nextPose),
              updatedAt: new Date().toISOString(),
            }
      )
    );
  };

  const loadPoseByName = (poseName: string) => {
    if (!activeConfiguration) return;
    const pose = activeConfiguration.poses.find((item) => item.name === poseName);
    if (!pose) return;

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
        markWidgetPulse(widget.id);
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
        markWidgetPulse(widget.id);
      }
    }
  };

  const toggleRosbagRecording = (widget: Extract<CanvasWidget, { kind: "rosbag-control" }>) => {
    const nextRecording = !rosbagRecording;
    setRosbagRecording(nextRecording);
    setRosbagStatus(nextRecording ? "recording" : "stopped");
    wsClient.send({
      type: "rosbag_cmd",
      action: nextRecording ? "start" : "stop",
      name: widget.bagName,
      auto_timestamp: widget.autoTimestamp,
    });
  };

  const renderWidget = (widget: CanvasWidget) => {
    if (widget.kind === "save-pose-button") {
      return (
        <SavePoseButtonWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
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
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          onTrigger={() => loadPoseByName(widget.poseName)}
          poseAvailable={poseAvailable}
        />
      );
    }

    if (widget.kind === "mode-button") {
      return (
        <ModeButtonWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
        />
      );
    }

    if (widget.kind === "navigation-button") {
      const canNavigate = allowedScreenIds.has(widget.targetScreenId);
      return (
        <NavigationButtonWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          onNavigate={onNavigateToScreen}
          canNavigate={canNavigate}
        />
      );
    }

    if (widget.kind === "navigation-bar") {
      return (
        <NavigationBarWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onNavigate={onNavigateToScreen}
          allowedScreenIds={allowedScreenIds}
        />
      );
    }

    if (widget.kind === "text") {
      return (
        <TextWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onTextChange={NOOP_TEXT_CHANGE}
        />
      );
    }

    if (widget.kind === "textarea") {
      return (
        <TextareaWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onTextChange={NOOP_TEXT_CHANGE}
        />
      );
    }

    if (widget.kind === "button") {
      const petanqueCommand = isPetanqueStateCommand(widget.payload) ? widget.payload : null;
      const isStateMachineButton =
        widget.topic === PETANQUE_STATE_TOPIC && petanqueCommand !== null;
      const petanqueButtonState = isStateMachineButton && petanqueCommand
        ? getPetanqueButtonState(petanqueCommand)
        : null;

      return (
        <ActionButtonWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          disabled={petanqueButtonState?.disabled ?? false}
          active={petanqueButtonState?.active ?? false}
          tone={petanqueButtonState?.tone ?? widget.tone ?? "default"}
          onTrigger={() => {
            if (isStateMachineButton && petanqueCommand) {
              if (petanqueButtonState?.disabled) return;
              wsClient.send({
                type: "state_cmd",
                command: petanqueCommand,
              });
              advancePetanqueFlow(petanqueCommand);
              markWidgetPulse(widget.id);
              return;
            }

            wsClient.send({
              type: "ui_button",
              topic: widget.topic,
              payload: widget.payload,
              widget_id: widget.id,
            });
            markWidgetPulse(widget.id);
          }}
        />
      );
    }

    if (widget.kind === "rosbag-control") {
      return (
        <RosbagControlWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          isRecording={rosbagRecording}
          statusText={rosbagStatus}
          onToggleRecording={() => toggleRosbagRecording(widget)}
        />
      );
    }

    if (widget.kind === "max-velocity") {
      return (
        <MaxVelocityWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          value={maxVelocity}
          onValueChange={(nextValue) => {
            setMaxVelocity(nextValue);
            if (widget.topic === PETANQUE_TOTAL_DURATION_TOPIC) {
              wsClient.send({
                type: "petanque_cfg",
                total_duration: mapGainToPetanqueDuration(nextValue),
              });
            }
            markWidgetPulse(widget.id);
          }}
        />
      );
    }

    if (widget.kind === "gripper-control") {
      return (
        <GripperControlWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          speed={gripperSpeed}
          force={gripperForce}
          onSpeedChange={setGripperSpeed}
          onForceChange={setGripperForce}
          onOpen={() =>
            wsClient.send({ type: "gripper_cmd", action: "open", speed: gripperSpeed, force: gripperForce })
          }
          onClose={() =>
            wsClient.send({ type: "gripper_cmd", action: "close", speed: gripperSpeed, force: gripperForce })
          }
        />
      );
    }

    if (widget.kind === "stream-display") {
      const url =
        widget.source === "camera"
          ? cameraStreamUrl
          : widget.source === "rviz"
            ? rvizStreamUrl
            : resolveVisualizationUrlForRuntime(widget.streamUrl);
      const sourceStatus =
        widget.source === "rviz"
          ? "RViz stream"
          : widget.source === "visualization"
            ? "Visualization stream"
            : "Camera stream";
      return (
        <StreamDisplayWidget
          key={widget.id}
          widget={{
            ...widget,
            streamUrl: url || widget.streamUrl,
            fitMode: widget.fitMode ?? "contain",
            showStatus: widget.showStatus ?? true,
            showUrl: widget.showUrl ?? true,
            overlayText: widget.overlayText ?? "stream preview",
          }}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          statusText={sourceStatus}
        />
      );
    }

    if (widget.kind === "curves") {
      return (
        <CurvesWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
        />
      );
    }

    if (widget.kind === "logs") {
      return (
        <LogsWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
        />
      );
    }

    if (widget.kind === "slider") {
      const value = widget.binding === "z" ? z : rz;
      const onChange = widget.binding === "z" ? setZ : setRz;
      const topicPreview = `${widget.topic}: ${value.toFixed(2)}`;
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
          isTopicFresh={isWidgetFresh(widget.id)}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
        />
      );
    }

    const metrics =
      widget.binding === "joy" ? { x: joyX, y: joyY, magnitude: Math.min(1, Math.hypot(joyX, joyY)) } : { x: rotX, y: rotY };
    const topicPreview = `${widget.topic}: x=${metrics.x.toFixed(2)} y=${metrics.y.toFixed(2)}`;

    return (
      <JoystickWidget
        key={widget.id}
        widget={widget}
        selected={false}
        onSelect={() => {}}
        onRectChange={NOOP_RECT_CHANGE}
        onLabelChange={NOOP_TEXT_CHANGE}
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
        isTopicFresh={isWidgetFresh(widget.id)}
      />
    );
  };

  const canvasViewportClassName = `controls-canvas-viewport controls-canvas-mode-${canvasSettings.runtimeMode}`;
  const canvasFrameStyle = {
    width: `${scaledCanvasSize.width}px`,
    height: `${scaledCanvasSize.height}px`,
  };
  const canvasTransformStyle = {
    width: `${canvasSize.width}px`,
    height: `${canvasSize.height}px`,
    transform: `scale(${canvasScale})`,
    transformOrigin: "top left",
  };
  const showRuntimeScreenTabs = (activeApplication?.screenIds.length ?? 0) > 1;
  const activeScreenClassName = activeScreenId
    ? `application-runtime-screen-${toScreenClassToken(activeScreenId)}`
    : "";

  if (!activeApplication) {
    return (
      <main className="layout tab-accent tab-controls">
        <section className="card">
          <h2>Application not found</h2>
          <div className="placeholder">Unknown application ID: {applicationId}</div>
        </section>
      </main>
    );
  }

  if (!activeScreenId || !activeConfiguration) {
    return (
      <main className="layout tab-accent tab-controls">
        <section className="card">
          <h2>{activeApplication.name}</h2>
          <div className="placeholder">
            No valid screen selected. Configure at least one screen in <code>/canvas-design</code>.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`controls-page tab-accent tab-controls application-runtime-page ${activeScreenClassName}`.trim()}
    >
      <section className="controls-workspace">
        <div className="controls-canvas-zone application-runtime-canvas-zone">
          {showRuntimeScreenTabs ? (
            <div className="application-runtime-screen-tabs">
              {activeApplication.screenIds.map((screenId) => (
                <button
                  key={screenId}
                  type="button"
                  className={`tab-button ${screenId === activeScreenId ? "active" : ""}`}
                  onClick={() => onNavigateToScreen(screenId)}
                >
                  {screenId}
                </button>
              ))}
            </div>
          ) : null}
          <div className="controls-canvas-surface">
            <div className={canvasViewportClassName} ref={canvasViewportRef}>
              <div className="controls-canvas-frame" style={canvasFrameStyle}>
                <div className="controls-canvas-transform" style={canvasTransformStyle}>
                  <div className="controls-canvas" style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}>
                    {widgets.map(renderWidget)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
