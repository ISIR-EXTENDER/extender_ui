import { ControlsPage } from "./ControlsPage";

type CanvasDesignPageProps = {
  focusOnly?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function CanvasDesignPage({
  focusOnly = false,
  onDirtyChange,
}: CanvasDesignPageProps) {
  return <ControlsPage focusOnly={focusOnly} onDirtyChange={onDirtyChange} />;
}
