import { widgetCatalog, widgetTypesByTab } from "../../app/widgetCatalog";
import type { TabId } from "../../app/tabs";
import { useWidgetsStore } from "../../store/widgetsStore";

type WidgetMenuProps = {
  tabId: TabId;
  onClose: () => void;
};

export function WidgetMenu({ tabId, onClose }: WidgetMenuProps) {
  const addWidget = useWidgetsStore((s) => s.addWidget);
  const allowedTypes = new Set(widgetTypesByTab[tabId]);

  return (
    <div className="widget-menu-backdrop" onClick={onClose}>
      <div className="widget-menu" onClick={(event) => event.stopPropagation()}>
        <h2>Add Widget</h2>
        <div className="widget-menu-grid">
          {widgetCatalog
            .filter((item) => allowedTypes.has(item.type))
            .map((item) => (
              <button
                key={item.type}
                className="widget-menu-button"
                onClick={() => {
                  addWidget(tabId, item.type);
                  onClose();
                }}
              >
                {item.title}
              </button>
            ))}
        </div>
        <button className="header-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
