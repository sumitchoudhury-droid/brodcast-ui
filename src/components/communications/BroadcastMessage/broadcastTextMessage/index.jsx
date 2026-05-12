import { useState, useCallback } from "react";
import "./style.scss";
import BroadcastTextMessageLeftPanel from "./broadcastTextMessageLeftPanel/index";
import BroadcastTextMessageRightPanel from "./broadcastTextMessageRightPanel/index";
import BroadcastTextMessageEditor from "./broadcastTextMessageEditor/index";

function BroadcastTextMessage() {
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [editorInstance, setEditorInstance] = useState(null);

  const handleContentChange = useCallback((html, isEmpty) => {
    setIsEditorEmpty(isEmpty);
    console.log("Final HTML Content:", html);
  }, []);

  const handleEditorReady = useCallback((instance) => {
    setEditorInstance(instance);
  }, []);

  return (
    <div className="broadcastTextMessageContainer">
      <BroadcastTextMessageLeftPanel />
      <BroadcastTextMessageEditor
        onContentChange={handleContentChange}
        onReady={handleEditorReady}
      />
      <BroadcastTextMessageRightPanel
        isEditorEmpty={isEditorEmpty}
        editorInstance={editorInstance}
      />
    </div>
  );
}

export default BroadcastTextMessage;
