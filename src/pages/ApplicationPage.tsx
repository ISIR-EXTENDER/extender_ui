import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { loadApplicationsFromLocalStorage } from "../app/applications";
import { resolveApplicationRuntimePlugins } from "../app/runtime/registry";
import type { CanvasRect } from "../components/layout/CanvasItem";
import {
  ActionButtonWidget,
  CurvesWidget,
  DrinkWidget,
  GripperControlWidget,
  JoystickWidget,
  LoadPoseButtonWidget,
  LogsWidget,
  MagnetControlWidget,
  ModeButtonWidget,
  MaxVelocityWidget,
  NavigationBarWidget,
  NavigationButtonWidget,
  RosbagControlWidget,
  SavePoseButtonWidget,
  SliderWidget,
  StreamDisplayWidget,
  ThrowDrawWidget,
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
import {
  PETANQUE_ALPHA_PRESET_TOPIC,
  PETANQUE_ALPHA_TOPIC,
  PETANQUE_ANGLE_TOPIC,
  PETANQUE_STATE_TOPIC,
  PETANQUE_TOTAL_DURATION_TOPIC,
  PLAY_PETANQUE_MEASURE_REQUEST_TOPIC,
  PLAY_PETANQUE_MEASURE_STATUS_TOPIC,
  PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID,
  PLAY_PETANQUE_MEASURE_VECTORS_TOPIC,
  isLocalMaxVelocityTopic,
} from "./applicationTopics";
import {
  MEASURE_DEMO_HISTORY_ENTRY,
  PLAY_PETANQUE_MEASURES_SCREEN_ID,
  formatMeasureStatusText,
  formatMeasureVectorsText,
  resolveMeasureResultOverlayText,
  triggerMeasureButton,
  type MeasureResultHistoryEntry,
  type MeasureViewMode,
} from "./applicationMeasureRuntime";
import {
  applyTeleopConfigScalarValue,
  getTeleopConfigButtonLabel,
  getTeleopConfigButtonState,
  isTeleopConfigButtonTopic,
  resolveTeleopConfigScalarValue,
  triggerTeleopConfigButton,
} from "./applicationTeleopConfig";
import {
  getMeasureButtonState,
  getPetanqueButtonState,
  isMeasureButtonTopic,
  isPetanqueStateCommand,
  resolvePetanqueFlowStageAfterCommand,
  resolvePetanqueAlphaPreset,
  type PetanqueAlphaPreset,
  type PetanqueFlowStage,
  type PetanqueStateCommand,
} from "./applicationRuntimeButtons";

type ApplicationPageProps = {
  applicationId: string;
  routeScreenId: string | null;
  onNavigateToScreen: (screenId: string) => void;
  gripperCardsVisible?: boolean;
  modeButtonsVisible?: boolean;
};

const TOPIC_FRESHNESS_MS = 200;
const TOPIC_FRESHNESS_TICK_MS = 100;
const PETANQUE_ALPHA_SAFE_MAX = 20;
const PETANQUE_ALPHA_MAX = 40;
const PETANQUE_ALPHA_POINTER = 20;
const PETANQUE_ALPHA_TIRER = 0;
const PETANQUE_TOTAL_DURATION_MIN_S = 0.9;
const PETANQUE_TOTAL_DURATION_MAX_S = 3.0;
const PETANQUE_DEFAULT_TOTAL_DURATION_S = 1.1;
const PETANQUE_DEFAULT_ALPHA = 0;
type SliderChannel = "z" | "rz";
const clampSignedUnit = (value: number) => Math.max(-1, Math.min(1, value));
const clampPetanqueDuration = (durationSeconds: number) =>
  Math.max(PETANQUE_TOTAL_DURATION_MIN_S, Math.min(PETANQUE_TOTAL_DURATION_MAX_S, durationSeconds));
const formatMaxVelocityPowerPercent = (
  value: number,
  min: number,
  max: number,
  reverseDirection: boolean
) => {
  const span = Math.max(1e-6, max - min);
  const normalized = reverseDirection ? (max - value) / span : (value - min) / span;
  const percent = Math.max(0, Math.min(100, normalized * 100));
  return `Power ${percent.toFixed(0)}%`;
};

const NOOP_RECT_CHANGE: (next: CanvasRect) => void = () => {};
const NOOP_TEXT_CHANGE = Object.assign(
  (_next: string) => {},
  { __readonly: true as const }
);
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
  gripperCardsVisible = true,
  modeButtonsVisible = true,
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
  const scaleX = useTeleopStore((s) => s.scaleX);
  const scaleY = useTeleopStore((s) => s.scaleY);
  const scaleZ = useTeleopStore((s) => s.scaleZ);
  const angularScaleX = useTeleopStore((s) => s.angularScaleX);
  const angularScaleY = useTeleopStore((s) => s.angularScaleY);
  const angularScaleZ = useTeleopStore((s) => s.angularScaleZ);
  const translationGain = useTeleopStore((s) => s.translationGain);
  const rotationGain = useTeleopStore((s) => s.rotationGain);
  const swapXY = useTeleopStore((s) => s.swapXY);
  const invertLinearX = useTeleopStore((s) => s.invertLinearX);
  const invertLinearY = useTeleopStore((s) => s.invertLinearY);
  const invertLinearZ = useTeleopStore((s) => s.invertLinearZ);
  const invertAngularX = useTeleopStore((s) => s.invertAngularX);
  const invertAngularY = useTeleopStore((s) => s.invertAngularY);
  const invertAngularZ = useTeleopStore((s) => s.invertAngularZ);
  const setTranslationGain = useTeleopStore((s) => s.setTranslationGain);
  const setRotationGain = useTeleopStore((s) => s.setRotationGain);
  const setScaleX = useTeleopStore((s) => s.setScaleX);
  const setScaleY = useTeleopStore((s) => s.setScaleY);
  const setScaleZ = useTeleopStore((s) => s.setScaleZ);
  const setAngularScaleX = useTeleopStore((s) => s.setAngularScaleX);
  const setAngularScaleY = useTeleopStore((s) => s.setAngularScaleY);
  const setAngularScaleZ = useTeleopStore((s) => s.setAngularScaleZ);
  const setSwapXY = useTeleopStore((s) => s.setSwapXY);
  const setInvertLinearX = useTeleopStore((s) => s.setInvertLinearX);
  const setInvertLinearY = useTeleopStore((s) => s.setInvertLinearY);
  const setInvertLinearZ = useTeleopStore((s) => s.setInvertLinearZ);
  const setInvertAngularX = useTeleopStore((s) => s.setInvertAngularX);
  const setInvertAngularY = useTeleopStore((s) => s.setInvertAngularY);
  const setInvertAngularZ = useTeleopStore((s) => s.setInvertAngularZ);
  const saveTeleopProfile = useTeleopStore((s) => s.saveTeleopProfile);
  const resetTeleopConfig = useTeleopStore((s) => s.resetTeleopConfig);
  const wsStatus = useTeleopStore((s) => s.wsStatus);
  const wsState = useTeleopStore((s) => s.wsState);
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
  const [maxVelocityWidgetValues, setMaxVelocityWidgetValues] = useState<Record<string, number>>({});
  const [throwDrawWidgetValues, setThrowDrawWidgetValues] = useState<
    Record<string, { angle: number; duration: number }>
  >({});
  const [throwDrawAlphaValues, setThrowDrawAlphaValues] = useState<Record<string, number>>({});
  const [measureViewMode, setMeasureViewMode] = useState<MeasureViewMode>("live");
  const [capturedMeasureImageDataUrl, setCapturedMeasureImageDataUrl] = useState<string | null>(
    null
  );
  const [measureResultImageDataUrl, setMeasureResultImageDataUrl] = useState<string | null>(
    () => MEASURE_DEMO_HISTORY_ENTRY.imageDataUrl
  );
  const [measureVectorsJson, setMeasureVectorsJson] = useState<string | null>(
    () => MEASURE_DEMO_HISTORY_ENTRY.vectorsJson
  );
  const [measureStatusText, setMeasureStatusText] = useState("Live feed active (demo available)");
  const [measureLastUpdatedAtMs, setMeasureLastUpdatedAtMs] = useState<number | null>(null);
  const [measureRequestPending, setMeasureRequestPending] = useState(false);
  const measureResultHistoryRef = useRef<MeasureResultHistoryEntry[]>([MEASURE_DEMO_HISTORY_ENTRY]);
  const hasSentPetanqueDurationDefaultRef = useRef(false);
  const alphaUnsafeValidatedRef = useRef(false);
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
  const runtimeWidgets: CanvasWidget[] = useMemo(
    () =>
      widgets.filter((widget) => {
        if (!gripperCardsVisible && widget.kind === "gripper-control") return false;
        if (!modeButtonsVisible && widget.kind === "mode-button") return false;
        return true;
      }),
    [gripperCardsVisible, modeButtonsVisible, widgets]
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
    if (wsStatus !== "connected") {
      hasSentPetanqueDurationDefaultRef.current = false;
      return;
    }

    if (activeScreenId !== "petanque") return;
    if (hasSentPetanqueDurationDefaultRef.current) return;

    const hasDurationWidget = widgets.some(
      (widget) =>
        widget.kind === "max-velocity" &&
        widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
    );
    if (!hasDurationWidget) return;

    wsClient.send({
      type: "petanque_cfg",
      total_duration: clampPetanqueDuration(PETANQUE_DEFAULT_TOTAL_DURATION_S),
    });
    hasSentPetanqueDurationDefaultRef.current = true;
  }, [activeScreenId, widgets, wsStatus]);

  useEffect(() => {
    if (!activeScreenId) return;
    if (routeScreenId === activeScreenId) return;
    onNavigateToScreen(activeScreenId);
  }, [activeScreenId, onNavigateToScreen, routeScreenId]);

  const activeRuntimePlugins = useMemo(
    () =>
      resolveApplicationRuntimePlugins({
        application: activeApplication,
        activeScreenId,
      }),
    [activeApplication, activeScreenId]
  );

  useEffect(() => {
    const unsubscribe = wsClient.onMessage((message) => {
      for (const plugin of activeRuntimePlugins) {
        const handled = plugin.handleIncomingMessage?.({
          application: activeApplication,
          activeScreenId,
          message,
          widgets,
          state: {
            measureResultHistory: measureResultHistoryRef.current,
          },
          actions: {
            setMeasureResultImageDataUrl,
            setMeasureVectorsJson,
            setMeasureLastUpdatedAtMs,
            setMeasureStatusText,
            setMeasureRequestPending,
            setMeasureViewMode,
            setMeasureResultHistory: (nextHistory) => {
              measureResultHistoryRef.current = nextHistory;
            },
          },
        });
        if (handled) return;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeApplication, activeRuntimePlugins, activeScreenId, widgets]);

  const allowedScreenIds = useMemo(
    () => new Set(activeApplication?.screenIds ?? []),
    [activeApplication]
  );

  const canvasSettings = activeConfiguration?.canvas ?? DEFAULT_CANVAS_SETTINGS;
  const canvasSize = useMemo(
    () => resolveCanvasPresetSize(canvasSettings),
    [canvasSettings]
  );
  const effectiveRuntimeMode = useMemo(() => {
    const viewportWidth =
      canvasViewportSize.width > 0
        ? canvasViewportSize.width
        : typeof window !== "undefined"
          ? window.innerWidth
          : 0;
    if (viewportWidth > 0 && viewportWidth <= 1200) return "fit";
    return canvasSettings.runtimeMode;
  }, [canvasSettings.runtimeMode, canvasViewportSize.width]);
  const canvasScale = useMemo(
    () => {
      const scale = resolveCanvasFitScale(
        effectiveRuntimeMode,
        canvasSize,
        canvasViewportSize
      );
      // Keep a tiny margin to avoid 1px overflow caused by browser chrome and rounding.
      return effectiveRuntimeMode === "fit" ? scale * 0.99 : scale;
    },
    [effectiveRuntimeMode, canvasSize, canvasViewportSize]
  );
  const scaledCanvasSize = useMemo(
    () => ({
      width: Math.max(1, Math.floor(canvasSize.width * canvasScale)),
      height: Math.max(1, Math.floor(canvasSize.height * canvasScale)),
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

  const isMeasureScreen =
    activeScreenId === PLAY_PETANQUE_MEASURES_SCREEN_ID;

  const resolveSliderChannel = (
    widget: Extract<CanvasWidget, { kind: "slider" }>
  ): SliderChannel => {
    const topic = widget.topic.toLowerCase();
    const looksLikeRotationZ =
      topic.includes("joystick_rz") ||
      topic.includes("angular_z") ||
      topic.endsWith("/rz");
    if (looksLikeRotationZ) return "rz";

    const looksLikeTranslationZ =
      topic.includes("joystick_z") ||
      topic.includes("linear_z") ||
      topic.endsWith("/z");
    if (looksLikeTranslationZ) return "z";

    return widget.binding === "z" ? "z" : "rz";
  };

  const advancePetanqueFlow = (command: PetanqueStateCommand) => {
    const nextStage = resolvePetanqueFlowStageAfterCommand(command);
    if (nextStage) {
      setPetanqueFlowStage(nextStage);
    }
  };

  const sendPetanqueStateCommand = (command: PetanqueStateCommand) => {
    wsClient.send({
      type: "state_cmd",
      command,
    });
    advancePetanqueFlow(command);
  };

  const setPetanqueAlpha = (nextValue: number) => {
    const clamped = Math.max(0, Math.min(PETANQUE_ALPHA_MAX, nextValue));
    if (clamped <= PETANQUE_ALPHA_SAFE_MAX) {
      alphaUnsafeValidatedRef.current = false;
    }
    setThrowDrawAlphaValues((prev) => {
      const next = { ...prev };
      for (const widget of widgets) {
        if (widget.kind === "throw-draw" && widget.alphaTopic === PETANQUE_ALPHA_TOPIC) {
          next[widget.id] = clamped;
        }
      }
      return next;
    });
    setMaxVelocityWidgetValues((prev) => {
      const next = { ...prev };
      for (const widget of widgets) {
        if (widget.kind === "max-velocity" && widget.topic === PETANQUE_ALPHA_TOPIC) {
          next[widget.id] = clamped;
        }
      }
      return next;
    });
    wsClient.send({
      type: "petanque_cfg",
      alpha: clamped,
    });
  };

  const triggerPetanqueAlphaPreset = (preset: PetanqueAlphaPreset) => {
    const alpha = preset === "pointer" ? PETANQUE_ALPHA_POINTER : PETANQUE_ALPHA_TIRER;
    setPetanqueAlpha(alpha);
    sendPetanqueStateCommand("throw");
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
        const channel = resolveSliderChannel(widget);
        const value = channel === "z" ? z : rz;
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
        const channel = resolveSliderChannel(widget);
        if (channel === "z") {
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
      const runtimeTextWidget =
        isMeasureScreen && widget.topic === PLAY_PETANQUE_MEASURE_STATUS_TOPIC
          ? {
              ...widget,
              text: formatMeasureStatusText(measureStatusText, measureLastUpdatedAtMs),
            }
          : widget;
      return (
        <TextWidget
          key={widget.id}
          widget={runtimeTextWidget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onTextChange={NOOP_TEXT_CHANGE}
        />
      );
    }

    if (widget.kind === "textarea") {
      const runtimeTextareaWidget =
        isMeasureScreen && widget.topic === PLAY_PETANQUE_MEASURE_VECTORS_TOPIC
          ? {
              ...widget,
              text: formatMeasureVectorsText(measureVectorsJson),
            }
          : widget;
      return (
        <TextareaWidget
          key={widget.id}
          widget={runtimeTextareaWidget}
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
      const petanqueAlphaPreset =
        widget.topic === PETANQUE_ALPHA_PRESET_TOPIC
          ? resolvePetanqueAlphaPreset(widget.payload)
          : null;
      const isPetanqueAlphaPresetButton = petanqueAlphaPreset !== null;
      const isTeleopConfigButton = isTeleopConfigButtonTopic(widget.topic);
      const isMeasureButton =
        isMeasureScreen && isMeasureButtonTopic(widget.topic);
      const petanqueButtonState = isStateMachineButton && petanqueCommand
        ? getPetanqueButtonState(petanqueCommand, petanqueFlowStage)
        : null;
      const petanqueAlphaPresetDisabled =
        isPetanqueAlphaPresetButton && petanqueFlowStage !== "start_ready";
      const petanqueAlphaPresetTone =
        petanqueAlphaPreset === "pointer"
          ? "success"
          : petanqueAlphaPreset === "tirer"
            ? "danger"
            : widget.tone ?? "default";
      const teleopConfigButtonState = isTeleopConfigButton
        ? getTeleopConfigButtonState(widget.topic, {
            swapXY,
            invertLinearX,
            invertLinearY,
            invertLinearZ,
            invertAngularX,
            invertAngularY,
            invertAngularZ,
          })
        : null;
      const measureButtonState = isMeasureButton
        ? getMeasureButtonState(
            widget.topic,
            measureViewMode,
            measureRequestPending,
            widget.tone ?? "default"
          )
        : null;
      const runtimeButtonWidget = isTeleopConfigButton
        ? {
            ...widget,
            label: getTeleopConfigButtonLabel(widget.topic, widget.label, {
              swapXY,
              invertLinearX,
              invertLinearY,
              invertLinearZ,
              invertAngularX,
              invertAngularY,
              invertAngularZ,
            }),
          }
        : isMeasureButton && widget.topic === PLAY_PETANQUE_MEASURE_REQUEST_TOPIC && measureRequestPending
          ? { ...widget, label: "Measuring..." }
          : widget;

      return (
        <ActionButtonWidget
          key={widget.id}
          widget={runtimeButtonWidget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          disabled={
            isMeasureButton
              ? (measureButtonState?.disabled ?? false)
              : isPetanqueAlphaPresetButton
                ? petanqueAlphaPresetDisabled
              : (petanqueButtonState?.disabled ?? false)
          }
          active={
            isMeasureButton
              ? (measureButtonState?.active ?? false)
              : isPetanqueAlphaPresetButton
                ? false
              : (petanqueButtonState?.active ?? teleopConfigButtonState?.active ?? false)
          }
          tone={
            isMeasureButton
              ? (measureButtonState?.tone ?? (widget.tone ?? "default"))
              : isPetanqueAlphaPresetButton
                ? petanqueAlphaPresetTone
              : (
                  petanqueButtonState?.tone ??
                  teleopConfigButtonState?.tone ??
                  widget.tone ??
                  "default"
                )
          }
          onTrigger={() => {
            if (isMeasureButton) {
              const handled = triggerMeasureButton(
                widget.topic,
                widget.id,
                {
                  capturedMeasureImageDataUrl,
                  measureResultImageDataUrl,
                  widgets,
                },
                {
                  setMeasureViewMode,
                  setMeasureStatusText,
                  setCapturedMeasureImageDataUrl,
                  setMeasureRequestPending,
                  markWidgetPulse,
                  sendMessage: (message) => wsClient.send(message),
                }
              );
              if (handled) return;
            }

            if (isPetanqueAlphaPresetButton && petanqueAlphaPreset) {
              if (petanqueAlphaPresetDisabled) return;
              triggerPetanqueAlphaPreset(petanqueAlphaPreset);
              markWidgetPulse(widget.id);
              return;
            }

            if (isStateMachineButton && petanqueCommand) {
              if (petanqueButtonState?.disabled) return;
              sendPetanqueStateCommand(petanqueCommand);
              markWidgetPulse(widget.id);
              return;
            }

            if (isTeleopConfigButton) {
              const changed = triggerTeleopConfigButton(
                widget.topic,
                {
                  swapXY,
                  invertLinearX,
                  invertLinearY,
                  invertLinearZ,
                  invertAngularX,
                  invertAngularY,
                  invertAngularZ,
                },
                {
                  setSwapXY,
                  setInvertLinearX,
                  setInvertLinearY,
                  setInvertLinearZ,
                  setInvertAngularX,
                  setInvertAngularY,
                  setInvertAngularZ,
                  resetTeleopConfig,
                  saveTeleopProfile,
                }
              );
              if (changed) {
                markWidgetPulse(widget.id);
              }
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

    if (widget.kind === "throw-draw") {
      const angleMin = Math.min(widget.angleMin, widget.angleMax);
      const angleMax = Math.max(widget.angleMin, widget.angleMax);
      const durationMin = Math.min(widget.durationMin, widget.durationMax);
      const durationMax = Math.max(widget.durationMin, widget.durationMax);
      const hasAlphaControl =
        typeof widget.alphaTopic === "string" && widget.alphaTopic.trim().length > 0;
      const alphaMin = Math.min(widget.alphaMin ?? 0, widget.alphaMax ?? PETANQUE_ALPHA_MAX);
      const alphaMax = Math.max(widget.alphaMin ?? 0, widget.alphaMax ?? PETANQUE_ALPHA_MAX);
      const alphaWidget =
        hasAlphaControl
          ? widgets.find(
              (candidate) =>
                candidate.kind === "max-velocity" && candidate.topic === widget.alphaTopic
            ) ?? null
          : null;
      const drawAlphaValueFromState = throwDrawAlphaValues[widget.id];
      const alphaWidgetValue = alphaWidget ? maxVelocityWidgetValues[alphaWidget.id] : undefined;
      const drawAlphaValue = hasAlphaControl
        ? typeof drawAlphaValueFromState === "number"
          ? drawAlphaValueFromState
          : typeof alphaWidgetValue === "number"
          ? alphaWidgetValue
          : widget.alphaTopic === PETANQUE_ALPHA_TOPIC
            ? PETANQUE_DEFAULT_ALPHA
            : alphaMin
        : undefined;
      const defaultDuration =
        widget.powerTopic === PETANQUE_TOTAL_DURATION_TOPIC
          ? PETANQUE_DEFAULT_TOTAL_DURATION_S
          : durationMax;
      const drawValue = throwDrawWidgetValues[widget.id] ?? {
        angle: Math.max(angleMin, Math.min(angleMax, 0)),
        duration: Math.max(durationMin, Math.min(durationMax, defaultDuration)),
      };
      const clampedAngle = Math.max(angleMin, Math.min(angleMax, drawValue.angle));
      const clampedDuration = Math.max(durationMin, Math.min(durationMax, drawValue.duration));
      const applyDrawAlpha = (rawNextAlpha: number) => {
        if (!hasAlphaControl) return;
        let resolvedAlpha = Math.max(alphaMin, Math.min(alphaMax, rawNextAlpha));
        setThrowDrawAlphaValues((prev) => ({
          ...prev,
          [widget.id]: resolvedAlpha,
        }));
        if (widget.alphaTopic === PETANQUE_ALPHA_TOPIC) {
          if (resolvedAlpha > PETANQUE_ALPHA_SAFE_MAX) {
            if (!alphaUnsafeValidatedRef.current) {
              const confirmed = window.confirm(
                `Alpha above ${PETANQUE_ALPHA_SAFE_MAX} is not safe. Validate this value?`
              );
              if (!confirmed) {
                resolvedAlpha = PETANQUE_ALPHA_SAFE_MAX;
              } else {
                alphaUnsafeValidatedRef.current = true;
              }
            }
          } else {
            alphaUnsafeValidatedRef.current = false;
          }
          setThrowDrawAlphaValues((prev) => ({
            ...prev,
            [widget.id]: resolvedAlpha,
          }));
          setPetanqueAlpha(resolvedAlpha);
          return;
        }
        setMaxVelocityWidgetValues((prev) => {
          const nextValues = { ...prev };
          for (const candidate of widgets) {
            if (candidate.kind !== "max-velocity") continue;
            if (candidate.topic === widget.alphaTopic) {
              nextValues[candidate.id] = resolvedAlpha;
            }
          }
          return nextValues;
        });
      };
      return (
        <ThrowDrawWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          angleValue={clampedAngle}
          durationValue={clampedDuration}
          alphaValue={drawAlphaValue}
          onAlphaChange={hasAlphaControl ? (nextAlpha) => applyDrawAlpha(nextAlpha) : undefined}
          onValueChange={(next) => {
            const resolvedAngle =
              typeof next.angle === "number"
                ? Math.max(angleMin, Math.min(angleMax, next.angle))
                : clampedAngle;
            const resolvedDuration =
              typeof next.duration === "number"
                ? Math.max(durationMin, Math.min(durationMax, next.duration))
                : clampedDuration;

            setThrowDrawWidgetValues((prev) => ({
              ...prev,
              [widget.id]: {
                angle: resolvedAngle,
                duration: resolvedDuration,
              },
            }));

            setMaxVelocityWidgetValues((prev) => {
              const nextValues = { ...prev };
              for (const candidate of widgets) {
                if (candidate.kind !== "max-velocity") continue;
                if (candidate.topic === widget.angleTopic) {
                  nextValues[candidate.id] = resolvedAngle;
                }
                if (candidate.topic === widget.powerTopic) {
                  nextValues[candidate.id] = resolvedDuration;
                }
              }
              return nextValues;
            });

            const cfg: {
              total_duration?: number;
              angle_between_start_and_finish?: number;
            } = {};
            if (widget.powerTopic === PETANQUE_TOTAL_DURATION_TOPIC) {
              cfg.total_duration = clampPetanqueDuration(resolvedDuration);
            }
            if (widget.angleTopic === PETANQUE_ANGLE_TOPIC) {
              cfg.angle_between_start_and_finish = resolvedAngle;
            }
            if (
              cfg.total_duration !== undefined ||
              cfg.angle_between_start_and_finish !== undefined
            ) {
              wsClient.send({
                type: "petanque_cfg",
                ...cfg,
              });
            }
            if (typeof next.alpha === "number") {
              applyDrawAlpha(next.alpha);
            }
            if (next.throwRequested) {
              sendPetanqueStateCommand("throw");
            }
            markWidgetPulse(widget.id);
          }}
        />
      );
    }

    if (widget.kind === "max-velocity") {
      const widgetValue =
        resolveTeleopConfigScalarValue(widget.topic, {
          maxVelocity,
          translationGain,
          rotationGain,
          scaleX,
          scaleY,
          scaleZ,
          angularScaleX,
          angularScaleY,
          angularScaleZ,
        }) ??
        (typeof maxVelocityWidgetValues[widget.id] === "number"
          ? maxVelocityWidgetValues[widget.id]
          : widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
            ? PETANQUE_DEFAULT_TOTAL_DURATION_S
            : widget.topic === PETANQUE_ANGLE_TOPIC
              ? 0
              : widget.topic === PETANQUE_ALPHA_TOPIC
                ? PETANQUE_DEFAULT_ALPHA
                : 1);
      const reverseDirection =
        widget.reverseDirection ??
        widget.topic === PETANQUE_TOTAL_DURATION_TOPIC;
      const endpointLabels =
        widget.endpointLeftLabel || widget.endpointRightLabel
          ? {
              left: widget.endpointLeftLabel,
              right: widget.endpointRightLabel,
            }
          : widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
            ? { left: "Slow", right: "Fast" }
            : widget.topic === PETANQUE_ANGLE_TOPIC
              ? { left: "Left", right: "Right" }
              : widget.topic === PETANQUE_ALPHA_TOPIC
                ? { left: "Tirer", right: "Pointer" }
                : undefined;
      const bubbleMode =
        widget.bubbleMode ??
        (widget.topic === PETANQUE_ANGLE_TOPIC
          ? "degrees"
          : widget.topic === PETANQUE_ALPHA_TOPIC
            ? "degrees-unit"
            : widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
              ? "power"
              : "number");
      const bubbleValueFormatter =
        bubbleMode === "degrees"
          ? (rawValue: number) => `${((rawValue * 180) / Math.PI).toFixed(1)}°`
          : bubbleMode === "degrees-unit"
            ? (rawValue: number) => `${rawValue.toFixed(1)}°`
            : bubbleMode === "power"
              ? (rawValue: number) =>
                  formatMaxVelocityPowerPercent(rawValue, widget.min, widget.max, reverseDirection)
              : undefined;
      const unsafeThreshold =
        typeof widget.unsafeThreshold === "number"
          ? widget.unsafeThreshold
          : widget.topic === PETANQUE_ALPHA_TOPIC
            ? PETANQUE_ALPHA_SAFE_MAX
            : undefined;
      return (
        <MaxVelocityWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          value={widgetValue}
          endpointLabels={endpointLabels}
          bubbleValueFormatter={bubbleValueFormatter}
          unsafeThreshold={unsafeThreshold}
          reverseDirection={reverseDirection}
          onValueChange={(nextValue) => {
            let resolvedNextValue = nextValue;
            if (widget.topic === PETANQUE_ALPHA_TOPIC) {
              if (typeof unsafeThreshold === "number" && nextValue > unsafeThreshold) {
                if (!alphaUnsafeValidatedRef.current) {
                  const confirmed = window.confirm(
                    `Alpha above ${unsafeThreshold} is not safe. Validate this value?`
                  );
                  if (!confirmed) {
                    resolvedNextValue = unsafeThreshold;
                  } else {
                    alphaUnsafeValidatedRef.current = true;
                  }
                }
              } else {
                alphaUnsafeValidatedRef.current = false;
              }
            }
            setMaxVelocityWidgetValues((prev) => ({
              ...prev,
              [widget.id]: resolvedNextValue,
            }));
            applyTeleopConfigScalarValue(widget.topic, resolvedNextValue, {
              setMaxVelocity,
              setTranslationGain,
              setRotationGain,
              setScaleX,
              setScaleY,
              setScaleZ,
              setAngularScaleX,
              setAngularScaleY,
              setAngularScaleZ,
            });
            if (widget.topic === PETANQUE_TOTAL_DURATION_TOPIC) {
              wsClient.send({
                type: "petanque_cfg",
                total_duration: clampPetanqueDuration(resolvedNextValue),
              });
            }
            if (widget.topic === PETANQUE_ANGLE_TOPIC) {
              wsClient.send({
                type: "petanque_cfg",
                angle_between_start_and_finish: resolvedNextValue,
              });
            }
            if (widget.topic === PETANQUE_ALPHA_TOPIC) {
              wsClient.send({
                type: "petanque_cfg",
                alpha: resolvedNextValue,
              });
            }
            if (!isLocalMaxVelocityTopic(widget.topic)) {
              wsClient.send({
                type: "ui_scalar",
                topic: widget.topic,
                value: resolvedNextValue,
                widget_id: widget.id,
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
          activeState={
            wsState?.gripper_state === "open" || wsState?.gripper_state === "close"
              ? wsState.gripper_state
              : null
          }
          onOpen={() => wsClient.send({ type: "gripper_cmd", action: "open" })}
          onClose={() => wsClient.send({ type: "gripper_cmd", action: "close" })}
        />
      );
    }

    if (widget.kind === "magnet-control") {
      return (
        <MagnetControlWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          onActivate={() => {
            wsClient.send({
              type: "ui_button",
              topic: widget.topic,
              payload: widget.onPayload,
              widget_id: widget.id,
            });
            markWidgetPulse(widget.id);
          }}
          onDeactivate={() => {
            wsClient.send({
              type: "ui_button",
              topic: widget.topic,
              payload: widget.offPayload,
              widget_id: widget.id,
            });
            markWidgetPulse(widget.id);
          }}
        />
      );
    }

    if (widget.kind === "stream-display") {
      const runtimeStreamWidget =
        isMeasureScreen &&
        widget.id === PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID &&
        measureViewMode === "result"
          ? {
              ...widget,
              source: "visualization" as const,
              streamUrl: measureResultImageDataUrl ?? "",
              showWebcamPicker: false,
              overlayText:
                resolveMeasureResultOverlayText(measureResultImageDataUrl),
            }
          : widget;
      const url =
        runtimeStreamWidget.source === "camera"
          ? cameraStreamUrl
          : runtimeStreamWidget.source === "rviz"
            ? rvizStreamUrl
            : runtimeStreamWidget.source === "visualization"
              ? resolveVisualizationUrlForRuntime(runtimeStreamWidget.streamUrl)
              : runtimeStreamWidget.streamUrl;
      const sourceStatus =
        runtimeStreamWidget.source === "rviz"
          ? "RViz stream"
          : runtimeStreamWidget.source === "visualization"
            ? "Visualization stream"
            : runtimeStreamWidget.source === "webcam"
              ? "Webcam stream"
              : "Camera stream";
      return (
        <StreamDisplayWidget
          key={widget.id}
          widget={{
            ...runtimeStreamWidget,
            streamUrl: url || runtimeStreamWidget.streamUrl,
            fitMode: runtimeStreamWidget.fitMode ?? "contain",
            showStatus: runtimeStreamWidget.showStatus ?? true,
            showUrl: runtimeStreamWidget.showUrl ?? true,
            overlayText: runtimeStreamWidget.overlayText ?? "stream preview",
          }}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          statusText={sourceStatus}
        />
      );
    }

    if (widget.kind === "drink") {
      return (
        <DrinkWidget
          key={widget.id}
          widget={widget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
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
      const channel = resolveSliderChannel(widget);
      const value = channel === "z" ? z : rz;
      const onChange = channel === "z" ? setZ : setRz;
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

  const canvasViewportClassName = `controls-canvas-viewport controls-canvas-mode-${effectiveRuntimeMode}`;
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
  const topBarSlotElement =
    typeof document !== "undefined"
      ? document.getElementById("topbar-controls-slot")
      : null;
  const runtimeScreenIds = activeApplication?.screenIds ?? [];
  const runtimeScreenTabs =
    showRuntimeScreenTabs && topBarSlotElement
      ? createPortal(
          <div className="application-runtime-topbar-tabs">
            {runtimeScreenIds.map((screenId) => (
              <button
                key={screenId}
                type="button"
                className={`tab-button ${screenId === activeScreenId ? "active" : ""}`}
                onClick={() => onNavigateToScreen(screenId)}
              >
                {screenId}
              </button>
            ))}
          </div>,
          topBarSlotElement
        )
      : null;

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
          <div className="controls-canvas-surface">
            <div className={canvasViewportClassName} ref={canvasViewportRef}>
              <div className="controls-canvas-frame" style={canvasFrameStyle}>
                <div className="controls-canvas-transform" style={canvasTransformStyle}>
                  <div className="controls-canvas" style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}>
                    {runtimeWidgets.map(renderWidget)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {runtimeScreenTabs}
    </main>
  );
}
