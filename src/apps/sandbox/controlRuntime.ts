import type { CanvasWidget } from "../../components/widgets";

export const SANDBOX_MAX_VELOCITY_TOPIC = "/cmd/max_velocity";

export const resolveSandboxMaxVelocityPresentation = (
  widget: Extract<CanvasWidget, { kind: "max-velocity" }>
) => ({
  reverseDirection: widget.reverseDirection ?? false,
  endpointLabels:
    widget.endpointLeftLabel || widget.endpointRightLabel
      ? {
          left: widget.endpointLeftLabel,
          right: widget.endpointRightLabel,
        }
      : widget.topic === SANDBOX_MAX_VELOCITY_TOPIC
        ? { left: "Precise", right: "Fast" }
        : undefined,
});
