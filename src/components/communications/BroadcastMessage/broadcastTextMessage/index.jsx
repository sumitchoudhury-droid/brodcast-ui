import { useState } from "react";
import "./style.scss";
import BroadcastTextMessageLeftPanel from "./broadcastTextMessageLeftPanel/index";
import BroadcastTextMessageRightPanel from "./broadcastTextMessageRightPanel/index";
import BroadcastTextMessageEditor from "./broadcastTextMessageEditor/index";

function BroadcastTextMessage() {
  const [messageContent, setMessageContent] = useState("");

  const handleContentChange = (html) => {
    setMessageContent(html);
    console.log("Final HTML Content:", html);
  };

  return (
    <div className="broadcastTextMessageContainer">
      <BroadcastTextMessageLeftPanel />
      <BroadcastTextMessageEditor onContentChange={handleContentChange} />
      <BroadcastTextMessageRightPanel messageContent={messageContent} />
    </div>
  );
}

export default BroadcastTextMessage;
