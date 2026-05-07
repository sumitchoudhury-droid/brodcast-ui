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
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        ]
      }
    });

    const rte = editor.RichTextEditor;

    // Custom Alignment Icons
    const alignLeftIcon = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 19h18v-2H3v2zM3 7V5h18v2H3zm0 6h10v-2H3v2zm0-4h18V7H3v2zm0 10h10v-2H3v2z"/></svg>`;
    const alignCenterIcon = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 19h18v-2H3v2zM7 7V5h10v2H7zm-4 6h18v-2H3v2zm4-4h10V7H7v2zm-4 10h18v-2H3v2z"/></svg>`;
    const alignRightIcon = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 19h18v-2H3v2zM3 7V5h18v2H3zm8 6h10v-2H11v2zm-8-4h18V7H3v2zm8 10h10v-2H11v2z"/></svg>`;

    rte.add("justifyLeft", {
      icon: alignLeftIcon,
      result: (rte) => rte.exec("justifyLeft")
    });
    rte.add("justifyCenter", {
      icon: alignCenterIcon,
      result: (rte) => rte.exec("justifyCenter")
    });
    rte.add("justifyRight", {
      icon: alignRightIcon,
      result: (rte) => rte.exec("justifyRight")
    });

    editor.on("load", () => {
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
        editor.select(comp);
      }
    });

    const updateContent = () => {
      const wrapper = editor.getWrapper();
      const contentComp = wrapper.find(".text-editor-content")[0];
      if (contentComp && onContentChange) {
        // Use the actual view content for real-time updates
        const el = contentComp.getEl();
        const text = el ? el.innerText : contentComp.get("content") || "";
        onContentChange(text.trim());
      }
    };

    editor.on("component:update", updateContent);
    editor.on("rte:exec", updateContent);

    // Catch real-time typing inside the GrapesJS canvas
    editor.on("load", () => {
      updateContent();
      const el = editor.getWrapper().find(".text-editor-content")[0]?.getEl();
      if (el) {
        el.addEventListener("input", updateContent);
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
