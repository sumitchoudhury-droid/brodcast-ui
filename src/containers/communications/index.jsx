import { useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";
import { SecureChat } from "../../components/communications/secureChat";
import { NotificationConfiguration } from "../../components/communications/notificationConfiguration";
import "./style.scss";
import { BroadcastMessage } from "../../components/communications/BroadcastMessage";

function Communications() {
  const CommunicationsData = useMemo(
    () => [
      { id: 1, title: "Broadcast Message", path: "broadcast-message" },
      { id: 2, title: "Secure Chat", path: "secure-chat" },
      {
        id: 3,
        title: "Notification Configuration",
        path: "notification-configuration"
      }
    ],
    []
  );

  const navigate = useNavigate();
  const location = useLocation();

  const activeId = useMemo(() => {
    const currentPath = location.pathname;
    const matchingItem = CommunicationsData.find((item) =>
      currentPath.includes(item.path)
    );
    return matchingItem
      ? matchingItem.id
      : currentPath.endsWith("/communications") ||
          currentPath.endsWith("/communications/")
        ? 1
        : null;
  }, [location.pathname, CommunicationsData]);

  const handleTabClick = (item) => {
    navigate(`/communications/${item.path}`);
  };

  return (
    <div className="communicationsWrapper">
      {/* TOP MINI TABS */}
      <div className="communications">
        {CommunicationsData.map((item) => (
          <div
            key={item.id}
            className={`communicationCard ${activeId === item.id ? "active" : ""}`}
            onClick={() => handleTabClick(item)}
          >
            <h3>{item.title}</h3>
          </div>
        ))}
      </div>

      {/* CONTENT CHANGES */}
      <div className="communicationContent">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="broadcast-message" replace />}
          />
          <Route path="broadcast-message" element={<BroadcastMessage />} />
          <Route path="secure-chat" element={<SecureChat />} />
          <Route
            path="notification-configuration"
            element={<NotificationConfiguration />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default Communications;
