import { Routes, Route, Navigate } from "react-router-dom";
import MainScreen from "../containers/mainScreen";
import Communications from "../containers/communications";
import { tabs } from "../utls/constants";

const renderTabContent = (path, title) => {
  if (path === "broadcast-message") {
    return <Communications />;
  }
  return <h2>{title} Content</h2>;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/broadcast-message" replace />} />
      <Route path="/*" element={<MainScreen />}>
        {tabs.map((tab) => {
          const path = tab.title.toLowerCase().replace(/\s+/g, "-");
          return (
            <Route
              key={tab.id}
              path={path}
              element={renderTabContent(path, tab.title)}
            />
          );
        })}
      </Route>

      <Route path="*" element={<Navigate to="/broadcast-message" replace />} />
    </Routes>
  );
};
