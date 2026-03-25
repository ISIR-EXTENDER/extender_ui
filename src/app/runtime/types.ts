import type { ApplicationConfig } from "../applications";
import type { CanvasWidget } from "../../components/widgets";
import type {
  MeasureResultHistoryEntry,
  MeasureViewMode,
} from "../../pages/applicationMeasureRuntime";
import type { PetanqueFlowStage } from "../../pages/applicationRuntimeButtons";
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
  setCapturedMeasureImageDataUrl: (value: string) => void;
  setPetanqueFlowStage: (value: PetanqueFlowStage) => void;
  markWidgetPulse: (widgetId: string) => void;
  sendMessage: (payload: object) => void;
};

export type ApplicationRuntimeState = {
  petanqueFlowStage: PetanqueFlowStage;
  measureViewMode: MeasureViewMode;
  measureRequestPending: boolean;
  measureResultImageDataUrl: string | null;
  capturedMeasureImageDataUrl: string | null;
  measureResultHistory: MeasureResultHistoryEntry[];
};

export type ApplicationRuntimeMessageArgs = ApplicationRuntimeMatchArgs & {
  message: WsIncoming;
  widgets: CanvasWidget[];
  state: ApplicationRuntimeState;
  actions: ApplicationRuntimeMessageActions;
};

export type ApplicationRuntimeButtonTone = "default" | "accent" | "success" | "danger";

export type ApplicationRuntimeButtonPresentation = {
  disabled?: boolean;
  active?: boolean;
  tone?: ApplicationRuntimeButtonTone;
  label?: string;
};

export type ApplicationRuntimeButtonArgs = ApplicationRuntimeMatchArgs & {
  widget: Extract<CanvasWidget, { kind: "button" }>;
  widgets: CanvasWidget[];
  state: ApplicationRuntimeState;
  actions: ApplicationRuntimeMessageActions;
};

export type ApplicationRuntimePlugin = {
  id: string;
  matches: (args: ApplicationRuntimeMatchArgs) => boolean;
  handleIncomingMessage?: (args: ApplicationRuntimeMessageArgs) => boolean;
  getButtonPresentation?: (
    args: ApplicationRuntimeButtonArgs
  ) => ApplicationRuntimeButtonPresentation | null;
  handleButtonTrigger?: (args: ApplicationRuntimeButtonArgs) => boolean;
};
