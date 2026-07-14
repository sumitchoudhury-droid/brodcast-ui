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
  onTextEmptyChange,
  onVoiceEmptyChange,
  onTextEditorReady,
  selectedTemplate
}) {
  const renderEditor = (mode) => {
    switch (mode.toLowerCase()) {
      case "text":
        return (
          <BroadcastTextMessage
            selectedTemplate={selectedTemplate}
            onEmptyChange={onTextEmptyChange}
            onEditorReady={onTextEditorReady}
          />
        );
      case "email":
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
      case "voice":
        return (
          <BroadcastTextVoiceMessage
            selectedTemplate={selectedTemplate}
            onEmptyChange={onVoiceEmptyChange}
          />
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
