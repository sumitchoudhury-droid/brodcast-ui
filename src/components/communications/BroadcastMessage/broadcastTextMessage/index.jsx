import "./style.scss";
import BroadcastTextMessageLeftPanel from "./broadcastTextMessageLeftPanel/index";
import BroadcastTextMessageRightPanel from "./broadcastTextMessageRightPanel/index";
import BroadcastTextMessageEditor from "./broadcastTextMessageEditor/index";

function BroadcastTextMessage() {
  return (
    <div className="broadcastTextMessageContainer">
      <BroadcastTextMessageLeftPanel />
      <BroadcastTextMessageEditor />
      <BroadcastTextMessageRightPanel />
    </div>
  );
}

export default BroadcastTextMessage;
