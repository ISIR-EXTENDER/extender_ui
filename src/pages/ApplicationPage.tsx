import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { loadApplicationsFromLocalStorage } from "../app/applications";
import type { CanvasRect } from "../components/layout/CanvasItem";
import {
  ActionButtonWidget,
  CurvesWidget,
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
  gripperCardsVisible?: boolean;
  modeButtonsVisible?: boolean;
};

const TOPIC_FRESHNESS_MS = 200;
const TOPIC_FRESHNESS_TICK_MS = 100;
const PETANQUE_STATE_TOPIC = "/petanque_state_machine/change_state";
const PETANQUE_TOTAL_DURATION_TOPIC = "/petanque_throw/total_duration";
const PETANQUE_ANGLE_TOPIC = "/petanque_throw/angle_between_start_and_finish";
const PETANQUE_TOTAL_DURATION_MIN_S = 0.9;
const PETANQUE_TOTAL_DURATION_MAX_S = 3.0;
const PETANQUE_DEFAULT_TOTAL_DURATION_S = 1.1;
const TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC = "/teleop_config/translation_gain";
const TELEOP_CONFIG_ROTATION_GAIN_TOPIC = "/teleop_config/rotation_gain";
const TELEOP_CONFIG_LINEAR_SCALE_X_TOPIC = "/teleop_config/linear_scale_x";
const TELEOP_CONFIG_LINEAR_SCALE_Y_TOPIC = "/teleop_config/linear_scale_y";
const TELEOP_CONFIG_LINEAR_SCALE_Z_TOPIC = "/teleop_config/linear_scale_z";
const TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC = "/teleop_config/angular_scale_x";
const TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC = "/teleop_config/angular_scale_y";
const TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC = "/teleop_config/angular_scale_z";
const TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC = "/teleop_config/scale_x";
const TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC = "/teleop_config/scale_y";
const TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC = "/teleop_config/scale_z";
const TELEOP_CONFIG_SWAP_XY_TOPIC = "/teleop_config/swap_xy";
const TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC = "/teleop_config/invert_linear_x";
const TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC = "/teleop_config/invert_linear_y";
const TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC = "/teleop_config/invert_linear_z";
const TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC = "/teleop_config/invert_angular_x";
const TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC = "/teleop_config/invert_angular_y";
const TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC = "/teleop_config/invert_angular_z";
const TELEOP_CONFIG_RESET_TOPIC = "/teleop_config/reset_defaults";
const TELEOP_CONFIG_SAVE_PROFILE_TOPIC = "/teleop_config/save_profile";
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
type SliderChannel = "z" | "rz";
type TeleopConfigButtonState = {
  active: boolean;
  tone: "default" | "accent" | "success" | "danger";
};

