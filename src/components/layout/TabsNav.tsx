import { tabs } from "../../app/routes";
import { useUiStore } from "../../store/uiStore";

type TabsNavProps = {
  hidden?: boolean;
};

export function TabsNav({ hidden }: TabsNavProps) {
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);

  if (hidden) return null;

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
