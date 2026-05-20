import { useState } from "react";
import ReusableRightDrawer from "../../../../../reusableComponents/reusabeleRightDrawer/index";
import CloseButton from "../../../../../assets/commonIcons/CloseButton.svg";
import refreshIcon from "../../../../../assets/boardCastTableIcons/refreshIcon.svg";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton";
import "./style.scss";
import Details from "./details";
import Message from "./message";

function TableBoardCastDetails({ isOpen, onClose, broadcastData }) {
  const [activeTab, setActiveTab] = useState("details");

  if (!broadcastData) return null;

  const handleRefresh = (e) => {
    e.stopPropagation();
    console.log("Refreshing broadcast details...");
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
          title="Refresh details"
        >
          <img src={refreshIcon} alt="Refresh" />
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
        width="800px"
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
            <Message broadcastData={broadcastData} />
          )}
        </div>
      </ReusableRightDrawer>
    </div>
  );
}

export default TableBoardCastDetails;
