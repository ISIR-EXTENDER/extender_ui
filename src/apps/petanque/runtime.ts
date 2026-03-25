import type { WsMeasureResultMessage } from "../../types/ws";
import {
  PLAY_PETANQUE_MEASURES_SCREEN_ID,
  formatMeasureStatusText,
  formatMeasureVectorsText,
  resolveMeasureResultOverlayText,
  upsertMeasureResultHistory,
  type MeasureResultHistoryEntry,
  triggerMeasureButton,
} from "./measureRuntime";
import type {
  ApplicationRuntimeMatchArgs,
  ApplicationRuntimePlugin,
} from "../../app/runtime/types";
import {
  getMeasureButtonState,
  getPetanqueButtonState,
  isMeasureButtonTopic,
  resolvePetanqueAlphaPreset,
  isPetanqueStateCommand,
  resolvePetanqueFlowStageAfterCommand,
} from "./buttonRuntime";
import {
  buildPetanqueStateCommandMessage,
  isPetanqueMaxVelocityTopic,
  resolvePetanqueAlphaPresetValue,
  resolvePetanqueMaxVelocityPresentation,
  resolvePetanqueMaxVelocityValue,
} from "./controlRuntime";
import {
  handlePetanqueThrowDrawChange,
  resolvePetanqueThrowDrawState,
} from "./throwDrawRuntime";
import { handlePetanqueMaxVelocityChange } from "./maxVelocityRuntime";
import {
  PETANQUE_ALPHA_PRESET_TOPIC,
  PETANQUE_STATE_TOPIC,
  PLAY_PETANQUE_MEASURE_STATUS_TOPIC,
  PLAY_PETANQUE_MEASURE_REQUEST_TOPIC,
  PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID,
  PLAY_PETANQUE_MEASURE_VECTORS_TOPIC,
} from "../../pages/applicationTopics";

const PETANQUE_RUNTIME_SCREEN_IDS = new Set([
  "petanque",
  "petanque_teleop_config",
  "play_petanque_camera",
  "play_petanque_lancer",
  "play_petanque_lancer_draw",
  "play_petanque_ramassage",
  "play_petanque_measures",
  "petanque_draw",
]);

const hasPetanqueScreen = ({ application, activeScreenId }: ApplicationRuntimeMatchArgs) =>
  (activeScreenId != null && PETANQUE_RUNTIME_SCREEN_IDS.has(activeScreenId)) ||
  application?.screenIds.some((screenId) => PETANQUE_RUNTIME_SCREEN_IDS.has(screenId)) === true;

const updateMeasureHistory = (
  currentHistory: MeasureResultHistoryEntry[],
  message: WsMeasureResultMessage
) => {
  const resultImageDataUrl = message.image_data_url;
  if (!resultImageDataUrl) return currentHistory;
  return upsertMeasureResultHistory(currentHistory, {
    id: `measure-${message.updated_at_ms ?? Date.now()}`,
    imageDataUrl: resultImageDataUrl,
    vectorsJson: typeof message.vectors_json === "string" ? message.vectors_json : null,
    updatedAtMs: message.updated_at_ms ?? Date.now(),
    source: "opencv",
  });
};

