import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "./style.scss";

const BroadcastTextMessageEditor = ({ onContentChange, onReady }) => {
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
      panels: { defaults: [] },
      blockManager: { blocks: [] },
      styleManager: { sectors: [] },
      layerManager: false,
      traitManager: false,
      deviceManager: false,
      selectorManager: false,
      showDevices: false,
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        ],
        css: `
          .text-editor-content {
            min-height: 40px !important;
            position: relative !important;
          }
          .text-editor-content:empty:before,
          .text-editor-content.is-empty:before {
            content: attr(data-placeholder) !important;
            color: #98A2B3 !important;
            pointer-events: none !important;
            display: block !important;
            font-style: normal !important;
            position: absolute !important;
            left: 0 !important;
            top: 10px !important;
            width: 100% !important;
            white-space: pre-wrap !important;
            z-index: 1 !important;
          }
          .unsubscribe-footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #EAECF0;
            color: #475467;
            font-size: 14px;
            font-family: Inter, sans-serif;
          }
        `
      }
    });

    const rte = editor.RichTextEditor;

    // Hide the RTE toolbar specifically for this instance
    editor.on("rte:enable", () => {
      setTimeout(() => {
        const rteToolbar = editor.RichTextEditor.getToolbarEl();
        if (rteToolbar) {
          rteToolbar.style.setProperty("display", "none", "important");
        }
      }, 0);
    });

    // Custom Alignment Icons (SVG)
    const alignLeftIcon = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 19h18v-2H3v2zM3 7V5h18v2H3zm0 6h10v-2H3v2zm0-4h18V7H3v2zm0 10h10v-2H3v2z"/></svg>`;
    const alignCenterIcon = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 19h18v-2H3v2zM7 7V5h10v2H7zm-4 6h18v-2H3v2zm4-4h10V7H7v2zm-4 10h18v-2H3v2z"/></svg>`;
    const alignRightIcon = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 19h18v-2H3v2zM3 7V5h18v2H3zm8 6h10v-2H11v2zm-8-4h18V7H3v2zm8 10h10v-2H11v2z"/></svg>`;
    const alignJustifyIcon = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 19h18v-2H3v2zM3 7V5h18v2H3zm0 6h18v-2H3v2zm0-4h18V7H3v2zm0 10h18v-2H3v2z"/></svg>`;

    // Add Alignment actions
    rte.add("justifyLeft", {
      icon: alignLeftIcon,
      attributes: { title: "Align Left" },
      result: (rte) => rte.exec("justifyLeft")
    });
    rte.add("justifyCenter", {
      icon: alignCenterIcon,
      attributes: { title: "Align Center" },
      result: (rte) => rte.exec("justifyCenter")
    });
    rte.add("justifyRight", {
      icon: alignRightIcon,
      attributes: { title: "Align Right" },
      result: (rte) => rte.exec("justifyRight")
    });
    rte.add("justifyFull", {
      icon: alignJustifyIcon,
      attributes: { title: "Justify" },
      result: (rte) => rte.exec("justifyFull")
    });

    // Add Font Size
    rte.add("fontSize", {
      icon: `<select class="gjs-rte-action" style="background:transparent; border:none; color:white; cursor:pointer; font-size: 12px; outline: none;">
              <option value="1">10px</option>
              <option value="2">13px</option>
              <option value="3" selected>16px</option>
              <option value="4">18px</option>
              <option value="5">24px</option>
              <option value="6">32px</option>
              <option value="7">48px</option>
            </select>`,
      event: "change",
      result: (rte, action) =>
        rte.exec("fontSize", action.btn.firstChild.value),
      update: (rte, action) => {
        const value = rte.doc.queryCommandValue("fontSize");
        if (value) action.btn.firstChild.value = value;
      }
    });

    // Handle content change
    const updateContent = () => {
      const wrapper = editor.getWrapper();
      const contentComp = wrapper.find(".text-editor-content")[0];
      if (contentComp) {
        const content = contentComp.getInnerHTML() || "";
        // Check if content is actually empty or just whitespace/placeholders
        const plainText = content
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
        const isEmpty = plainText.length === 0;

        // Toggle a class for the placeholder
        if (isEmpty) {
          contentComp.addClass("is-empty");
        } else {
          contentComp.removeClass("is-empty");
        }

        if (onContentChange) {
          // Output final HTML content and empty status
          onContentChange(editor.getHtml(), isEmpty);
        }
      }
    };

    editor.on("load", () => {
      // Load initial content
      editor.setComponents([
        {
          tagName: "div",
          classes: ["text-editor-container"],
          attributes: {
            style:
              "display: flex; flex-direction: column; box-sizing: border-box;"
          },
          components: [
            {
              tagName: "div",
              type: "text",
              classes: ["text-editor-content"],
              content: "",
              attributes: {
                "data-placeholder":
                  "Start typing or drag and drop a placeholder from left panel.",
                style:
                  "padding: 10px 0; font-family: Inter, sans-serif; font-size: 16px; outline: none; color: #181D25; min-height: 40px;"
              },
              editable: true,
              draggable: false,
              removable: false,
              copyable: false,
              selectable: true,
              hoverable: false,
              badgable: false
            },
            {
              tagName: "div",
              classes: ["unsubscribe-footer"],
              content: "Click here to unsubscribe:",
              attributes: {
                style:
                  "padding: 10px 0; color: #475467; font-size: 14px; border-top: 1px solid #EAECF0; font-family: Inter, sans-serif;"
              },
              editable: false,
              draggable: false,
              removable: false,
              copyable: false,
              selectable: false,
              hoverable: false,
              badgable: false
            }
          ]
        }
      ]);

      const wrapper = editor.getWrapper();
      const contentComp = wrapper.find(".text-editor-content")[0];

      if (contentComp) {
        editor.select(contentComp);
      }
      updateContent();

      // Handle external drops (placeholders)
      const doc = editor.Canvas.getDocument();
      if (doc) {
        doc.addEventListener("input", updateContent);
        doc.addEventListener(
          "dragover",
          (e) => {
            const isPlaceholder = e.dataTransfer.types.includes(
              "application/x-placeholder"
            );
            if (isPlaceholder) {
              e.preventDefault();
              e.stopPropagation();
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
            }
          },
          true
        );

        doc.addEventListener(
          "drop",
          (e) => {
            const isPlaceholder = e.dataTransfer.getData(
              "application/x-placeholder"
            );
            if (isPlaceholder) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();

              const text = e.dataTransfer.getData("text/plain");

              // Ensure the editor is focused and the RTE is enabled on the content section
              if (contentComp) {
                editor.select(contentComp);
                editor.runCommand("rte:enable", { target: contentComp });

                // Small delay to ensure RTE is ready
                setTimeout(() => {
                  const el = contentComp.getEl();
                  if (el) {
                    // Move cursor to the end of the content
                    const range = doc.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    const sel = doc.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);

                    // Add a space if the content is not empty and doesn't end with a space
                    const currentText = el.innerText || "";
                    const prefix =
                      currentText.length > 0 && !currentText.endsWith(" ")
                        ? " "
                        : "";

                    // Insert the text at the end
                    doc.execCommand("insertText", false, prefix + text);
                    updateContent();
                  }
                }, 20);
              }
            }
          },
          true
        );
      }
    });

    editor.on("component:update", updateContent);
    editor.on("rte:exec", updateContent);

    editorRef.current = editor;

    if (onReady) {
      onReady({
        editor,
        execCommand: (cmd, value) => {
          const wrapper = editor.getWrapper();
          const contentComp = wrapper.find(".text-editor-content")[0];
          if (contentComp) {
            editor.select(contentComp);
            editor.runCommand("rte:enable", { target: contentComp });
            setTimeout(() => {
              editor.RichTextEditor.exec(cmd, value);
              updateContent();
            }, 10);
          }
        }
      });
    }

    return () => {
      if (editorRef.current) {
        const doc = editorRef.current.Canvas.getDocument();
        if (doc) {
          doc.removeEventListener("input", updateContent);
        }
        editorRef.current.destroy();
      }
    };
  }, [onContentChange, onReady]);

  return (
    <div className="BroadcastTextMessageEditor">
      <div className="editor-canvas" ref={containerRef}></div>
    </div>
  );
};

export default BroadcastTextMessageEditor;
