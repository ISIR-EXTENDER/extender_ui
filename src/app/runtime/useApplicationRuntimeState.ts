import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ApplicationConfig } from "../applications";
import type { CanvasWidget } from "../../components/widgets";
import { wsClient } from "../../services/wsClient";
import {
  MEASURE_DEMO_HISTORY_ENTRY,
  type MeasureResultHistoryEntry,
  type MeasureViewMode,
} from "../../apps/petanque/measureRuntime";
import {
  type PetanqueFlowStage,
  type PetanqueStateCommand,
  resolvePetanqueFlowStageAfterCommand,
} from "../../apps/petanque/buttonRuntime";
import {
  PETANQUE_ALPHA_MAX,
  PETANQUE_ALPHA_SAFE_MAX,
  PETANQUE_DEFAULT_TOTAL_DURATION_S,
  buildPetanqueStateCommandMessage,
  clampPetanqueDuration,
  syncPetanqueAlphaWidgets,
} from "../../apps/petanque/controlRuntime";
import { PETANQUE_TOTAL_DURATION_TOPIC } from "../../pages/applicationTopics";
import type { WsStatus } from "../../types/ws";
import type {
  ApplicationRuntimeMessageActions,
  ApplicationRuntimePlugin,
  ApplicationRuntimeState,
} from "./types";

type UseApplicationRuntimeStateArgs = {
  activeApplication: ApplicationConfig | null;
  activeScreenId: string | null;
  activeRuntimePlugins: ApplicationRuntimePlugin[];
  widgets: CanvasWidget[];
  wsStatus: WsStatus;
  markWidgetPulse: (widgetId: string) => void;
};

type UseApplicationRuntimeStateResult = {
  runtimePluginState: ApplicationRuntimeState;
  runtimePluginActions: ApplicationRuntimeMessageActions;
  maxVelocityWidgetValues: Record<string, number>;
  setMaxVelocityWidgetValues: (
    value:
      | Record<string, number>
      | ((prev: Record<string, number>) => Record<string, number>)
  ) => void;
};

export const useApplicationRuntimeState = ({
  activeApplication,
  activeScreenId,
  activeRuntimePlugins,
  widgets,
  wsStatus,
  markWidgetPulse,
}: UseApplicationRuntimeStateArgs): UseApplicationRuntimeStateResult => {
  const [petanqueFlowStage, setPetanqueFlowStage] = useState<PetanqueFlowStage>("teleop");
  const [maxVelocityWidgetValues, setMaxVelocityWidgetValues] = useState<Record<string, number>>(
    {}
  );
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
  const [measureResultHistory, setMeasureResultHistory] = useState<MeasureResultHistoryEntry[]>([
    MEASURE_DEMO_HISTORY_ENTRY,
  ]);
  const hasSentPetanqueDurationDefaultRef = useRef(false);
  const alphaUnsafeValidatedRef = useRef(false);

  useEffect(() => {
    if (wsStatus !== "connected") {
      hasSentPetanqueDurationDefaultRef.current = false;
      return;
    }

    if (activeScreenId !== "petanque") return;
    if (hasSentPetanqueDurationDefaultRef.current) return;

    const hasDurationWidget = widgets.some(
      (widget) =>
        widget.kind === "max-velocity" && widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
    );
    if (!hasDurationWidget) return;

    wsClient.send({
      type: "petanque_cfg",
      total_duration: clampPetanqueDuration(PETANQUE_DEFAULT_TOTAL_DURATION_S),
    });
    hasSentPetanqueDurationDefaultRef.current = true;
  }, [activeScreenId, widgets, wsStatus]);

  const setPetanqueAlpha = useCallback(
    (nextValue: number) => {
      const clamped = Math.max(0, Math.min(PETANQUE_ALPHA_MAX, nextValue));
      if (clamped <= PETANQUE_ALPHA_SAFE_MAX) {
        alphaUnsafeValidatedRef.current = false;
      }
      setThrowDrawAlphaValues((prev) =>
        syncPetanqueAlphaWidgets(widgets, clamped, prev, maxVelocityWidgetValues)
          .nextThrowDrawAlphaValues
      );
      setMaxVelocityWidgetValues((prev) =>
        syncPetanqueAlphaWidgets(widgets, clamped, throwDrawAlphaValues, prev)
          .nextMaxVelocityWidgetValues
      );
      wsClient.send({
        type: "petanque_cfg",
        alpha: clamped,
      });
    },
    [maxVelocityWidgetValues, throwDrawAlphaValues, widgets]
  );

  const advancePetanqueFlow = useCallback((command: PetanqueStateCommand) => {
    const nextStage = resolvePetanqueFlowStageAfterCommand(command);
    if (nextStage) {
      setPetanqueFlowStage(nextStage);
    }
  }, []);

  const sendPetanqueStateCommand = useCallback(
    (command: PetanqueStateCommand) => {
      wsClient.send(buildPetanqueStateCommandMessage(command));
      advancePetanqueFlow(command);
    },
    [advancePetanqueFlow]
  );

  const runtimePluginState = useMemo(
    () => ({
      petanqueFlowStage,
      measureViewMode,
      measureRequestPending,
      measureResultImageDataUrl,
      capturedMeasureImageDataUrl,
      measureResultHistory,
      measureVectorsJson,
      measureStatusText,
      measureLastUpdatedAtMs,
      maxVelocityWidgetValues,
      throwDrawWidgetValues,
      throwDrawAlphaValues,
      petanqueAlphaUnsafeValidated: alphaUnsafeValidatedRef.current,
    }),
    [
      capturedMeasureImageDataUrl,
      maxVelocityWidgetValues,
      measureLastUpdatedAtMs,
      measureRequestPending,
      measureResultHistory,
      measureResultImageDataUrl,
      measureStatusText,
      measureVectorsJson,
      measureViewMode,
      petanqueFlowStage,
      throwDrawAlphaValues,
      throwDrawWidgetValues,
    ]
  );

  const runtimePluginActions = useMemo(
    () => ({
      setMeasureResultImageDataUrl,
      setMeasureVectorsJson,
      setMeasureLastUpdatedAtMs,
      setMeasureStatusText,
      setMeasureRequestPending,
      setMeasureViewMode,
      setMeasureResultHistory,
      setCapturedMeasureImageDataUrl,
      setPetanqueFlowStage,
      setPetanqueAlpha,
      setPetanqueAlphaUnsafeValidated: (value: boolean) => {
        alphaUnsafeValidatedRef.current = value;
      },
      setMaxVelocityWidgetValues,
      setThrowDrawWidgetValues,
      setThrowDrawAlphaValues,
      confirmAction: (message: string) => window.confirm(message),
      sendPetanqueStateCommand,
      markWidgetPulse,
      sendMessage: (payload: object) => wsClient.send(payload),
    }),
    [markWidgetPulse, sendPetanqueStateCommand, setPetanqueAlpha]
  );

  useEffect(() => {
    const unsubscribe = wsClient.onMessage((message) => {
      for (const plugin of activeRuntimePlugins) {
        const handled = plugin.handleIncomingMessage?.({
          application: activeApplication,
          activeScreenId,
          message,
          widgets,
          state: runtimePluginState,
          actions: runtimePluginActions,
        });
        if (handled) return;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    activeApplication,
    activeRuntimePlugins,
    activeScreenId,
    runtimePluginActions,
    runtimePluginState,
    widgets,
  ]);

  return {
    runtimePluginState,
    runtimePluginActions,
    maxVelocityWidgetValues,
    setMaxVelocityWidgetValues,
  };
};