export const petanqueRuntimePlugin: ApplicationRuntimePlugin = {
  id: "petanque",
  matches: hasPetanqueScreen,
  handleIncomingMessage: (args) => {
    if (args.message.type === "measure_result") {
      const resultImageDataUrl = args.message.image_data_url;
      const resultVectorsJson =
        typeof args.message.vectors_json === "string" ? args.message.vectors_json : null;

      if (resultImageDataUrl) {
        args.actions.setMeasureResultImageDataUrl(resultImageDataUrl);
        args.actions.setMeasureResultHistory(
          updateMeasureHistory(args.state.measureResultHistory, args.message)
        );
      }
      if (resultVectorsJson) {
        args.actions.setMeasureVectorsJson(resultVectorsJson);
      }
      args.actions.setMeasureLastUpdatedAtMs(args.message.updated_at_ms ?? Date.now());
      args.actions.setMeasureStatusText("Measure result updated");
      args.actions.setMeasureRequestPending(false);
      args.actions.setMeasureViewMode("result");
      return true;
    }

    if (
      args.message.type === "event" &&
      args.message.code.startsWith("MEASURE_") &&
      args.message.message.trim()
    ) {
      args.actions.setMeasureStatusText(args.message.message.trim());
      if (args.message.code === "MEASURE_REQUEST_FAILED") {
        args.actions.setMeasureRequestPending(false);
      }
      return true;
    }

    return false;
  },
  decorateWidget: (args) => {
    if (args.activeScreenId !== PLAY_PETANQUE_MEASURES_SCREEN_ID) {
      return null;
    }

    if (args.widget.kind === "text" && args.widget.topic === PLAY_PETANQUE_MEASURE_STATUS_TOPIC) {
      return {
        ...args.widget,
        text: formatMeasureStatusText(
          args.state.measureStatusText,
          args.state.measureLastUpdatedAtMs
        ),
      };
    }

    if (args.widget.kind === "textarea" && args.widget.topic === PLAY_PETANQUE_MEASURE_VECTORS_TOPIC) {
      return {
        ...args.widget,
        text: formatMeasureVectorsText(args.state.measureVectorsJson),
      };
    }

    if (
      args.widget.kind === "stream-display" &&
      args.widget.id === PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID &&
      args.state.measureViewMode === "result"
    ) {
      return {
        ...args.widget,
        source: "visualization",
        streamUrl: args.state.measureResultImageDataUrl ?? "",
        showWebcamPicker: false,
        overlayText: resolveMeasureResultOverlayText(args.state.measureResultImageDataUrl),
      };
    }

    return null;
  },
  getButtonPresentation: (args) => {
    const petanqueAlphaPreset =
      args.widget.topic === PETANQUE_ALPHA_PRESET_TOPIC
        ? resolvePetanqueAlphaPreset(args.widget.payload)
        : null;
    if (petanqueAlphaPreset) {
      return {
        disabled: args.state.petanqueFlowStage !== "start_ready",
        active: false,
        tone: petanqueAlphaPreset === "pointer" ? "success" : "danger",
      };
    }

    const petanqueCommand = isPetanqueStateCommand(args.widget.payload)
      ? args.widget.payload
      : null;
    const isStateMachineButton =
      args.widget.topic === PETANQUE_STATE_TOPIC && petanqueCommand !== null;
    if (isStateMachineButton && petanqueCommand) {
      return getPetanqueButtonState(petanqueCommand, args.state.petanqueFlowStage);
    }

    const isMeasureButton = isMeasureButtonTopic(args.widget.topic);
    if (isMeasureButton) {
      const buttonState = getMeasureButtonState(
        args.widget.topic,
        args.state.measureViewMode,
        args.state.measureRequestPending,
        args.widget.tone ?? "default"
      );
      return {
        ...buttonState,
        label:
          args.widget.topic === PLAY_PETANQUE_MEASURE_REQUEST_TOPIC &&
          args.state.measureRequestPending
            ? "Measuring..."
            : undefined,
      };
    }

    return null;
  },
  getMaxVelocityState: (args) => {
    if (!isPetanqueMaxVelocityTopic(args.widget.topic)) {
      return null;
    }
    const value = resolvePetanqueMaxVelocityValue(
      args.widget.topic,
      args.widget.id,
      args.state.maxVelocityWidgetValues
    );
    const presentation = resolvePetanqueMaxVelocityPresentation(args.widget);

    return {
      value,
      endpointLabels: presentation.endpointLabels,
      bubbleValueFormatter: presentation.bubbleValueFormatter,
      reverseDirection: presentation.reverseDirection,
      unsafeThreshold: presentation.unsafeThreshold,
    };
  },
  handleMaxVelocityChange: (args) => handlePetanqueMaxVelocityChange(args),
  getThrowDrawState: (args) => {
    const state = resolvePetanqueThrowDrawState(args);
    return {
      angleValue: state.angleValue,
      durationValue: state.durationValue,
      alphaValue: state.alphaValue,
      hasAlphaControl: state.hasAlphaControl,
    };
  },
  handleButtonTrigger: (args) => {
    const petanqueAlphaPreset =
      args.widget.topic === PETANQUE_ALPHA_PRESET_TOPIC
        ? resolvePetanqueAlphaPreset(args.widget.payload)
        : null;
    if (petanqueAlphaPreset) {
      if (args.state.petanqueFlowStage !== "start_ready") return true;
      args.actions.setPetanqueAlpha(resolvePetanqueAlphaPresetValue(petanqueAlphaPreset));
      args.actions.sendMessage(buildPetanqueStateCommandMessage("throw"));
      args.actions.setPetanqueFlowStage("start_ready");
      args.actions.markWidgetPulse(args.widget.id);
      return true;
    }

    const petanqueCommand = isPetanqueStateCommand(args.widget.payload)
      ? args.widget.payload
      : null;
    const isStateMachineButton =
      args.widget.topic === PETANQUE_STATE_TOPIC && petanqueCommand !== null;
    if (isStateMachineButton && petanqueCommand) {
      const buttonState = getPetanqueButtonState(petanqueCommand, args.state.petanqueFlowStage);
      if (buttonState.disabled) return true;
      args.actions.sendMessage({
        type: "state_cmd",
        command: petanqueCommand,
      });
      const nextStage = resolvePetanqueFlowStageAfterCommand(petanqueCommand);
      if (nextStage) {
        args.actions.setPetanqueFlowStage(nextStage);
      }
      args.actions.markWidgetPulse(args.widget.id);
      return true;
    }

    if (!isMeasureButtonTopic(args.widget.topic)) {
      return false;
    }

    return triggerMeasureButton(
      args.widget.topic,
      args.widget.id,
      {
        capturedMeasureImageDataUrl: args.state.capturedMeasureImageDataUrl,
        measureResultImageDataUrl: args.state.measureResultImageDataUrl,
        widgets: args.widgets,
      },
      {
        setMeasureViewMode: args.actions.setMeasureViewMode,
        setMeasureStatusText: args.actions.setMeasureStatusText,
        setCapturedMeasureImageDataUrl: args.actions.setCapturedMeasureImageDataUrl,
        setMeasureRequestPending: args.actions.setMeasureRequestPending,
        markWidgetPulse: args.actions.markWidgetPulse,
        sendMessage: (message) => args.actions.sendMessage(message),
      }
    );
  },
  handleThrowDrawChange: (args) => handlePetanqueThrowDrawChange(args),
};
