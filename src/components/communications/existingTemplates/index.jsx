import { useState, useEffect } from "react";
import "./style.scss";
import templateOneIcon from "../../../assets/existingTemplate/template1.svg";
import emailIcon from "../../../assets/existingTemplate/mail.svg";
import textIcon from "../../../assets/existingTemplate/message.svg";
import voiceIcon from "../../../assets/existingTemplate/phone.svg";
import searchIcon from "../../../assets/commonIcons/searchIcon.svg";
import emptyTemplate from "../../../assets/existingTemplate/emptyTemplate.svg";
import CloseButton from "../../../assets/commonIcons/CloseButton.svg";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import emailTemplate from "./htmlTemplates/email.html?raw";
import textTemplate from "./htmlTemplates/textMessage.html?raw";
import voiceTemplate from "./htmlTemplates/voiceMessage.html?raw";

const MOCK_TEMPLATES = [
  {
    id: 1,
    title: "Appointment Rescheduled",
    modes: ["mail", "text", "voice"],
    lastModified: "2 hours ago"
  },
  {
    id: 2,
    title: "Health Camp Invitation",
    modes: ["mail", "text"],
    lastModified: "1 day ago"
  },
  {
    id: 3,
    title: "Treatment Plan Update",
    modes: ["mail", "text", "voice"],
    lastModified: "3 days ago"
  },
  {
    id: 4,
    title: "Seasonal Health Advisory",
    modes: ["text", "voice"],
    lastModified: "5 days ago"
  },
  {
    id: 5,
    title: "Diabetes Screening Alert",
    modes: ["mail"],
    lastModified: "1 week ago"
  },
  {
    id: 6,
    title: "Wellness Program Enrollment",
    modes: ["mail", "text"],
    lastModified: "2 weeks ago"
  },
  {
    id: 7,
    title: "Invoice Generated Notification",
    modes: ["mail", "text", "voice"],
    lastModified: "2 weeks ago"
  },
  {
    id: 8,
    title: "Follow-Up Consultation Reminder",
    modes: ["mail", "voice"],
    lastModified: "3 weeks ago"
  },
  {
    id: 9,
    title: "Consent Form Reminder",
    modes: ["mail"],
    lastModified: "1 month ago"
  }
];

