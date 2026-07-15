import { useState, useCallback } from "react";
import "./style.scss";
import BroadcastTextMessageLeftPanel from "./broadcastTextMessageLeftPanel/index";
import BroadcastTextMessageRightPanel from "./broadcastTextMessageRightPanel/index";
import BroadcastTextMessageEditor from "./broadcastTextMessageEditor/index";

function BroadcastTextMessage({
  selectedTemplate,
  onEmptyChange,
  onEditorReady
}) {
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [editorInstance, setEditorInstance] = useState(null);

  const handleContentChange = useCallback(
    (html, isEmpty) => {
      setIsEditorEmpty(isEmpty);
      onEmptyChange?.(isEmpty);
      console.log("Final HTML Content:", html);
    },
    [onEmptyChange]
  );

  const handleEditorReady = useCallback(
    (instance) => {
      setEditorInstance(instance);
      onEditorReady?.(instance);
    },
    [onEditorReady]
  );

  return (
    <div className="broadcastTextMessageContainer">
      <BroadcastTextMessageLeftPanel editorInstance={editorInstance} />
      <BroadcastTextMessageEditor
        onContentChange={handleContentChange}
        onReady={handleEditorReady}
        initialTemplate={selectedTemplate?.textTemplate}
      />
      <BroadcastTextMessageRightPanel
        isEditorEmpty={isEditorEmpty}
        editorInstance={editorInstance}
      />
    </div>
  );
}

export default BroadcastTextMessage;
