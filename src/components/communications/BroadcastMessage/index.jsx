import { useCallback, useState } from "react";
import { AddBroadcastMessage } from "../addBroadcastMessage";
import { BroadcastEmailMessage } from "./broadcastEmailMessage";
import BroadcastTextMessage from "./broadcastTextMessage";
import BroadcastTextVoiceMessage from "./broadcastTextVoiceMessage";
import MultipleBroadMessages from "./multipleBroadMessages";

import "./style.scss";

// import languageIcon from "../../../assets/mainScreen/languageIcon.svg";
import Footer from "./broadcastMessageFooter/footer";
// import { ReusableDropDown } from "../../../reusableComponents/reusableDropDown";
import {
  BroadcastFormProvider,
  useBroadcastForm
} from "../broadcastFormContext";

// const languageOptions = [
//   { value: "english", label: "English" },
//   { value: "spanish", label: "Spanish" },
//   { value: "mandarin", label: "Mandarin" },
//   { value: "vietnamese", label: "Vietnamese" },
//   { value: "tagalog", label: "Tagalog" }
// ];

function BroadcastMessageInner({ handleCancel }) {
  const [currentStep, setCurrentStep] = useState("setup");
  // Once the user has entered the editor, keep it mounted for the rest of the
  // session so its internal state (GrapesJS instance, text editor content,
  // attachments, etc.) survives Back → Next cycles. We just toggle visibility
  // with CSS instead of unmounting.
  const [hasEnteredEditor, setHasEnteredEditor] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [mountedModes, setMountedModes] = useState(() => new Set());
  const {
    selectedModes,
    selectedTemplateData,
    setSelectedTemplateData,
    emailEditorRef,
    smsEditorInstanceRef,
    isEmailEditorEmpty,
    setIsEmailEditorEmpty,
    isSmsEditorEmpty,
    setIsSmsEditorEmpty,
    isVoiceEditorEmpty,
    setIsVoiceEditorEmpty
  } = useBroadcastForm();

  // const [selectedLanguage, setSelectedLanguage] = useState(
  //   languageOptions[0].value
  // );

  const handleTextEditorReady = useCallback(
    (instance) => {
      smsEditorInstanceRef.current = instance;
    },
    [smsEditorInstanceRef]
  );
  const [hasChanges, setHasChanges] = useState(false);
  const handleDirtyChange = useCallback(() => setHasChanges(true), []);
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  const emptyMap = {
    mail: isEmailEditorEmpty,
    sms: isSmsEditorEmpty,
    voice: isVoiceEditorEmpty
  };
  const hasEmptyEditor = selectedModes.some(
    (mode) => emptyMap[mode.toLowerCase()]
  );

  const setEmailEmpty = setIsEmailEditorEmpty;
  const setTextEmpty = setIsSmsEditorEmpty;
  const setVoiceEmpty = setIsVoiceEditorEmpty;

  const handleLoadTemplate = (templateName) => {
    console.log("Load template:", templateName);
  };

  const handleBack = () => {
    setCurrentStep("setup");
  };

  const selectedTemplate = selectedTemplateData;

  const lowerModes = selectedModes.map((m) => m.toLowerCase());

  const heading =
    selectedModes.length > 1
      ? "Add Broadcast Message"
      : lowerModes.includes("mail")
        ? "Add Email Message for Broadcast"
        : lowerModes.includes("sms")
          ? "Add SMS Message for Broadcast"
          : "Add Voice Message for Broadcast";

  const renderBuilder = () => {
    if (selectedModes.length > 1) {
      return (
        <MultipleBroadMessages
          selectedModes={selectedModes}
          activeTab={activeTab}
          mountedModes={mountedModes}
          editorRef={emailEditorRef}
          handleLoadTemplate={handleLoadTemplate}
          showPlaceholders={showPlaceholders}
          setShowPlaceholders={setShowPlaceholders}
          isEditorEmpty={emptyMap.mail}
          setIsEditorEmpty={setEmailEmpty}
          onTextEmptyChange={setTextEmpty}
          onVoiceEmptyChange={setVoiceEmpty}
          onTextEditorReady={handleTextEditorReady}
          onDirtyChange={handleDirtyChange}
          selectedTemplate={selectedTemplate}
        />
      );
    }

    if (lowerModes.includes("mail")) {
      return (
        <BroadcastEmailMessage
          editorRef={emailEditorRef}
          handleLoadTemplate={handleLoadTemplate}
          showPlaceholders={showPlaceholders}
          setShowPlaceholders={setShowPlaceholders}
          isEditorEmpty={emptyMap.mail}
          setIsEditorEmpty={setEmailEmpty}
          onDirtyChange={handleDirtyChange}
          selectedTemplate={selectedTemplate}
        />
      );
    }

    if (lowerModes.includes("sms")) {
      return (
        <BroadcastTextMessage
          selectedTemplate={selectedTemplate}
          onEmptyChange={setTextEmpty}
          onEditorReady={handleTextEditorReady}
          onDirtyChange={handleDirtyChange}
        />
      );
    }

    if (lowerModes.includes("voice")) {
      return (
        <BroadcastTextVoiceMessage
          selectedTemplate={selectedTemplate}
          onEmptyChange={setVoiceEmpty}
        />
      );
    }

    return null;
  };

  return (
    <>
      {hasEnteredEditor && (
        <div
          style={{ display: currentStep === "editor" ? undefined : "none" }}
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
                    onClick={() => {
                      setActiveTab(mode);
                      setMountedModes((prev) => {
                        if (prev.has(mode)) return prev;
                        const next = new Set(prev);
                        next.add(mode);
                        return next;
                      });
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            ) : (
              <h2 className="mainTitle">{heading}</h2>
            )}

            {/* <ReusableDropDown
              options={languageOptions}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              valueImage={languageIcon}
              maxWidth="165px"
            /> */}
          </div>

          {/* Builder */}
          {renderBuilder()}

          {/* Footer */}
          <div className="footerContainer">
            <Footer
              onBack={handleBack}
              onCancel={handleCancel}
              disabled={hasEmptyEditor}
              hasChanges={hasChanges}
              editorRef={emailEditorRef}
              textEditorInstanceRef={smsEditorInstanceRef}
            />
          </div>
        </div>
      )}
      <div style={{ display: currentStep === "setup" ? undefined : "none" }}>
        <AddBroadcastMessage
          onNext={(templateData) => {
            if (templateData) {
              setSelectedTemplateData(templateData);
            }
            setCurrentStep("editor");
            setHasEnteredEditor(true);
            // Preserve activeTab / mountedModes from a previous editor session
            // so the user's in-progress work stays selected on re-entry.
            setActiveTab((prev) => prev ?? selectedModes[0]);
            setMountedModes((prev) =>
              prev.size > 0 ? prev : new Set([selectedModes[0]])
            );
          }}
          handleCancel={handleCancel}
        />
      </div>
    </>
  );
}

export const BroadcastMessage = ({ handleCancel }) => (
  <BroadcastFormProvider>
    <BroadcastMessageInner handleCancel={handleCancel} />
  </BroadcastFormProvider>
);
