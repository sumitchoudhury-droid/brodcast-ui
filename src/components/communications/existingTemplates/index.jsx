import { useState, useEffect } from "react";
import "./style.scss";
import templateOneIcon from "../../../assets/existingTemplate/template1.svg";
import emailIcon from "../../../assets/existingTemplate/mail.svg";
import textIcon from "../../../assets/existingTemplate/message.svg";
import voiceIcon from "../../../assets/existingTemplate/phone.svg";
import searchIcon from "../../../assets/commonIcons/searchIcon.svg";
import emptyTemplate from "../../../assets/existingTemplate/emptyTemplate.svg";
import CloseButton from "../../../assets/commonIcons/CloseButton.svg";
import mobileIcon from "../../../assets/previewSection/mobileIcon.svg";
import desktopIcon from "../../../assets/previewSection/desktopIcon.svg";
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

function ExistingTemplates({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeModeTab, setActiveModeTab] = useState("Text");
  const [viewMode, setViewMode] = useState("desktop");

  const filteredTemplates = MOCK_TEMPLATES.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectTemplate = () => {
    console.log("Selected Template:", selectedTemplate);
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
                    <img src={mobileIcon} alt="mobile" />
                  </div>
                  <div
                    className={`modeIcon ${viewMode === "desktop" ? "active" : ""}`}
                    onClick={() => setViewMode("desktop")}
                  >
                    <img src={desktopIcon} alt="desktop" />
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
