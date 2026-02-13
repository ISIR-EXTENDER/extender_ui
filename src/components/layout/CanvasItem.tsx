import { useCallback } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

export type CanvasRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type CanvasItemProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  className?: string;
  children: ReactNode;
  onChange?: (next: CanvasRect) => void;
  minSize?: { w: number; h: number };
  selected?: boolean;
  onSelect?: () => void;
};

const clampMin = (value: number, min: number) => Math.max(min, value);

export function CanvasItem({
  x,
  y,
  w,
  h,
  className,
  children,
  onChange,
  minSize,
  selected = false,
  onSelect,
}: CanvasItemProps) {
  const minW = minSize?.w ?? 40;
  const minH = minSize?.h ?? 40;

  const startInteraction = useCallback(
    (event: ReactPointerEvent, mode: "move" | "resize") => {
      if (!onChange) return;

      event.preventDefault();
      event.stopPropagation();

      const startPointerX = event.clientX;
      const startPointerY = event.clientY;
      const startRect: CanvasRect = { x, y, w, h };

      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.userSelect = "none";
      document.body.style.cursor = mode === "move" ? "grabbing" : "nwse-resize";

      const onPointerMove = (moveEvent: PointerEvent) => {
        const dx = Math.round(moveEvent.clientX - startPointerX);
        const dy = Math.round(moveEvent.clientY - startPointerY);

        if (mode === "move") {
          onChange({
            x: Math.max(0, startRect.x + dx),
            y: Math.max(0, startRect.y + dy),
            w: startRect.w,
            h: startRect.h,
          });
          return;
        }

        onChange({
          x: startRect.x,
          y: startRect.y,
          w: clampMin(startRect.w + dx, minW),
          h: clampMin(startRect.h + dy, minH),
        });
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        document.body.style.userSelect = previousUserSelect;
        document.body.style.cursor = previousCursor;
      };

      const onPointerUp = () => {
        cleanup();
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [h, minH, minW, onChange, w, x, y]
  );

  return (
    <div
      className={`canvas-item ${selected ? "is-selected" : ""} ${className ?? ""}`.trim()}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
      }}
      onPointerDown={() => onSelect?.()}
    >
      <div className="canvas-item-content">{children}</div>
      {onChange && (
        <>
          <button
            type="button"
            className="canvas-item-drag-handle"
            onPointerDown={(event) => startInteraction(event, "move")}
            aria-label="Move item"
            title="Move"
          />
          <button
            type="button"
            className="canvas-item-resize-handle"
            onPointerDown={(event) => startInteraction(event, "resize")}
            aria-label="Resize item"
            title="Resize"
          />
        </>
      )}
    </div>
  );
}
