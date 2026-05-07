import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "./style.scss";

const BroadcastTextMessageEditor = ({ onContentChange }) => {
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
        ]
      }
    });

    const rte = editor.RichTextEditor;

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

    editor.on("load", () => {
      // Load initial content
      editor.setComponents(
        `<div class="text-editor-content" style="padding: 20px; font-family: Inter, sans-serif; font-size: 16px; min-height: 200px; outline: none; color: #181D25;">Type your message here...</div>`
      );

      const wrapper = editor.getWrapper();
      const comp = wrapper.find(".text-editor-content")[0];
      if (comp) {
        comp.set({
          editable: true,
          draggable: false,
          removable: false,
          copyable: false,
          selectable: true,
          hoverable: false,
          badgable: false
        });
        // Select the component to show the toolbar immediately if possible,
        // but GrapesJS RTE usually needs a double click or focus.
        editor.select(comp);
      }
    });

    // Handle content change
    editor.on("component:update", () => {
      if (onContentChange) {
        // Output final HTML content
        onContentChange(editor.getHtml());
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
    <div className="BroadcastTextMessageEditor">
      <div className="editor-canvas" ref={containerRef}></div>
    </div>
  );
};

export default BroadcastTextMessageEditor;
