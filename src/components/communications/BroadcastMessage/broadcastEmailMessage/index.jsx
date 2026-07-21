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
  setIsEditorEmpty,
  onDirtyChange,
  selectedTemplate
}) => {
  return (
    <div className="builder">
      <div className="leftPanelWrapper">
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
      </div>

      <div className="editorArea">
        <Editor
          editorRef={editorRef}
          setIsEditorEmpty={setIsEditorEmpty}
          onDirtyChange={onDirtyChange}
          initialTemplate={selectedTemplate?.emailTemplate}
        />
      </div>

      <RightPanel editorRef={editorRef} isEditorEmpty={isEditorEmpty} />
    </div>
  );
};
