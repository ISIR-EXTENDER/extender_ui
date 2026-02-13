import { Card } from "../ui/Card";
import { useWidgetConfig } from "../../hooks/useWidgetConfig";

type SavedPosesCardProps = {
  titleId: string;
  fallbackTitle: string;
};

export function SavedPosesCard({ titleId, fallbackTitle }: SavedPosesCardProps) {
  const { titleFor } = useWidgetConfig();

  return (
    <Card className="pose-card">
      <h2>{titleFor(titleId, fallbackTitle)}</h2>
      <div className="pose-grid">
        <button className="pose-button">🏠 Home</button>
        <button className="pose-button">⭐ Custom 1</button>
        <button className="pose-button">⭐ Custom 2</button>
        <button className="pose-button">⭐ Custom 3</button>
      </div>
      {/* TODO(backend): wire pose recall service/action */}
    </Card>
  );
}