const clampSignedUnit = (value: number) => Math.max(-1, Math.min(1, value));
const clampPetanqueDuration = (durationSeconds: number) =>
  Math.max(PETANQUE_TOTAL_DURATION_MIN_S, Math.min(PETANQUE_TOTAL_DURATION_MAX_S, durationSeconds));

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
  const hasSentPetanqueDurationDefaultRef = useRef(false);
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

  const isPetanqueStateCommand = (value: string): value is PetanqueStateCommand =>
    (PETANQUE_COMMANDS as readonly string[]).includes(value);

  const isTeleopConfigButtonTopic = (topic: string) =>
    topic === TELEOP_CONFIG_SWAP_XY_TOPIC ||
    topic === TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC ||
    topic === TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC ||
    topic === TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC ||
    topic === TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC ||
    topic === TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC ||
    topic === TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC ||
    topic === TELEOP_CONFIG_RESET_TOPIC ||
    topic === TELEOP_CONFIG_SAVE_PROFILE_TOPIC;

  const getTeleopConfigButtonState = (topic: string): TeleopConfigButtonState | null => {
    if (topic === TELEOP_CONFIG_SWAP_XY_TOPIC) {
      return { active: swapXY, tone: swapXY ? "accent" : "default" };
    }
    if (topic === TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC) {
      return { active: invertLinearX, tone: invertLinearX ? "success" : "default" };
    }
    if (topic === TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC) {
      return { active: invertLinearY, tone: invertLinearY ? "success" : "default" };
    }
    if (topic === TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC) {
      return { active: invertLinearZ, tone: invertLinearZ ? "success" : "default" };
    }
    if (topic === TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC) {
      return { active: invertAngularX, tone: invertAngularX ? "danger" : "default" };
    }
    if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC) {
      return { active: invertAngularY, tone: invertAngularY ? "danger" : "default" };
    }
    if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC) {
      return { active: invertAngularZ, tone: invertAngularZ ? "danger" : "default" };
    }
    if (topic === TELEOP_CONFIG_RESET_TOPIC) {
      return { active: false, tone: "accent" };
    }
    if (topic === TELEOP_CONFIG_SAVE_PROFILE_TOPIC) {
      return { active: false, tone: "success" };
    }
    return null;
  };

  const getTeleopConfigButtonLabel = (widget: Extract<CanvasWidget, { kind: "button" }>) => {
    if (widget.topic === TELEOP_CONFIG_SWAP_XY_TOPIC) {
      return swapXY ? "Swap XY ON" : "Swap XY OFF";
    }
    if (widget.topic === TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC) {
      return invertLinearX ? "LX -" : "LX +";
    }
    if (widget.topic === TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC) {
      return invertLinearY ? "LY -" : "LY +";
    }
    if (widget.topic === TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC) {
      return invertLinearZ ? "LZ -" : "LZ +";
    }
    if (widget.topic === TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC) {
      return invertAngularX ? "AX -" : "AX +";
    }
    if (widget.topic === TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC) {
      return invertAngularY ? "AY -" : "AY +";
    }
    if (widget.topic === TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC) {
      return invertAngularZ ? "AZ -" : "AZ +";
    }
    return widget.label;
  };

  const triggerTeleopConfigButton = (topic: string) => {
    if (topic === TELEOP_CONFIG_SWAP_XY_TOPIC) {
      setSwapXY(!swapXY);
      return true;
    }
    if (topic === TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC) {
      setInvertLinearX(!invertLinearX);
      return true;
    }
    if (topic === TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC) {
      setInvertLinearY(!invertLinearY);
      return true;
    }
    if (topic === TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC) {
      setInvertLinearZ(!invertLinearZ);
      return true;
    }
    if (topic === TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC) {
      setInvertAngularX(!invertAngularX);
      return true;
    }
    if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC) {
      setInvertAngularY(!invertAngularY);
      return true;
    }
    if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC) {
      setInvertAngularZ(!invertAngularZ);
      return true;
    }
    if (topic === TELEOP_CONFIG_RESET_TOPIC) {
      resetTeleopConfig();
      return true;
    }
    if (topic === TELEOP_CONFIG_SAVE_PROFILE_TOPIC) {
      saveTeleopProfile("explorer");
      return true;
    }
    return false;
  };

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
      const isTeleopConfigButton = isTeleopConfigButtonTopic(widget.topic);
      const petanqueButtonState = isStateMachineButton && petanqueCommand
        ? getPetanqueButtonState(petanqueCommand)
        : null;
      const teleopConfigButtonState = isTeleopConfigButton
        ? getTeleopConfigButtonState(widget.topic)
        : null;
      const runtimeButtonWidget = isTeleopConfigButton
        ? { ...widget, label: getTeleopConfigButtonLabel(widget) }
        : widget;

      return (
        <ActionButtonWidget
          key={widget.id}
          widget={runtimeButtonWidget}
          selected={false}
          onSelect={() => {}}
          onRectChange={NOOP_RECT_CHANGE}
          onLabelChange={NOOP_TEXT_CHANGE}
          disabled={petanqueButtonState?.disabled ?? false}
          active={petanqueButtonState?.active ?? teleopConfigButtonState?.active ?? false}
          tone={
            petanqueButtonState?.tone ??
            teleopConfigButtonState?.tone ??
            widget.tone ??
            "default"
          }
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

            if (isTeleopConfigButton) {
              const changed = triggerTeleopConfigButton(widget.topic);
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

    if (widget.kind === "max-velocity") {
      const widgetValue =
        widget.topic === TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC
          ? translationGain
          : widget.topic === TELEOP_CONFIG_ROTATION_GAIN_TOPIC
            ? rotationGain
            : widget.topic === TELEOP_CONFIG_LINEAR_SCALE_X_TOPIC ||
                widget.topic === TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC
              ? scaleX
              : widget.topic === TELEOP_CONFIG_LINEAR_SCALE_Y_TOPIC ||
                  widget.topic === TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC
                ? scaleY
                : widget.topic === TELEOP_CONFIG_LINEAR_SCALE_Z_TOPIC ||
                    widget.topic === TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC
                  ? scaleZ
                  : widget.topic === TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC
                    ? angularScaleX
                    : widget.topic === TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC
                      ? angularScaleY
                      : widget.topic === TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC
                        ? angularScaleZ
            : typeof maxVelocityWidgetValues[widget.id] === "number"
              ? maxVelocityWidgetValues[widget.id]
              : widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
                ? PETANQUE_DEFAULT_TOTAL_DURATION_S
                : widget.topic === PETANQUE_ANGLE_TOPIC
                  ? 0
                  : widget.topic === "/cmd/max_velocity"
                    ? maxVelocity
                    : 1;
      const valueLabel =
        widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
          ? `duration: ${widgetValue.toFixed(1)}s`
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
          valueLabel={valueLabel}
          reverseDirection={
            widget.topic === PETANQUE_ANGLE_TOPIC ||
            widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
          }
          onValueChange={(nextValue) => {
            setMaxVelocityWidgetValues((prev) => ({
              ...prev,
              [widget.id]: nextValue,
            }));
            if (widget.topic === "/cmd/max_velocity") {
              setMaxVelocity(nextValue);
            }
            if (widget.topic === TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC) {
              setTranslationGain(nextValue);
            }
            if (widget.topic === TELEOP_CONFIG_ROTATION_GAIN_TOPIC) {
              setRotationGain(nextValue);
            }
            if (
              widget.topic === TELEOP_CONFIG_LINEAR_SCALE_X_TOPIC ||
              widget.topic === TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC
            ) {
              setScaleX(nextValue);
            }
            if (
              widget.topic === TELEOP_CONFIG_LINEAR_SCALE_Y_TOPIC ||
              widget.topic === TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC
            ) {
              setScaleY(nextValue);
            }
            if (
              widget.topic === TELEOP_CONFIG_LINEAR_SCALE_Z_TOPIC ||
              widget.topic === TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC
            ) {
              setScaleZ(nextValue);
            }
            if (widget.topic === TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC) {
              setAngularScaleX(nextValue);
            }
            if (widget.topic === TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC) {
              setAngularScaleY(nextValue);
            }
            if (widget.topic === TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC) {
              setAngularScaleZ(nextValue);
            }
            if (widget.topic === PETANQUE_TOTAL_DURATION_TOPIC) {
              wsClient.send({
                type: "petanque_cfg",
                total_duration: clampPetanqueDuration(nextValue),
              });
            }
            if (widget.topic === PETANQUE_ANGLE_TOPIC) {
              wsClient.send({
                type: "petanque_cfg",
                angle_between_start_and_finish: nextValue,
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
          onOpen={() => wsClient.send({ type: "gripper_cmd", action: "close" })}
          onClose={() => wsClient.send({ type: "gripper_cmd", action: "open" })}
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
