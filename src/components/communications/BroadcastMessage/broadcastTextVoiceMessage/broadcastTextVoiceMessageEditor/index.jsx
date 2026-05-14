import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "./style.scss";

const BroadcastTextVoiceMessageEditor = ({ onContentChange }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      fromElement: false,
      height: "100%",
      width: "100%",
      storageManager: false,
      panels: {
        defaults: []
      },
      blockManager: { blocks: [] },
      styleManager: { sectors: [] },
      layerManager: false,
      traitManager: false,
      deviceManager: false,
      selectorManager: false,
      showDevices: false,
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
          "data:text/css,.text-editor-content:empty::before { content: attr(data-placeholder); color: #D3DBE4; pointer-events: none; display: block; font-style: normal; }"
        ]
      }
    });

    // Hide the RTE toolbar specifically for this instance
    editor.on("rte:enable", () => {
      setTimeout(() => {
        const rteToolbar = editor.RichTextEditor.getToolbarEl();
        if (rteToolbar) {
          rteToolbar.style.setProperty("display", "none", "important");
        }
      }, 0);
    });

    editor.on("load", () => {
      editor.setComponents([
        {
          tagName: "div",
          classes: ["text-editor-container"],
          attributes: {
            style:
              "display: flex; flex-direction: column; height: 100%; box-sizing: border-box;"
          },
          components: [
            {
              tagName: "div",
              type: "text", // Ensures manual typing is enabled
              classes: ["text-editor-content"],
              attributes: {
                "data-placeholder":
                  "Start typing or drag and drop a placeholder from left panel.",
                style:
                  "padding: 20px 20px 10px 20px; font-family: Inter, sans-serif; font-size: 14px; font-weight: 400; line-height: 20px; outline: none; color: #404B5A; height: fit-content;"
              },
              editable: true,
              draggable: false,
              droppable: true,
              removable: false,
              selectable: true,
              hoverable: false,
              badgable: false,
              toolbar: []
            },
            {
              tagName: "div",
              classes: ["opt-out-section"],
              attributes: {
                style:
                  "padding: 10px 20px 20px 20px; font-family: Inter, sans-serif; font-size: 14px; font-weight: 400; line-height: 20px; color: #D3DBE4; cursor: default; user-select: none;"
              },
              content:
                "To opt out of future calls from Manipal Hospitals, please press 9.",
              editable: false,
              draggable: false,
              droppable: false,
              removable: false,
              selectable: false,
              hoverable: false,
              badgable: false,
              copyable: false,
              toolbar: []
            }
          ]
        }
      ]);

      const wrapper = editor.getWrapper();
      const contentComp = wrapper.find(".text-editor-content")[0];
      if (contentComp) {
        editor.select(contentComp);
      }
    });

    const updateContent = () => {
      const wrapper = editor.getWrapper();
      const contentComp = wrapper.find(".text-editor-content")[0];
      const optOutComp = wrapper.find(".opt-out-section")[0];

      let fullText = "";
      if (contentComp) {
        const el = contentComp.getEl();
        fullText += (
          el ? el.innerText : contentComp.get("content") || ""
        ).trim();
      }

      if (optOutComp) {
        const el = optOutComp.getEl();
        const optOutText = (
          el ? el.innerText : optOutComp.get("content") || ""
        ).trim();
        if (optOutText) {
          fullText += (fullText ? "\n\n" : "") + optOutText;
        }
      }

      if (onContentChange) {
        onContentChange(fullText.trim());
      }
    };

    editor.on("component:update", updateContent);
    editor.on("rte:exec", updateContent);

    // Catch real-time typing inside the GrapesJS canvas
    editor.on("load", () => {
      updateContent();
      const wrapper = editor.getWrapper().find(".text-editor-content")[0];
      const el = wrapper?.getEl();
      if (el) {
        el.addEventListener("input", updateContent);
      }

      // Handle external drops (placeholders)
      const doc = editor.Canvas.getDocument();
      if (doc) {
        doc.addEventListener("dragover", (e) => {
          const isPlaceholder = e.dataTransfer.types.includes(
            "application/x-placeholder"
          );
          if (isPlaceholder) {
            e.preventDefault();
            const targetEl = doc.elementFromPoint(e.clientX, e.clientY);
            const isInsideContent =
              el && (el === targetEl || el.contains(targetEl));

            if (isInsideContent) {
              e.dataTransfer.dropEffect = "copy";
              // Show the caret at the current mouse position
              let range;
              if (doc.caretRangeFromPoint) {
                range = doc.caretRangeFromPoint(e.clientX, e.clientY);
              } else if (doc.caretPositionFromPoint) {
                const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
                range = doc.createRange();
                range.setStart(pos.offsetNode, pos.offset);
                range.collapse(true);
              }

              if (range) {
                const sel = doc.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              }
            } else {
              e.dataTransfer.dropEffect = "none";
              // Hide the caret if outside
              const sel = doc.getSelection();
              sel.removeAllRanges();
            }
          }
        });

        doc.addEventListener("drop", (e) => {
          const isPlaceholder = e.dataTransfer.getData(
            "application/x-placeholder"
          );
          if (isPlaceholder) {
            e.preventDefault();
            const targetEl = doc.elementFromPoint(e.clientX, e.clientY);
            const isInsideContent =
              el && (el === targetEl || el.contains(targetEl));

            if (isInsideContent) {
              const text = e.dataTransfer.getData("text/plain");

              // Ensure the editor is focused and the RTE is enabled on the content section
              if (wrapper) {
                editor.select(wrapper);
                editor.runCommand("rte:enable", { target: wrapper });

                // Small delay to ensure RTE is ready and won't override our manual selection
                setTimeout(() => {
                  // Find the drop position again inside the timeout to be safe
                  let range;
                  if (doc.caretRangeFromPoint) {
                    range = doc.caretRangeFromPoint(e.clientX, e.clientY);
                  } else if (doc.caretPositionFromPoint) {
                    const pos = doc.caretPositionFromPoint(
                      e.clientX,
                      e.clientY
                    );
                    range = doc.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                    range.collapse(true);
                  }

                  if (range) {
                    const sel = doc.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                  }

                  // Now insert the text at the correctly placed cursor
                  doc.execCommand("insertText", false, text);
                  updateContent();
                }, 20);
              }
            }
          }
        });
      }
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, [onContentChange]);

  return (
    <div className="BroadcastTextVoiceMessageEditor">
      <div className="editor-canvas" ref={containerRef}></div>
    </div>
  );
};

export default BroadcastTextVoiceMessageEditor;
