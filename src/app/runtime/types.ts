import type { ApplicationConfig } from "../applications";
import type { CanvasWidget } from "../../components/widgets";
import type {
  MeasureResultHistoryEntry,
  MeasureViewMode,
} from "../../apps/petanque/measureRuntime";
import type {
  PetanqueFlowStage,
  PetanqueStateCommand,
} from "../../apps/petanque/buttonRuntime";
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
  setPetanqueAlpha: (value: number) => void;
  setPetanqueAlphaUnsafeValidated: (value: boolean) => void;
  setMaxVelocityWidgetValues: (
    value:
      | Record<string, number>
      | ((prev: Record<string, number>) => Record<string, number>)
  ) => void;
  setThrowDrawWidgetValues: (
    value:
      | Record<string, { angle: number; duration: number }>
      | ((
          prev: Record<string, { angle: number; duration: number }>
        ) => Record<string, { angle: number; duration: number }>)
  ) => void;
  setThrowDrawAlphaValues: (
    value:
      | Record<string, number>
      | ((prev: Record<string, number>) => Record<string, number>)
  ) => void;
  confirmAction: (message: string) => boolean;
  sendPetanqueStateCommand: (command: PetanqueStateCommand) => void;
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
  measureVectorsJson: string | null;
  measureStatusText: string;
  measureLastUpdatedAtMs: number | null;
  maxVelocityWidgetValues: Record<string, number>;
  throwDrawWidgetValues: Record<string, { angle: number; duration: number }>;
  throwDrawAlphaValues: Record<string, number>;
  petanqueAlphaUnsafeValidated: boolean;
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

export type ApplicationRuntimeWidgetArgs = ApplicationRuntimeMatchArgs & {
  widget: CanvasWidget;
  widgets: CanvasWidget[];
  state: ApplicationRuntimeState;
};

export type ApplicationRuntimeMaxVelocityState = {
  value?: number | null;
  endpointLabels?: {
    left?: string;
    right?: string;
  };
  bubbleValueFormatter?: (value: number) => string;
  reverseDirection?: boolean;
  unsafeThreshold?: number;
};

export type ApplicationRuntimeMaxVelocityArgs = ApplicationRuntimeMatchArgs & {
  widget: Extract<CanvasWidget, { kind: "max-velocity" }>;
  widgets: CanvasWidget[];
  state: ApplicationRuntimeState;
  actions: ApplicationRuntimeMessageActions;
};

export type ApplicationRuntimeThrowDrawState = {
  angleValue: number;
  durationValue: number;
  alphaValue?: number;
  hasAlphaControl: boolean;
};

export type ApplicationRuntimeThrowDrawArgs = ApplicationRuntimeMatchArgs & {
  widget: Extract<CanvasWidget, { kind: "throw-draw" }>;
  widgets: CanvasWidget[];
  state: ApplicationRuntimeState;
  actions: ApplicationRuntimeMessageActions;
};

export type ApplicationRuntimeThrowDrawChangeArgs = ApplicationRuntimeThrowDrawArgs & {
  next: {
    angle?: number;
    duration?: number;
    powerPercent: number;
    alpha?: number;
    throwRequested?: boolean;
  };
};

export type ApplicationRuntimePlugin = {
  id: string;
  matches: (args: ApplicationRuntimeMatchArgs) => boolean;
  handleIncomingMessage?: (args: ApplicationRuntimeMessageArgs) => boolean;
  decorateWidget?: (args: ApplicationRuntimeWidgetArgs) => CanvasWidget | null;
  getMaxVelocityState?: (
    args: ApplicationRuntimeMaxVelocityArgs
  ) => ApplicationRuntimeMaxVelocityState | null;
  getThrowDrawState?: (
    args: ApplicationRuntimeThrowDrawArgs
  ) => ApplicationRuntimeThrowDrawState | null;
  getButtonPresentation?: (
    args: ApplicationRuntimeButtonArgs
  ) => ApplicationRuntimeButtonPresentation | null;
  handleButtonTrigger?: (args: ApplicationRuntimeButtonArgs) => boolean;
  handleThrowDrawChange?: (args: ApplicationRuntimeThrowDrawChangeArgs) => boolean;
};
