import { useState, useEffect, useRef } from "react";
import searchIcon from "../../../../../../assets/leftPanel/leftPanelSearch.svg";
import placeholderIcon from "../../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import "./style.scss";

const PLACEHOLDERS = [
  { label: "Accountstatement", value: "$AccountStatementURL" },
  { label: "Amount", value: "$AMOUNT" },
  { label: "Appointment Date", value: "$APPDATE" },
  { label: "Appointment time (12 hour Format)", value: "$APPTIME12" },
  { label: "Appointment time (24 hour Format)", value: "$APPTIME" },
  { label: "Patient First Name", value: "$FNAME" },
  { label: "Patient Last Name", value: "$LNAME" }
];

export const PlaceHolderSection = ({ editorRef, setShowPlaceholders }) => {
  const [search, setSearch] = useState("");
  const savedRangeRef = useRef(null);
  const savedActiveElRef = useRef(null);

  const filteredPlaceholders = PLACEHOLDERS.filter((item) =>
    `${item.label} ${item.value}`.toLowerCase().includes(search.toLowerCase())
  );

  // Continuously track the cursor position inside the canvas iframe.
  useEffect(() => {
    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    if (!canvasWindow) return;

    const saveRange = () => {
      const sel = canvasWindow.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        savedActiveElRef.current = canvasWindow.document.activeElement;
      }
    };

    canvasWindow.document.addEventListener("selectionchange", saveRange);
    return () =>
      canvasWindow.document.removeEventListener("selectionchange", saveRange);
  }, [editorRef]);

  // Called at mousedown — the earliest moment to snapshot the iframe selection
  // before the browser shifts focus and GrapesJS deactivates the RTE.
  const snapshotSelection = () => {
    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    if (!canvasWindow) return;
    const sel = canvasWindow.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      savedActiveElRef.current = canvasWindow.document.activeElement;
    }
  };

  const insertPlaceholder = (value) => {
    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    if (!canvasWindow) return;

    const savedRange = savedRangeRef.current;
    const el = savedActiveElRef.current;
    if (!savedRange || !el) return;

    // GrapesJS removes contenteditable when it deactivates the RTE on blur.
    // Force it back so execCommand can write into the element.
    el.contentEditable = "true";
    el.focus();

    // Restore the exact cursor position captured at mousedown.
    const sel = canvasWindow.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }

    // execCommand handles text-node splitting and caret placement correctly
    // for all cursor positions — avoids Range.insertNode's spec quirks around
    // post-insertion range repositioning.
    canvasWindow.document.execCommand("insertText", false, value);
  };

  return (
    <div className="placeholderSection">
      <h3 className="placeholderTitle">Placeholders</h3>

      <div className="placeholderSearch">
        <img src={searchIcon} alt="searchIcon" className="searchIcon" />
        <input
          type="text"
          placeholder="Search Placeholders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="placeholderList">
        {filteredPlaceholders.map((item, index) => (
          <div
            key={index}
            className="placeholderItem"
            draggable
            onMouseDown={(e) => {
              e.preventDefault();
              snapshotSelection();
            }}
            onClick={() => insertPlaceholder(item.value)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", item.value);
              e.dataTransfer.setData(
                "text/html",
                `<mj-text font-family="Inter" font-size="16px" font-style="normal" font-weight="400" color="#404B5A" align="center" line-height="22px" padding="0px" margin="0px">${item.value}</mj-text>`
              );
              e.dataTransfer.setData("application/x-placeholder", "true");
            }}
            onDragEnd={() => {
              if (setShowPlaceholders) setShowPlaceholders(false);
            }}
          >
            <div className="iconContainer">
              <img src={placeholderIcon} alt="placeholderIcon" />
            </div>
            <p className="placeholderText">
              {item.label} - {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
