import { useRef, useState } from "react";
import { AddBroadcastMessage } from "../addBroadcastMessage";
import { BroadcastEmailMessage } from "./broadcastEmailMessage";
import BroadcastTextMessage from "./broadcastTextMessage";
import BroadcastTextVoiceMessage from "./broadcastTextVoiceMessage";
import MultipleBroadMessages from "./multipleBroadMessages";

import "./style.scss";

import languageIcon from "../../../assets/mainScreen/languageIcon.svg";
import greenChevronRight from "../../../assets/mainScreen/greenChevronRight.svg";
import Footer from "./broadcastMessageFooter/footer";

export const BroadcastMessage = () => {
  const [currentStep, setCurrentStep] = useState("setup");
  const [selectedModes, setSelectedModes] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const editorRef = useRef(null);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  const handleLoadTemplate = (templateName) => {
    console.log("Load template:", templateName);
  };

  const handleBack = () => {
    setCurrentStep("setup");
  };

  const heading =
    selectedModes.length > 1
      ? "Add Broadcast Message"
      : selectedModes.includes("Email")
        ? "Add Email Message for Broadcast"
        : selectedModes.includes("Text")
          ? "Add Text Message for Broadcast"
          : "Add Voice Message for Broadcast";

  const renderBuilder = () => {
    if (selectedModes.length > 1) {
      return (
        <MultipleBroadMessages
          selectedModes={selectedModes}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          editorRef={editorRef}
          handleLoadTemplate={handleLoadTemplate}
          showPlaceholders={showPlaceholders}
          setShowPlaceholders={setShowPlaceholders}
          isEditorEmpty={isEditorEmpty}
          setIsEditorEmpty={setIsEditorEmpty}
          selectedTemplate={selectedTemplate}
        />
      );
    }

    if (selectedModes.includes("Email")) {
      return (
        <BroadcastEmailMessage
          editorRef={editorRef}
          handleLoadTemplate={handleLoadTemplate}
          showPlaceholders={showPlaceholders}
          setShowPlaceholders={setShowPlaceholders}
          isEditorEmpty={isEditorEmpty}
          setIsEditorEmpty={setIsEditorEmpty}
          selectedTemplate={selectedTemplate}
        />
      );
    }

    if (selectedModes.includes("Text")) {
      return <BroadcastTextMessage selectedTemplate={selectedTemplate} />;
    }

    if (selectedModes.includes("Voice")) {
      return <BroadcastTextVoiceMessage selectedTemplate={selectedTemplate} />;
    }

    return null;
  };

  return (
    <>
      {currentStep === "editor" ? (
        <div
          className={`broadcastMessageContainer ${selectedModes.length > 1 ? "multiple" : ""}`}
        >
          {/* Header */}
          <div
            className={`header ${selectedModes.length > 1 ? "multipleHeader" : ""}`}
          >
            {selectedModes.length > 1 ? (
              <div className="broadcastMessageTabs">
                {selectedModes.map((mode) => (
                  <button
                    key={mode}
                    className={`tab ${activeTab === mode ? "active" : ""}`}
                    onClick={() => setActiveTab(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            ) : (
              <h2 className="mainTitle">{heading}</h2>
            )}

            <div
              className={`headerRight ${selectedModes.length > 1 ? "noDisplay" : ""}`}
            >
              <img src={languageIcon} alt="languageIcon" />
              <p>English</p>
              <img src={greenChevronRight} alt="greenChevronRight" />
            </div>
          </div>

          {/* Builder */}
          {renderBuilder()}

          {/* Footer */}
          <div className="footerContainer">
            <Footer onBack={handleBack} />
          </div>
        </div>
      ) : (
        <AddBroadcastMessage
          selectedModes={selectedModes}
          setSelectedModes={setSelectedModes}
          selectedTemplateData={selectedTemplate}
          setSelectedTemplateData={setSelectedTemplate}
          onNext={(templateData) => {
            if (templateData) {
              setSelectedTemplate(templateData);
            }
            setCurrentStep("editor");
            setActiveTab(selectedModes[0]);
          }}
        />
      )}
    </>
  );
};
