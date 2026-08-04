import { useEffect, useRef } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import "./style.scss";

export const EmojiSection = ({ editorRef }) => {
  const savedRangeRef = useRef(null);
  const savedActiveElRef = useRef(null);
  const iframeHasFocusRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let pollTimer = null;
    let cleanup = null;

    const attach = () => {
      if (disposed) return;
      const editor = editorRef?.current?.getEditor?.();
      const canvasWindow = editor?.Canvas?.getWindow?.();
      if (!canvasWindow) {
        pollTimer = setTimeout(attach, 200);
        return;
      }

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

      cleanup = () => {
        canvasWindow.document.removeEventListener("selectionchange", saveRange);
        canvasWindow.removeEventListener("focus", onFocus);
        canvasWindow.removeEventListener("blur", onBlur);
      };
    };

    attach();

    return () => {
      disposed = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (cleanup) cleanup();
    };
  }, [editorRef]);

  const insertEmoji = (emoji) => {
    const value = emoji?.native;
    if (!value) return;
    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const canvasWindow = editor.Canvas.getWindow();
    if (!canvasWindow) return;

    const savedRange = savedRangeRef.current;
    const el = savedActiveElRef.current;
    if (!savedRange || !el) return;

    el.contentEditable = "true";
    canvasWindow.focus();
    el.focus();

    const sel = canvasWindow.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }

    canvasWindow.document.execCommand("insertText", false, value);

    const selected = editor.getSelected?.();
    if (selected) {
      try {
        selected.set("content", el.innerHTML, { silent: true });
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="emojiSection">
      <Picker
        data={data}
        onEmojiSelect={insertEmoji}
        theme="light"
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>
  );
};
