import { useState } from "react";
import BroadcastTextVoiceMessageEditor from "./broadcastTextVoiceMessageEditor/index";
import BroadcastTextVoiceMessageLeftPanel from "./broadcastTextVoiceMessageLeftPanel/index";
import BroadcastTextVoiceMessageRightPanel from "./broadcastTextVoiceMessageRightPanel/index";
import "./style.scss";

function BroadcastTextVoiceMessage() {
  const [content, setContent] = useState("");

  return (
    <div className="broadcastTexVoiceMessageContainer">
      <BroadcastTextVoiceMessageLeftPanel />
      <BroadcastTextVoiceMessageEditor onContentChange={setContent} />
      <BroadcastTextVoiceMessageRightPanel editorContent={content} />
    </div>
  );
}

export default BroadcastTextVoiceMessage;
