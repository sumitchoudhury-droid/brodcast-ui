import { useState, useCallback } from "react";
import BroadcastTextVoiceMessageEditor from "./broadcastTextVoiceMessageEditor/index";
import BroadcastTextVoiceMessageLeftPanel from "./broadcastTextVoiceMessageLeftPanel/index";
import BroadcastTextVoiceMessageRightPanel from "./broadcastTextVoiceMessageRightPanel/index";
import "./style.scss";

function BroadcastTextVoiceMessage() {
  const [content, setContent] = useState("");
  const [editorInstance, setEditorInstance] = useState(null);

  const handleEditorReady = useCallback((instance) => {
    setEditorInstance(instance);
  }, []);

  return (
    <div className="broadcastTexVoiceMessageContainer">
      <BroadcastTextVoiceMessageLeftPanel editorInstance={editorInstance} />
      <BroadcastTextVoiceMessageEditor
        onContentChange={setContent}
        onReady={handleEditorReady}
      />
      <BroadcastTextVoiceMessageRightPanel
        editorContent={content}
        isEditorEmpty={!content || content.trim() === ""}
      />
    </div>
  );
}

export default BroadcastTextVoiceMessage;
