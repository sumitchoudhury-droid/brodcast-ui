import { useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";
import { PatientsMessages } from "../../components/communications/patientsMessages";
import "./style.scss";
import { BroadcastMessage } from "../../components/communications/BroadcastMessage";

function Communications() {
  const CommunicationsData = useMemo(
    () => [
      { id: 1, title: "Patients Messages", path: "patients-messages" },
      { id: 2, title: "Broadcast Message", path: "broadcast-message" }
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
      : currentPath.endsWith("/patient-communication") ||
          currentPath.endsWith("/patient-communication/")
        ? 1
        : null;
  }, [location.pathname, CommunicationsData]);

  const handleTabClick = (item) => {
    navigate(`/patient-communication/${item.path}`);
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
          <Route path="patients-messages" element={<PatientsMessages />} />
        </Routes>
      </div>
    </div>
  );
}

export default Communications;
