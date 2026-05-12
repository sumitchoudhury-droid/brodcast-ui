import BroadcastTextMessage from "../broadcastTextMessage";
import { BroadcastEmailMessage } from "../broadcastEmailMessage";
import BroadcastTextVoiceMessage from "../broadcastTextVoiceMessage";
import "./style.scss";

function MultipleBroadMessages({
  activeTab,
  editorRef,
  handleLoadTemplate,
  showPlaceholders,
  setShowPlaceholders,
  isEditorEmpty,
  setIsEditorEmpty
}) {
  const renderContent = () => {
    switch (activeTab) {
      case "Text":
        return <BroadcastTextMessage />;
      case "Email":
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
      case "Voice":
        return <BroadcastTextVoiceMessage />;
      default:
        return null;
    }
  };

  return (
    <div className="multipleBroadMessages">
      <div className="tabContent">{renderContent()}</div>
    </div>
  );
}

export default MultipleBroadMessages;
