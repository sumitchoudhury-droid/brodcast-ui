import "./style.scss";
import LeftPanel from "./emailMessageLeftPanel/leftPanel";
import Editor from "./emailMessageEditor/editor";
import RightPanel from "./emailMessageRightPanel/rightPanel";
import { PlaceHolderSection } from "./emailMessageLeftPanel/placeHolderSection";

export const BroadcastEmailMessage = ({
  editorRef,
  handleLoadTemplate,
  showPlaceholders,
  setShowPlaceholders,
  isEditorEmpty,
  setIsEditorEmpty
}) => {
  return (
    <div className="builder">
      <LeftPanel
        editorRef={editorRef}
        onLoadTemplate={handleLoadTemplate}
        showPlaceholders={showPlaceholders}
        setShowPlaceholders={setShowPlaceholders}
      />

      {showPlaceholders && (
        <PlaceHolderSection
          editorRef={editorRef}
          setShowPlaceholders={setShowPlaceholders}
        />
      )}

      <div className="editorArea">
        <Editor editorRef={editorRef} setIsEditorEmpty={setIsEditorEmpty} />
      </div>

      <RightPanel editorRef={editorRef} isEditorEmpty={isEditorEmpty} />
    </div>
  );
};
