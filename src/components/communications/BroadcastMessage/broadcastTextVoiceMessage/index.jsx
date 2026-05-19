import { useState } from "react";
import BroadcastTextVoiceMessageEditor from "./broadcastTextVoiceMessageEditor/index";
import BroadcastTextVoiceMessageLeftPanel from "./broadcastTextVoiceMessageLeftPanel/index";
import BroadcastTextVoiceMessageRightPanel from "./broadcastTextVoiceMessageRightPanel/index";
import "./style.scss";

function BroadcastTextVoiceMessage({ selectedTemplate }) {
  const [content, setContent] = useState("");

  return (
    <div className="broadcastTexVoiceMessageContainer">
      <BroadcastTextVoiceMessageLeftPanel />
      <BroadcastTextVoiceMessageEditor
        onContentChange={setContent}
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
