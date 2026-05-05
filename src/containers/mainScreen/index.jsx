import { useLocation } from "react-router-dom";
import { TopSection } from "../../components/mainScreen/topSection";
import { TabsComponent } from "../../components/mainScreen/tabsComponent";
import Communications from "../communications";
import { tabs } from "../../utls/constants";
import "./style.scss";

function MainScreen() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="mainScreenContainer">
      <TopSection />
      <TabsComponent />
      <div className="tabContentArea">
        {tabs.map((tab) => {
          const tabPath = tab.title.toLowerCase().replace(/\s+/g, "-");
          // Check if current path matches this tab.
          // Patient communication is the default (id 6) or matches the path.
          const isActive =
            currentPath.includes(tabPath) ||
            (currentPath === "/" && tab.id === 6);

          return (
            <div
              key={tab.id}
              style={{ display: isActive ? "block" : "none", height: "100%" }}
            >
              {tabPath === "patient-communication" ? (
                <Communications />
              ) : (
                <div style={{ padding: "20px" }}>
                  <h2>{tab.title} Content</h2>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MainScreen;
