import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";

type InlineEditableTextProps = {
  value: string;
  onCommit: (nextValue: string) => void;
  className?: string;
  inputClassName?: string;
  element?: "span" | "div";
  emptyFallback?: ReactNode;
};

type ReadonlyAwareCommitHandler = ((nextValue: string) => void) & { __readonly?: boolean };

export function InlineEditableText({
  value,
  onCommit,
  className,
  inputClassName,
  element = "span",
  emptyFallback = "Untitled",
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const isEditable = !(onCommit as ReadonlyAwareCommitHandler).__readonly;

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [isEditing, value]);

  const commit = () => {
    if (draft !== value) {
      onCommit(draft);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };

  if (isEditing) {
    return (
      <input
        data-canvas-interactive="true"
        className={`controls-inline-edit-input ${inputClassName ?? ""}`.trim()}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onClick={(event) => event.stopPropagation()}
        autoFocus
      />
    );
  }

  const Tag = element;
  return (
    <Tag
      data-canvas-interactive="true"
      className={className}
      onDoubleClick={
        isEditable
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsEditing(true);
            }
          : undefined
      }
      title={isEditable ? "Double click to edit" : undefined}
    >
      {value || emptyFallback}
    </Tag>
  );
}
