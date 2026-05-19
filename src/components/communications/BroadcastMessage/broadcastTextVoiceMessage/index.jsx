import { useState, useCallback } from "react";
import BroadcastTextVoiceMessageEditor from "./broadcastTextVoiceMessageEditor/index";
import BroadcastTextVoiceMessageLeftPanel from "./broadcastTextVoiceMessageLeftPanel/index";
import BroadcastTextVoiceMessageRightPanel from "./broadcastTextVoiceMessageRightPanel/index";
import "./style.scss";

function BroadcastTextVoiceMessage({ selectedTemplate }) {
  const [content, setContent] = useState("");
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [editorInstance, setEditorInstance] = useState(null);

  const handleContentChange = useCallback((text, isEmpty) => {
    setContent(text);
    setIsEditorEmpty(isEmpty);
  }, []);

  const handleEditorReady = useCallback((instance) => {
    setEditorInstance(instance);
  }, []);

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
        isEditorEmpty={isEditorEmpty}
      />
    </div>
  );
}

export default BroadcastTextVoiceMessage;
