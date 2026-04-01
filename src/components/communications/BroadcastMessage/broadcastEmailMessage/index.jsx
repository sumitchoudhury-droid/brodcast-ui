// BroadcastMessage.jsx  (parent / page component)
import { useRef, useState } from "react";
import "./style.scss";
import languageIcon from "../../../../assets/mainScreen/languageIcon.svg";
import greenChevronRight from "../../../../assets/mainScreen/greenChevronRight.svg";
import LeftPanel from "./emailMessageLeftPanel/leftPanel";
import Editor from "./emailMessageEditor/editor";
import RightPanel from "./emailMessageRightPanel/rightPanel";
import Footer from "./emailMessageFooter/footer";
import { PlaceHolderSection } from "./emailMessageLeftPanel/placeHolderSection";

export const BroadcastEmailMessage = () => {
  // Shared ref — Editor populates it, LeftPanel reads it
  const editorRef = useRef(null);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  const handleLoadTemplate = (templateName) => {
    // TODO: load a real MJML string for the chosen template
    console.log("Load template:", templateName);
  };

  return (
    <div className="broadcastMessageContainer">
      <div className="header">
        <h2 className="mainTitle">Add Mail Message for Broadcast</h2>
        <div className="headerRight">
          <img src={languageIcon} alt="languageIcon" />
          <p>English</p>
          <img src={greenChevronRight} alt="greenChevronRight" />
        </div>
      </div>
      <div className="builder">
        {/* Pass editorRef so LeftPanel can call editor.BlockManager.startDrag() */}
        <LeftPanel
          editorRef={editorRef}
          onLoadTemplate={handleLoadTemplate}
          showPlaceholders={showPlaceholders}
          setShowPlaceholders={setShowPlaceholders}
        />

        {showPlaceholders && (
          <PlaceHolderSection setShowPlaceholders={setShowPlaceholders} />
        )}

        <div className="editorArea">
          {/* Editor populates editorRef.current once GrapesJS is ready */}
          <Editor editorRef={editorRef} setIsEditorEmpty={setIsEditorEmpty} />
        </div>

        <RightPanel editorRef={editorRef} isEditorEmpty={isEditorEmpty} />
      </div>
      <div className="footerContainer">
        <Footer />
      </div>
    </div>
  );
};
