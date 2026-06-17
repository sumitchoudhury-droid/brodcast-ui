import { useRef, useState } from "react";
import { AddBroadcastMessage } from "../addBroadcastMessage";
import { BroadcastEmailMessage } from "./broadcastEmailMessage";
import BroadcastTextMessage from "./broadcastTextMessage";
import BroadcastTextVoiceMessage from "./broadcastTextVoiceMessage";
import MultipleBroadMessages from "./multipleBroadMessages";

import "./style.scss";

import languageIcon from "../../../assets/mainScreen/languageIcon.svg";
import Footer from "./broadcastMessageFooter/footer";
import { ReusableDropDown } from "../../../reusableComponents/reusableDropDown";
import {
  BroadcastFormProvider,
  useBroadcastForm
} from "../broadcastFormContext";

const languageOptions = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "mandarin", label: "Mandarin" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "tagalog", label: "Tagalog" }
];

function BroadcastMessageInner({ handleCancel }) {
  const [currentStep, setCurrentStep] = useState("setup");
  const [activeTab, setActiveTab] = useState(null);
  const { selectedModes, selectedTemplateData, setSelectedTemplateData } =
    useBroadcastForm();

  const [selectedLanguage, setSelectedLanguage] = useState(
    languageOptions[0].value
  );

  const editorRef = useRef(null);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  const handleLoadTemplate = (templateName) => {
    console.log("Load template:", templateName);
  };

  const handleBack = () => {
    setCurrentStep("setup");
  };

  const selectedTemplate = selectedTemplateData;

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

            <ReusableDropDown
              options={languageOptions}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              valueImage={languageIcon}
              maxWidth="165px"
            />
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
          onNext={(templateData) => {
            if (templateData) {
              setSelectedTemplateData(templateData);
            }
            setCurrentStep("editor");
            setActiveTab(selectedModes[0]);
          }}
          handleCancel={handleCancel}
        />
      )}
    </>
  );
}

export const BroadcastMessage = ({ handleCancel }) => (
  <BroadcastFormProvider>
    <BroadcastMessageInner handleCancel={handleCancel} />
  </BroadcastFormProvider>
);
