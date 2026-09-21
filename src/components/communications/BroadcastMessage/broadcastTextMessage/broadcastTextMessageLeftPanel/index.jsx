import { useEffect, useRef, useState } from "react";
import searchIcon from "../../../../../assets/leftPanel/leftPanelSearch.svg";
import placeholderIcon from "../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import { useBroadcastConfigGet } from "../../../../../hooks/useBroadcastConfigGet";
import { ENDPOINTS } from "../../../../../api/endpoints.js";
import { BROADCAST_CONFIG_HEADERS } from "../../../../../api/api.jsx";
import "./style.scss";

function BroadcastTextMessageLeftPanel({ editorInstance }) {
  const [search, setSearch] = useState("");

  // Manual drag: mousedown.preventDefault() keeps focus inside the editor
  // (so the native blinking caret never disappears), then we track the
  // mouse globally and paint the caret at the drop position. HTML5 drag
  // is not used at all — it fights focus.
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

  // Save cursor position whenever iframe has focus.
  useEffect(() => {
    const editor = editorInstance?.editor;
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
  }, [editorInstance]);

  const findContentEditableAncestor = (node) => {
    let current = node;
    while (current) {
      if (current.nodeType === 1) {
        if (current.isContentEditable) return current;
        // Fallback: GrapesJS strips contenteditable when the RTE is idle,
        // but the underlying text component is still identifiable by class
        // or data-gjs-type.
        if (current.classList?.contains?.("text-editor-content"))
          return current;
        if (current.getAttribute?.("data-gjs-type") === "text") return current;
      }
      current = current.parentNode;
    }
    return null;
  };

  const insertPlaceholder = (value) => {
    const editor = editorInstance?.editor;
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    const canvasDoc = editor.Canvas.getDocument();
    if (!canvasWindow || !canvasDoc) return;

    const range = savedRangeRef.current;
    let targetEl = null;
    if (range && canvasDoc.body.contains(range.commonAncestorContainer)) {
      targetEl = findContentEditableAncestor(range.commonAncestorContainer);
    }
    if (!targetEl) {
      const wrapper = editor.getWrapper?.();
      const defaultComp = wrapper?.find(".text-editor-content")?.[0];
      const fallbackComp =
        defaultComp || wrapper?.find("[data-gjs-type='text']")?.[0];
      targetEl = fallbackComp?.getEl?.() || null;
    }
    if (!targetEl) return;

    const prevEditable = targetEl.contentEditable;
    targetEl.contentEditable = "true";

    // Directly insert at the saved range via Range.insertNode. This avoids
    // relying on focus() (which many browsers reset the selection on) and
    // avoids execCommand's dependency on the active element. If the range
    // doesn't point inside the target for some reason, fall back to end.
    let insertRange;
    if (range && targetEl.contains(range.commonAncestorContainer)) {
      insertRange = range.cloneRange();
      insertRange.deleteContents(); // no-op for collapsed ranges
    } else {
      insertRange = canvasDoc.createRange();
      insertRange.selectNodeContents(targetEl);
      insertRange.collapse(false);
    }

    const textNode = canvasDoc.createTextNode(value);
    insertRange.insertNode(textNode);
    // Position caret right after the inserted text
    insertRange.setStartAfter(textNode);
    insertRange.collapse(true);

    const sel = canvasWindow.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(insertRange);
    }
    savedRangeRef.current = insertRange.cloneRange();

    targetEl.contentEditable = prevEditable;

    // Locate the GrapesJS component that owns targetEl and sync its content.
    // Without this, `editor.getHtml()` reads the stale pre-insert content
    // from the model on save, dropping the placeholder.
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
    const ownerComp = findOwnerComp(targetEl) || editor.getSelected?.();
    if (ownerComp) {
      try {
        ownerComp.set("content", targetEl.innerHTML, { silent: true });
      } catch {
        /* ignore */
      }
    }

    // Notify GrapesJS so char-count / dirty subscribers refresh — insertNode
    // doesn't emit the native input events execCommand would have.
    try {
      editor.trigger("component:update:content", ownerComp);
      editor.trigger("update");
    } catch {
      /* ignore */
    }
  };

  const startManualDrag = (value, startEvent) => {
    const editor = editorInstance?.editor;
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

    // Custom caret: a blinking vertical bar drawn on the OUTER document that
    // marks the character position where the placeholder will be inserted.
    // We draw it ourselves because the browser hides the native caret while
    // focus is anywhere except a focused contenteditable — during a drag it
    // often is not.
    if (!document.getElementById("placeholder-caret-keyframes")) {
      const kf = document.createElement("style");
      kf.id = "placeholder-caret-keyframes";
      kf.textContent =
        "@keyframes placeholder-caret-blink { 50% { opacity: 0; } }";
      document.head.appendChild(kf);
    }
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
      // Collapsed range may return zero rect — insert a temp marker to measure.
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
        // Range gave no usable rect — fall back to raw mouse position.
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

    // Shared handler that expects OUTER viewport coordinates.
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
        const editable = findContentEditableAncestor(
          range.commonAncestorContainer
        );
        if (editable) savedRangeRef.current = range.cloneRange();
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
    };

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
  };

  return (
    <div className="broadcastTextMessageLeftPanel">
      <h3 className="broadcastTextMessageLeftPanelText">Placeholders</h3>

      <div className="broadcastTextMessageLeftPanelSearch">
        <img src={searchIcon} alt="searchIcon" className="searchIcon" />
        <input
          type="text"
          placeholder="Search Placeholders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="broadcastTextMessageLeftPanelList">
        {filteredPlaceholders.map((item, index) => (
          <div
            key={index}
            className="broadcastTextMessageLeftPanelItem"
            onMouseDown={(e) => {
              // preventDefault stops the browser from moving focus away from
              // the editor and also stops native HTML5 drag from starting.
              e.preventDefault();
              startManualDrag(item.value, e.nativeEvent);
            }}
          >
            <div
              className="broadcastTextMessageLeftPanelIconContainer"
              style={{ pointerEvents: "none" }}
            >
              <img
                src={placeholderIcon}
                alt="placeholderIcon"
                draggable={false}
              />
            </div>
            <div
              className="broadcastTextMessageLeftPanelTextContainer"
              style={{ pointerEvents: "none" }}
            >
              <p className="broadcastTextMessageLeftPanelText">
                {item.label} - {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BroadcastTextMessageLeftPanel;
