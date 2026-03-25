import { upsertMeasureResultHistory, type MeasureResultHistoryEntry } from "../../pages/applicationMeasureRuntime";
import type { WsMeasureResultMessage } from "../../types/ws";
import type {
  ApplicationRuntimeMatchArgs,
  ApplicationRuntimePlugin,
} from "./types";

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
};
