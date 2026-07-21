import { useState } from "react";
import ReusableRightDrawer from "../../../../../reusableComponents/reusabeleRightDrawer/index";
import CloseButton from "../../../../../assets/commonIcons/CloseButton.svg";
import ReprocessIcon from "../../../../../assets/boardCastTableIcons/ReprocessIcon.svg";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton";
import "./style.scss";
import Details from "./details";
import Message from "./message";
import ReProcessBroadCast from "../reprocessBroadcast";
import { useGet } from "../../../../../hooks/useGet";
import { ENDPOINTS } from "../../../../../api/endpoints.js";

function TableBoardCastDetails({ isOpen, onClose, broadcastData }) {
  const [activeTab, setActiveTab] = useState("details");
  const [isReprocessOpen, setIsReprocessOpen] = useState(false);

  const templateId = broadcastData?.messageTempLibId;
  const { data: templateResponse, isLoading: isTemplateLoading } = useGet(
    ["template", templateId],
    templateId ? ENDPOINTS.templates.GET_BY_ID(templateId) : "",
    null,
    { enabled: isOpen && activeTab === "message" && !!templateId }
  );

  if (!broadcastData) return null;

  const handleRefresh = (e) => {
    e.stopPropagation();
    setIsReprocessOpen(true);
  };

  // Custom Header containing both Tabs and Action Buttons
  const renderCustomHeader = () => (
    <div className="drawerHeaderCustom">
      <div className="headerTabs">
        <button
          className={`tabItem ${activeTab === "details" ? "activeTab" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Broadcast Details
        </button>
        <button
          className={`tabItem ${activeTab === "message" ? "activeTab" : ""}`}
          onClick={() => setActiveTab("message")}
        >
          Message
        </button>
      </div>
      <div className="headerActions">
        <button
          className="refreshBtn"
          onClick={handleRefresh}
          title="Reprocess"
        >
          <img src={ReprocessIcon} alt="Refresh" />
        </button>
        <button
          className="closeBtn"
          onClick={onClose}
          aria-label="Close drawer"
        >
          <img src={CloseButton} alt="Close" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="tableBoardCastDetails">
      <ReusableRightDrawer
        isOpen={isOpen}
        onClose={onClose}
        width="650px"
        showCloseBtn={false}
        title={renderCustomHeader()}
        className="tableBoardCastDetailsDrawer"
        footer={
          <div className="customDrawerFooter">
            <ReusableButton
              label="Close"
              variant="secondary"
              onClick={onClose}
            />
          </div>
        }
      >
        <div className="drawerContentBody">
          {activeTab === "details" ? (
            <Details broadcastData={broadcastData} />
          ) : (
            <Message
              broadcastData={broadcastData}
              template={templateResponse?.data}
              isTemplateLoading={isTemplateLoading}
            />
          )}
        </div>
      </ReusableRightDrawer>
      <ReProcessBroadCast
        isOpen={isReprocessOpen}
        onClose={() => setIsReprocessOpen(false)}
        broadcastData={broadcastData}
      />
    </div>
  );
}

export default TableBoardCastDetails;
