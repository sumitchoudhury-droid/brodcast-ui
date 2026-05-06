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

  const editorRef = useRef(null);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  const handleLoadTemplate = (templateName) => {
    console.log("Load template:", templateName);
  };

  const handleBack = () => {
    setCurrentStep("setup");
  };

  const heading = selectedModes.includes("Email")
    ? "Add Email Message for Broadcast"
    : selectedModes.includes("Text")
      ? "Add Text Message for Broadcast"
      : "Add Voice Message for Broadcast";

  const renderBuilder = () => {
    if (selectedModes.length > 1) {
      return <MultipleBroadMessages selectedModes={selectedModes} />;
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
        />
      );
    }

    if (selectedModes.includes("Text")) {
      return <BroadcastTextMessage />;
    }

    if (selectedModes.includes("Voice")) {
      return <BroadcastTextVoiceMessage />;
    }

    return null;
  };

  return (
    <>
      {currentStep === "editor" ? (
        <div className="broadcastMessageContainer">
          {/* Header */}
          <div className="header">
            <h2 className="mainTitle">{heading}</h2>
            <div className="headerRight">
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
          onNext={() => setCurrentStep("editor")}
        />
      )}
    </>
  );
};
