import { useState, useCallback } from "react";
import BroadcastTextVoiceMessageEditor from "./broadcastTextVoiceMessageEditor/index";
import BroadcastTextVoiceMessageLeftPanel from "./broadcastTextVoiceMessageLeftPanel/index";
import BroadcastTextVoiceMessageRightPanel from "./broadcastTextVoiceMessageRightPanel/index";
import "./style.scss";

function BroadcastTextVoiceMessage({ selectedTemplate, onEmptyChange }) {
  const [content, setContent] = useState("");
  const [editorInstance, setEditorInstance] = useState(null);

  const handleEditorReady = useCallback((instance) => {
    setEditorInstance(instance);
  }, []);

  const handleContentChange = useCallback(
    (value) => {
      setContent(value);
      onEmptyChange?.(!value || value.trim() === "");
    },
    [onEmptyChange]
  );

  return (
    <div className="broadcastTexVoiceMessageContainer">
      <BroadcastTextVoiceMessageLeftPanel editorInstance={editorInstance} />
      <BroadcastTextVoiceMessageEditor
        onContentChange={handleContentChange}
        onReady={handleEditorReady}
        initialTemplate={selectedTemplate?.voiceTemplate}
      />
      <BroadcastTextVoiceMessageRightPanel
        editorContent={content}
        isEditorEmpty={!content || content.trim() === ""}
      />
    </div>
  );
}

export default BroadcastTextVoiceMessage;
