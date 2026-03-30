import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tabs } from "../../../utls/constants";
import "./style.scss";

export const TabsComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const currentPath = location.pathname;
    const matchingTab = tabs.find((tab) =>
      currentPath.includes(tab.title.toLowerCase().replace(/\s+/g, "-"))
    );
    return matchingTab ? matchingTab.id : currentPath === "/" ? 1 : null;
  }, [location.pathname]);

  const handleTabClick = (tab) => {
    const path = `/${tab.title.toLowerCase().replace(/\s+/g, "-")}`;
    navigate(path);
  };

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tabItem ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => handleTabClick(tab)}
        >
          {tab.title}
        </div>
      ))}
    </div>
  );
};
