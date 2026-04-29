import type {
  ApplicationRuntimeThrowDrawArgs,
  ApplicationRuntimeThrowDrawChangeArgs,
} from "../../app/runtime/types";
import type { CanvasWidget } from "../../components/widgets";
import { PETANQUE_ALPHA_TOPIC } from "../../pages/applicationTopics";
import {
  PETANQUE_ALPHA_SAFE_MAX,
  buildPetanqueThrowCfgUpdate,
  isPetanqueCfgUpdateEmpty,
  resolvePetanqueThrowDrawValue,
} from "./controlRuntime";

const findAlphaWidget = (
  widget: Extract<CanvasWidget, { kind: "throw-draw" }>,
  widgets: CanvasWidget[]
) => {
  if (typeof widget.alphaTopic !== "string" || widget.alphaTopic.trim().length === 0) {
    return null;
  }
  return (
    widgets.find(
      (candidate) => candidate.kind === "max-velocity" && candidate.topic === widget.alphaTopic
    ) ?? null
  );
};

const syncMaxVelocityWidgetsByTopic = (
  widgets: CanvasWidget[],
  prevValues: Record<string, number>,
  updates: Record<string, number>
) => {
  const nextValues = { ...prevValues };

  for (const candidate of widgets) {
    if (candidate.kind !== "max-velocity") continue;
    const nextValue = updates[candidate.topic];
    if (typeof nextValue === "number") {
      nextValues[candidate.id] = nextValue;
    }
  }

  return nextValues;
};

const resolveSafeAlphaMax = (widget: Extract<CanvasWidget, { kind: "throw-draw" }>) =>
  typeof widget.alphaSafeMax === "number" ? widget.alphaSafeMax : PETANQUE_ALPHA_SAFE_MAX;

export const resolvePetanqueThrowDrawState = (args: ApplicationRuntimeThrowDrawArgs) => {
  const alphaWidget = findAlphaWidget(args.widget, args.widgets);
  const alphaWidgetValue = alphaWidget
    ? args.state.maxVelocityWidgetValues[alphaWidget.id]
    : undefined;
  const resolved = resolvePetanqueThrowDrawValue(
    args.widget,
    args.state.throwDrawWidgetValues,
    args.state.throwDrawAlphaValues,
    alphaWidgetValue
  );

  return {
    ...resolved,
    angleValue: resolved.clampedAngle,
    durationValue: resolved.clampedDuration,
    alphaValue: resolved.drawAlphaValue,
  };
};

const applyPetanqueThrowDrawAlphaChange = (
  args: ApplicationRuntimeThrowDrawArgs,
  rawNextAlpha: number
) => {
  const resolved = resolvePetanqueThrowDrawState(args);
  if (!resolved.hasAlphaControl) return;

  let nextAlpha = Math.max(resolved.alphaMin, Math.min(resolved.alphaMax, rawNextAlpha));
  args.actions.setThrowDrawAlphaValues((prev) => ({
    ...prev,
    [args.widget.id]: nextAlpha,
  }));

  if (args.widget.alphaTopic === PETANQUE_ALPHA_TOPIC) {
    const safeAlphaMax = resolveSafeAlphaMax(args.widget);
    if (nextAlpha > safeAlphaMax) {
      if (!args.state.petanqueAlphaUnsafeValidated) {
        const confirmed = args.actions.confirmAction(
          `Alpha above ${safeAlphaMax} is not safe. Validate this value?`
        );
        if (!confirmed) {
          nextAlpha = safeAlphaMax;
        } else {
          args.actions.setPetanqueAlphaUnsafeValidated(true);
        }
      }
    } else {
      args.actions.setPetanqueAlphaUnsafeValidated(false);
    }
    args.actions.setThrowDrawAlphaValues((prev) => ({
      ...prev,
      [args.widget.id]: nextAlpha,
    }));
    args.actions.setPetanqueAlpha(nextAlpha);
    return;
  }

  args.actions.setMaxVelocityWidgetValues((prev) =>
    syncMaxVelocityWidgetsByTopic(args.widgets, prev, {
      [args.widget.alphaTopic ?? ""]: nextAlpha,
    })
  );
};

export const handlePetanqueThrowDrawChange = (args: ApplicationRuntimeThrowDrawChangeArgs) => {
  const resolved = resolvePetanqueThrowDrawState(args);
  const resolvedAngle =
    typeof args.next.angle === "number"
      ? Math.max(resolved.angleMin, Math.min(resolved.angleMax, args.next.angle))
      : resolved.angleValue;
  const resolvedDuration =
    typeof args.next.duration === "number"
      ? Math.max(resolved.durationMin, Math.min(resolved.durationMax, args.next.duration))
      : resolved.durationValue;

  args.actions.setThrowDrawWidgetValues((prev) => ({
    ...prev,
    [args.widget.id]: {
      angle: resolvedAngle,
      duration: resolvedDuration,
    },
  }));

  args.actions.setMaxVelocityWidgetValues((prev) =>
    syncMaxVelocityWidgetsByTopic(args.widgets, prev, {
      [args.widget.angleTopic]: resolvedAngle,
      [args.widget.powerTopic]: resolvedDuration,
    })
  );

  const cfg = buildPetanqueThrowCfgUpdate(args.widget, resolvedAngle, resolvedDuration);
  if (!isPetanqueCfgUpdateEmpty(cfg)) {
    args.actions.sendMessage({
      type: "petanque_cfg",
      ...cfg,
    });
  }

  if (typeof args.next.alpha === "number") {
    applyPetanqueThrowDrawAlphaChange(args, args.next.alpha);
  }
  if (args.next.throwRequested) {
    args.actions.sendPetanqueStateCommand("throw");
  }
  args.actions.markWidgetPulse(args.widget.id);
  return true;
};
