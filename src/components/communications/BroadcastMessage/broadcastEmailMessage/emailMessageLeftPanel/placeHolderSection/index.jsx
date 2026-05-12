import { useState, useEffect, useRef } from "react";
import searchIcon from "../../../../../../assets/leftPanel/leftPanelSearch.svg";
import placeholderIcon from "../../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import "./style.scss";

const PLACEHOLDERS = [
  {
    label: "Accountstatement",
    value: "$AccountStatementURL",
    link: "https://gitlab.com/sketch-brahma/health-asyst/brodcast-ui/-/merge_requests/22"
  },
  {
    label: "Amount",
    value: "$AMOUNT",
    link: "https://www.lifesonmanipal.com/healthcheckup?location=MHB&utm_source=google&utm_medium=ppc&utm_campaignid=20397004528&utm_placement=&utm_network=search&utm_campaign=Health_Checkup_Oldairport_Road&utm_adgroup=Health_Checkup&utm_ad=&utm_term=manipal%20hospital&utm_device=c&gad_source=1&gad_campaignid=20397004528&gbraid=0AAAAAC8_-KwRdRtFWJdK3BBaeRaW26Us7&gclid=Cj0KCQjwk_bPBhDXARIsACiq8R3YAheX1KDbAnsuYBWkZCo3VD1RvoWem4ePzBxlsaSEuIQ7Pd4efCcaAv-OEALw_wcB"
  },
  {
    label: "Appointment Date",
    value: "$APPDATE",
    link: "https://www.lifesonmanipal.com/healthcheckup/mg8HT4-child-care-plus?location=MHB&utm_source=google&utm_medium=ppc&utm_campaignid=20397004528&utm_placement=&utm_network=search&utm_campaign=Health_Checkup_Oldairport_Road&utm_adgroup=Health_Checkup&utm_ad=&utm_term=manipal%20hospital&utm_device=c&gad_source=1&gad_campaignid=20397004528&gbraid=0AAAAAC8_-KwRdRtFWJdK3BBaeRaW26Us7&gclid=Cj0KCQjwk_bPBhDXARIsACiq8R1jkUj_RhTVzxW0EdaDK3zQ5Q9zF0aLQ8B3GC82rpgqAhypivl3d_8aAk2gEALw_wcB"
  },
  {
    label: "Appointment time (12 hour Format)",
    value: "$APPTIME12",
    link: "https://example.com/time12"
  },
  {
    label: "Appointment time (24 hour Format)",
    value: "$APPTIME",
    link: "https://example.com/time24"
  },
  {
    label: "Patient First Name",
    value: "$FNAME",
    link: "https://example.com/fname"
  },
  {
    label: "Patient Last Name",
    value: "$LNAME",
    link: "https://example.com/lname"
  },
  { label: "Google", value: "$GOOGLE", link: "https://www.google.com" },
  { label: "Facebook", value: "$FACEBOOK", link: "https://www.facebook.com" },
  { label: "Twitter", value: "$TWITTER", link: "https://www.twitter.com" },
  {
    label: "Instagram",
    value: "$INSTAGRAM",
    link: "https://www.instagram.com"
  },
  { label: "LinkedIn", value: "$LINKEDIN", link: "https://www.linkedin.com" }
];

export const PlaceHolderSection = ({ editorRef, setShowPlaceholders }) => {
  const [search, setSearch] = useState("");
  const savedRangeRef = useRef(null);
  const savedActiveElRef = useRef(null);
  // Tracks whether the canvas iframe currently has focus. We must stop
  // updating savedRangeRef the moment the iframe blurs, because GrapesJS
  // deactivating the RTE fires selectionchange inside the canvas and resets
  // the selection to position 0, which would corrupt the saved cursor position.
  const iframeHasFocusRef = useRef(false);

  const filteredPlaceholders = PLACEHOLDERS.filter((item) =>
    `${item.label} ${item.value}`.toLowerCase().includes(search.toLowerCase())
  );

  // Track the cursor position inside the canvas iframe, but only while the
  // iframe has focus. Freeze the saved range the moment the iframe blurs so
  // GrapesJS's post-blur DOM cleanup cannot overwrite the correct position.
  useEffect(() => {
    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    if (!canvasWindow) return;

    const saveRange = () => {
      if (!iframeHasFocusRef.current) return;
      const sel = canvasWindow.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        savedActiveElRef.current = canvasWindow.document.activeElement;
      }
    };

    const onFocus = () => {
      iframeHasFocusRef.current = true;
    };
    const onBlur = () => {
      iframeHasFocusRef.current = false;
    };

    canvasWindow.document.addEventListener("selectionchange", saveRange);
    canvasWindow.addEventListener("focus", onFocus);
    canvasWindow.addEventListener("blur", onBlur);

    return () => {
      canvasWindow.document.removeEventListener("selectionchange", saveRange);
      canvasWindow.removeEventListener("focus", onFocus);
      canvasWindow.removeEventListener("blur", onBlur);
    };
  }, [editorRef]);

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
    // Focus the iframe window first — execCommand operates on the focused document.
    canvasWindow.focus();
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
            <div className="placeholderTextContainer">
              <p className="placeholderText">
                {item.label} - {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
