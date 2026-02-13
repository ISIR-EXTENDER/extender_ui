import { useEffect, useRef, useState } from "react";

import type { WidgetInstance } from "../../types/widgets";

const MIN_SIZE = 140;
const GRID = 8;

const snap = (value: number) => Math.round(value / GRID) * GRID;

type WidgetContainerProps = {
  widget: WidgetInstance;
  isEditorMode: boolean;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onUpdate: (updates: Partial<WidgetInstance>) => void;
  children: React.ReactNode;
};

export function WidgetContainer({
  widget,
  isEditorMode,
  isSelected,
  onSelect,
  onUpdate,
  children,
}: WidgetContainerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditorMode) return;
    event.stopPropagation();
    onSelect(widget.id);
    setDragging(true);
    setDragOffset({
      x: event.clientX - widget.x,
      y: event.clientY - widget.y,
    });
  };

  const handleResizeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditorMode) return;
    event.stopPropagation();
    onSelect(widget.id);
    setResizing(true);
  };

  useEffect(() => {
    if (!dragging && !resizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (dragging) {
        const nextX = snap(Math.max(0, event.clientX - dragOffset.x));
        const nextY = snap(Math.max(0, event.clientY - dragOffset.y));
        onUpdate({ x: nextX, y: nextY });
      }

      if (resizing && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const nextWidth = snap(Math.max(MIN_SIZE, event.clientX - rect.left));
        const nextHeight = snap(Math.max(MIN_SIZE, event.clientY - rect.top));
        onUpdate({ width: nextWidth, height: nextHeight });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, dragOffset, onUpdate]);

  return (
    <div
      ref={ref}
      className={`widget-shell ${isSelected ? "selected" : ""}`.trim()}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="widget-content">{children}</div>
      {isEditorMode && isSelected && (
        <div className="widget-resize-handle" onMouseDown={handleResizeMouseDown} />
      )}
    </div>
  );
}
