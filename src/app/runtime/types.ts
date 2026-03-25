import type { ApplicationConfig } from "../applications";
import type { CanvasWidget } from "../../components/widgets";
import type {
  MeasureResultHistoryEntry,
  MeasureViewMode,
} from "../../pages/applicationMeasureRuntime";
import type { WsIncoming } from "../../types/ws";

export type ApplicationRuntimeMatchArgs = {
  application: ApplicationConfig | null;
  activeScreenId: string | null;
};

export type ApplicationRuntimeMessageActions = {
  setMeasureResultImageDataUrl: (value: string | null) => void;
  setMeasureVectorsJson: (value: string | null) => void;
  setMeasureLastUpdatedAtMs: (value: number | null) => void;
  setMeasureStatusText: (value: string) => void;
  setMeasureRequestPending: (value: boolean) => void;
  setMeasureViewMode: (value: MeasureViewMode) => void;
  setMeasureResultHistory: (value: MeasureResultHistoryEntry[]) => void;
};

export type ApplicationRuntimeMessageArgs = ApplicationRuntimeMatchArgs & {
  message: WsIncoming;
  widgets: CanvasWidget[];
  state: {
    measureResultHistory: MeasureResultHistoryEntry[];
  };
  actions: ApplicationRuntimeMessageActions;
};

export type ApplicationRuntimePlugin = {
  id: string;
  matches: (args: ApplicationRuntimeMatchArgs) => boolean;
  handleIncomingMessage?: (args: ApplicationRuntimeMessageArgs) => boolean;
};
