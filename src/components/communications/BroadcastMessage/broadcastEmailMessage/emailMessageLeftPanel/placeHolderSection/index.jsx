import { useState, useEffect, useRef } from "react";
import searchIcon from "../../../../../../assets/leftPanel/leftPanelSearch.svg";
import placeholderIcon from "../../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import { useBroadcastConfigGet } from "../../../../../../hooks/useBroadcastConfigGet";
import { ENDPOINTS } from "../../../../../../api/endpoints.js";
import { BROADCAST_CONFIG_HEADERS } from "../../../../../../api/api.jsx";
import "./style.scss";

export const PlaceHolderSection = ({ editorRef, setShowPlaceholders }) => {
  const [search, setSearch] = useState("");
  const savedRangeRef = useRef(null);
  const iframeHasFocusRef = useRef(false);

  const { data: placeholdersData } = useBroadcastConfigGet(
    ["placeholders"],
    ENDPOINTS.broadcastConfig.PLACEHOLDERS,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const placeholders = (placeholdersData?.data ?? []).map((item) => ({
    label: item.displayName,
    value: item.placeHolder
  }));

  const filteredPlaceholders = placeholders.filter((item) =>
    `${item.label} ${item.value}`.toLowerCase().includes(search.toLowerCase())
  );

  // Track cursor position inside the canvas iframe while it has focus.
  useEffect(() => {
    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    if (!canvasWindow) return;
    const canvasDoc = canvasWindow.document;

    const saveRange = () => {
      if (!iframeHasFocusRef.current) return;
      const sel = canvasWindow.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    const onFocus = () => {
      iframeHasFocusRef.current = true;
    };
    const onBlur = () => {
      iframeHasFocusRef.current = false;
    };

    canvasDoc.addEventListener("selectionchange", saveRange);
    canvasWindow.addEventListener("focus", onFocus);
    canvasWindow.addEventListener("blur", onBlur);

    return () => {
      canvasDoc.removeEventListener("selectionchange", saveRange);
      canvasWindow.removeEventListener("focus", onFocus);
      canvasWindow.removeEventListener("blur", onBlur);
    };
  }, [editorRef]);

  // Resolve the concrete DOM element that a range's start position lives
  // inside — a text node's parent, or the element itself. This is what we
  // need to focus + force contentEditable on for execCommand to work.
  const resolveTargetEl = (range) => {
    const start = range?.startContainer;
    if (!start) return null;
    if (start.nodeType === 3) return start.parentElement;
    if (start.nodeType === 1) return start;
    return null;
  };

  // Walk up to find any mj-text / text component or contenteditable ancestor
  // for owner-component lookup.
  const findTextComponentAncestor = (node) => {
    let current = node;
    while (current) {
      if (current.nodeType === 1) {
        const gjsType = current.getAttribute?.("data-gjs-type");
        if (gjsType === "text" || gjsType === "mj-text") return current;
        if (current.isContentEditable) return current;
      }
      current = current.parentNode;
    }
    return null;
  };

  const insertPlaceholder = (value) => {
    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    const canvasDoc = editor.Canvas.getDocument();
    if (!canvasWindow || !canvasDoc) return;

    const savedRange = savedRangeRef.current;
    if (
      !savedRange ||
      !canvasDoc.body.contains(savedRange.commonAncestorContainer)
    ) {
      return;
    }

    // The element the cursor lives in — force contenteditable there so
    // execCommand("insertText") writes to the right place regardless of
    // whether GrapesJS's RTE is currently active on it.
    const targetEl = resolveTargetEl(savedRange);
    if (!targetEl) return;

    // Force contenteditable up the chain so focus lands on a valid editable
    // element and inheritance is consistent.
    const enabledEls = [];
    let walk = targetEl;
    while (walk && walk !== canvasDoc.body) {
      if (
        walk.nodeType === 1 &&
        walk.getAttribute("contenteditable") !== "true"
      ) {
        walk.setAttribute("contenteditable", "true");
        enabledEls.push(walk);
      }
      walk = walk.parentElement;
    }

    canvasWindow.focus();
    targetEl.focus?.();

    // Restore the exact cursor position captured during drag. focus() often
    // resets the selection, so we apply the saved range AFTER focus.
    const sel = canvasWindow.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }

    // Try native execCommand first — it handles text-node splitting inside
    // MJML-rendered content. Fall back to a direct Range.insertNode if the
    // command reports failure (e.g. element wasn't actually focused).
    let inserted = false;
    try {
      inserted = canvasDoc.execCommand("insertText", false, value);
    } catch {
      inserted = false;
    }
    if (!inserted) {
      try {
        const workRange = savedRange.cloneRange();
        workRange.deleteContents();
        const textNode = canvasDoc.createTextNode(value);
        workRange.insertNode(textNode);
        workRange.setStartAfter(textNode);
        workRange.collapse(true);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(workRange);
        }
      } catch {
        /* ignore */
      }
    }

    // Snapshot the new caret position.
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }

    // Restore original contenteditable state on the ancestors we changed.
    enabledEls.forEach((el) => el.removeAttribute("contenteditable"));

    // Sync GrapesJS model with the DOM so getHtml() reflects the insert.
    const wrapper = editor.getWrapper?.();
    const findOwnerComp = (el) => {
      let cur = el;
      while (cur && cur !== canvasDoc.body) {
        const id = cur.getAttribute?.("id");
        if (id && wrapper) {
          const found = wrapper.find("#" + id);
          if (found.length) return found[0];
        }
        cur = cur.parentElement;
      }
      return null;
    };
    const textComp = findTextComponentAncestor(targetEl);
    const ownerComp =
      findOwnerComp(textComp || targetEl) || editor.getSelected?.();
    if (ownerComp && textComp) {
      try {
        ownerComp.set("content", textComp.innerHTML, { silent: true });
      } catch {
        /* ignore */
      }
    }
    try {
      editor.trigger("component:update:content", ownerComp);
      editor.trigger("update");
    } catch {
      /* ignore */
    }
  };

  const startManualDrag = (value, startEvent) => {
    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    const canvasDoc = editor.Canvas.getDocument();
    const iframeEl = editor.Canvas.getFrameEl?.();
    if (!canvasWindow || !canvasDoc || !iframeEl) return;

    document.body.classList.add("placeholder-dragging");

    // Disable iframe pointer events during the drag so every mouse event flows
    // to the outer document. This gives us one coordinate system (outer
    // viewport CSS pixels via clientX/Y) that stays consistent at any browser
    // zoom, monitor size, or left-panel width — no cross-frame translation and
    // no screenX/window.screenX subtraction (which is in screen-CSS pixels and
    // drifts under page zoom).
    const prevIframePointerEvents = iframeEl.style.pointerEvents;
    iframeEl.style.pointerEvents = "none";

    // Ghost chip that follows the mouse.
    const ghost = document.createElement("div");
    ghost.textContent = value;
    ghost.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "transform:translate(12px, 12px)",
      "padding:6px 10px",
      "background:#1570EF",
      "color:#fff",
      "font-family:Inter, Arial, sans-serif",
      "font-size:12px",
      "font-weight:500",
      "line-height:16px",
      "border-radius:6px",
      "box-shadow:0 4px 12px rgba(16,24,40,0.15)",
      "pointer-events:none",
      "z-index:2147483647",
      "white-space:nowrap",
      "opacity:0.95"
    ].join(";");
    document.body.appendChild(ghost);

    // Custom caret indicator (blue vertical bar) drawn on the outer document.
    const caret = document.createElement("div");
    caret.style.cssText = [
      "position:fixed",
      "width:2px",
      "height:20px",
      "background:#1570EF",
      "pointer-events:none",
      "display:none",
      "z-index:2147483647"
    ].join(";");
    document.body.appendChild(caret);

    const positionGhost = (clientX, clientY) => {
      ghost.style.left = `${clientX}px`;
      ghost.style.top = `${clientY}px`;
    };

    const showCaretAtRange = (range, fallbackClientX, fallbackClientY) => {
      const iframeRect = iframeEl.getBoundingClientRect();
      let rect = range?.getBoundingClientRect?.();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        try {
          const marker = canvasDoc.createElement("span");
          marker.style.cssText = "display:inline-block;width:0;height:1em;";
          const workRange = range.cloneRange();
          workRange.insertNode(marker);
          rect = marker.getBoundingClientRect();
          const parent = marker.parentNode;
          marker.remove();
          if (parent) parent.normalize();
        } catch {
          /* ignore */
        }
      }
      if (rect && (rect.height > 0 || rect.width > 0)) {
        caret.style.left = `${iframeRect.left + rect.left}px`;
        caret.style.top = `${iframeRect.top + rect.top}px`;
        caret.style.height = `${rect.height || 20}px`;
      } else {
        caret.style.left = `${fallbackClientX}px`;
        caret.style.top = `${fallbackClientY - 10}px`;
        caret.style.height = `20px`;
      }
      caret.style.display = "block";
    };

    const hideCaret = () => {
      caret.style.display = "none";
    };

    if (startEvent) positionGhost(startEvent.clientX, startEvent.clientY);

    const handleMoveAtOuterCoords = (outerX, outerY) => {
      positionGhost(outerX, outerY);

      const iframeRect = iframeEl.getBoundingClientRect();
      if (
        outerX < iframeRect.left ||
        outerX > iframeRect.right ||
        outerY < iframeRect.top ||
        outerY > iframeRect.bottom
      ) {
        hideCaret();
        return;
      }
      const x = outerX - iframeRect.left;
      const y = outerY - iframeRect.top;

      let range = null;
      if (canvasDoc.caretRangeFromPoint) {
        range = canvasDoc.caretRangeFromPoint(x, y);
      } else if (canvasDoc.caretPositionFromPoint) {
        const pos = canvasDoc.caretPositionFromPoint(x, y);
        if (pos) {
          range = canvasDoc.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }

      if (range) {
        // Save the range whenever it points anywhere inside the iframe body —
        // heading/paragraph blocks may not report contenteditable during
        // drag, so a strict editable check would drop valid drop targets.
        savedRangeRef.current = range.cloneRange();
      }
      showCaretAtRange(range, outerX, outerY);
    };

    const onMouseMove = (ev) => {
      handleMoveAtOuterCoords(ev.clientX, ev.clientY);
    };

    const cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("mouseup", onMouseUp, true);
      iframeEl.style.pointerEvents = prevIframePointerEvents;
      document.body.classList.remove("placeholder-dragging");
      ghost.remove();
      caret.remove();
    };
    const onMouseUp = () => {
      cleanup();
      insertPlaceholder(value);
      if (setShowPlaceholders) setShowPlaceholders(false);
    };

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
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
            onMouseDown={(e) => {
              // preventDefault stops focus loss and prevents native HTML5 drag
              // from initiating; the drag is handled manually below.
              e.preventDefault();
              startManualDrag(item.value, e.nativeEvent);
            }}
          >
            <div className="iconContainer" style={{ pointerEvents: "none" }}>
              <img
                src={placeholderIcon}
                alt="placeholderIcon"
                draggable={false}
              />
            </div>
            <div
              className="placeholderTextContainer"
              style={{ pointerEvents: "none" }}
            >
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