function ExistingTemplates({ isOpen, onClose, onSelectTemplate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeModeTab, setActiveModeTab] = useState("Text");
  const [viewMode, setViewMode] = useState("desktop");

  const filteredTemplates = MOCK_TEMPLATES.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectTemplate = () => {
    console.log("Selected Template:", selectedTemplate);
    if (onSelectTemplate) {
      onSelectTemplate({
        ...selectedTemplate,
        emailTemplate,
        textTemplate,
        voiceTemplate
      });
    }
    onClose();
  };

  // Prevent body scroll when drawer is open

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderModeIcons = (modes) => {
    return (
      <div className="templateModeIcons">
        {modes.includes("text") && <img src={textIcon} alt="text" />}
        {modes.includes("mail") && <img src={emailIcon} alt="mail" />}
        {modes.includes("voice") && <img src={voiceIcon} alt="voice" />}
      </div>
    );
  };

  return (
    <div className="existingTemplatesDrawerOverlay" onClick={onClose}>
      <div
        className="existingTemplatesDrawerContainer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawerHeader">
          <div className="headerTitle">
            <h3>Select Template</h3>
          </div>
          <div className="closeBtn" onClick={onClose}>
            <img src={CloseButton} alt="Close" />
          </div>
        </div>

        <div className="drawerBody">
          <div className="leftPanel">
            <div className="searchContainer">
              <div className="searchInputWrapper">
                <img src={searchIcon} alt="search" className="searchIcon" />
                <input
                  type="text"
                  placeholder="Search template"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="savedTemplatesTitle">
              <p>Saved Templates</p>
            </div>

            <div className="templatesList">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`templateItemCard ${selectedTemplate?.id === template.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedTemplate(template);
                      if (template.modes.length > 0) {
                        const currentMode = activeModeTab.toLowerCase();
                        if (!template.modes.includes(currentMode)) {
                          const firstMode = template.modes[0];
                          setActiveModeTab(
                            firstMode.charAt(0).toUpperCase() +
                              firstMode.slice(1)
                          );
                        }
                      }
                    }}
                  >
                    <div className="templateThumbnail">
                      <img src={templateOneIcon} alt="template" />
                    </div>
                    <div className="templateCardInfo">
                      <p className="templateCardTitle">{template.title}</p>
                      {renderModeIcons(template.modes)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="noResults">
                  <p>No results found</p>
                </div>
              )}
            </div>
          </div>

          <div className="rightPanel">
            {selectedTemplate && (
              <div className="rightPanelTop">
                <div className="modeTabsContainer">
                  <div className="modeTabs">
                    {["Text", "Mail", "Voice"]
                      .filter((mode) =>
                        selectedTemplate.modes.includes(mode.toLowerCase())
                      )
                      .map((mode) => (
                        <button
                          key={mode}
                          className={`modeTab ${activeModeTab === mode ? "active" : ""}`}
                          onClick={() => setActiveModeTab(mode)}
                        >
                          {mode}
                        </button>
                      ))}
                  </div>
                </div>
                <div className="viewMode">
                  <div
                    className={`modeIcon ${viewMode === "mobile" ? "active" : ""}`}
                    onClick={() => setViewMode("mobile")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                    >
                      <path
                        d="M10.0833 3.66667H11.9167M11 15.5833V15.5925M5.5 4.58333C5.5 4.0971 5.69315 3.63079 6.03697 3.28697C6.38079 2.94315 6.8471 2.75 7.33333 2.75H14.6667C15.1529 2.75 15.6192 2.94315 15.963 3.28697C16.3068 3.63079 16.5 4.0971 16.5 4.58333V17.4167C16.5 17.9029 16.3068 18.3692 15.963 18.713C15.6192 19.0568 15.1529 19.25 14.6667 19.25H7.33333C6.8471 19.25 6.38079 19.0568 6.03697 18.713C5.69315 18.3692 5.5 17.9029 5.5 17.4167V4.58333Z"
                        stroke="#606E80"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div
                    className={`modeIcon ${viewMode === "desktop" ? "active" : ""}`}
                    onClick={() => setViewMode("desktop")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                    >
                      <path
                        d="M6.41667 18.3327H15.5833M8.25 14.666V18.3327M13.75 14.666V18.3327M2.75 4.58268C2.75 4.33957 2.84658 4.10641 3.01849 3.9345C3.19039 3.76259 3.42355 3.66602 3.66667 3.66602H18.3333C18.5764 3.66602 18.8096 3.76259 18.9815 3.9345C19.1534 4.10641 19.25 4.33957 19.25 4.58268V13.7493C19.25 13.9925 19.1534 14.2256 18.9815 14.3975C18.8096 14.5694 18.5764 14.666 18.3333 14.666H3.66667C3.42355 14.666 3.19039 14.5694 3.01849 14.3975C2.84658 14.2256 2.75 13.9925 2.75 13.7493V4.58268Z"
                        stroke="#606E80"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div className="previewArea">
              {!selectedTemplate ? (
                <div className="previewPlaceholder">
                  <div className="placeholderIcon">
                    <img src={emptyTemplate} alt="empty" />
                  </div>
                  <p>
                    {" "}
                    <span>Select a saved Template</span> from left panel.
                  </p>
                </div>
              ) : (
                <div className="templatePreviewContent">
                  <div className="previewTag">
                    <p>Preview</p>
                  </div>
                  <div className={`previewContent ${viewMode}`}>
                    <iframe
                      srcDoc={
                        activeModeTab === "Mail"
                          ? emailTemplate
                          : activeModeTab === "Text"
                            ? textTemplate
                            : voiceTemplate
                      }
                      title="Template Preview"
                      className="previewIframe"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="drawerFooter">
          <ReusableButton label="Cancel" onClick={onClose} variant="primary" />
          <ReusableButton
            label="Select Template"
            onClick={handleSelectTemplate}
            variant="secondary"
            disabled={!selectedTemplate}
          />
        </div>
      </div>
    </div>
  );
}

export default ExistingTemplates;
