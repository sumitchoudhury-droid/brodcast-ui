import BroadcastTextMessage from "../broadcastTextMessage";
import { BroadcastEmailMessage } from "../broadcastEmailMessage";
import BroadcastTextVoiceMessage from "../broadcastTextVoiceMessage";
import "./style.scss";

function MultipleBroadMessages({
  activeTab,
  mountedModes,
  selectedModes,
  editorRef,
  handleLoadTemplate,
  showPlaceholders,
  setShowPlaceholders,
  isEditorEmpty,
  setIsEditorEmpty,
  selectedTemplate
}) {
  const renderEditor = (mode) => {
    switch (mode) {
      case "Text":
        return <BroadcastTextMessage selectedTemplate={selectedTemplate} />;
      case "Email":
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
      case "Voice":
        return (
          <BroadcastTextVoiceMessage selectedTemplate={selectedTemplate} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="multipleBroadMessages">
      {selectedModes.map((mode) => (
        <div
          key={mode}
          className="tabContent"
          style={{ display: activeTab === mode ? "flex" : "none" }}
        >
          {mountedModes.has(mode) && renderEditor(mode)}
        </div>
      ))}
    </div>
  );
}

export default MultipleBroadMessages;
