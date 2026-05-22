import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "./style.scss";

import underlineIcon from "../../../../../assets/textStyleIcons/underlineIcon.svg";
import italicIcon from "../../../../../assets/textStyleIcons/italicIcon.svg";
import strikethroughIcon from "../../../../../assets/textStyleIcons/strikethroughIcon.svg";
import highlightIcon from "../../../../../assets/textStyleIcons/highlightIcon.svg";
import codeIcon from "../../../../../assets/textStyleIcons/codeIcon.svg";
import subscriptIcon from "../../../../../assets/textStyleIcons/subscriptIcon.svg";
import superscriptIcon from "../../../../../assets/textStyleIcons/superscriptIcon.svg";
import linkIcon from "../../../../../assets/commonIcons/externalLinkIcon.svg";
import ReusableLinkModal from "../../../../../reusableComponents/reusableLinkModal/index";

const BroadcastTextMessageEditor = ({
  onContentChange,
  onReady,
  initialTemplate
}) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  // Link Modal state for toolbar Link icon
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState("");
  const [linkModalUrl, setLinkModalUrl] = useState("");
  const currentCompRef = useRef(null);
  const currentRteContentRef = useRef(null);

  // Popup state for interacting with existing links
  const [linkPopupData, setLinkPopupData] = useState({
    isOpen: false,
    top: 0,
    left: 0,
    text: "",
    url: "",
    el: null,
    isBelow: false
  });

  // Use a ref to access latest popup state inside event listeners without re-running useEffect
  const linkPopupDataRef = useRef(linkPopupData);
  useEffect(() => {
    linkPopupDataRef.current = linkPopupData;
  }, [linkPopupData]);

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
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap"
        ],
        css: `
          .text-editor-content {
            min-height: 40px !important;
            position: relative !important;
          }
          .text-editor-content:empty::before,
          .text-editor-content.is-empty::before,
          [data-placeholder]:empty::before,
          [data-placeholder].is-empty::before {
            content: "Start typing or drag and drop a placeholder from left panel." !important;
            color: #98A2B3 !important;
            pointer-events: none !important;
            display: block !important;
            font-style: normal !important;
            position: absolute !important;
            left: 0 !important;
            top: 10px !important;
            width: 100% !important;
            white-space: pre-wrap !important;
            z-index: 10 !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          .text-editor-content ul,
          .text-editor-content ol {
            padding-left: 0 !important;
            margin: 4px 0 !important;
            list-style-position: inside !important;
          }
          .text-editor-content li,
          .text-editor-content li[data-gjs-type] {
            display: list-item !important;
            padding-left: 0 !important;
          }
          .unsubscribe-footer {
            margin-top: 20px !important;
            padding-top: 10px !important;
            color: #475467 !important;
            font-size: 14px !important;
            font-family: Inter, sans-serif !important;
            display: block !important;
          }
        `
      }
    });
    editorRef.current = editor;

    // Track which bodies have listeners
    const attachedBodies = new WeakSet();

    // Persist the last known cursor range so click-to-insert can restore it
    const savedRange = { current: null };
    // Track the last component that had RTE active (needed for template structures)
    let lastRteComp = null;

    // Clone the container and stamp list styles inline so they appear in HTML output
    const serializeContainer = (containerEl) => {
      if (!containerEl) return null;
      const clone = containerEl.cloneNode(true);
      clone.querySelectorAll("ul, ol").forEach((list) => {
        list.style.listStylePosition = "inside";
        list.style.paddingLeft = "0";
      });
      return clone.outerHTML;
    };

    // Handle content change
    const updateContent = () => {
      const wrapper = editor.getWrapper();
      if (!wrapper) return;
      // Search by class or data-placeholder attribute to be safe
      const contentComp =
        wrapper.find(".text-editor-content")[0] ||
        wrapper.find("[data-placeholder]")[0];

      if (contentComp) {
        const el = contentComp.getEl();
        // Use DOM innerHTML for most up-to-date content during editing
        const content = el ? el.innerHTML : contentComp.getInnerHTML() || "";

        const sigComp = wrapper.find(".text-signature-section")[0];
        const hasSignature = !!sigComp;
        const formComp = wrapper.find(".text-form-section")[0];
        const hasForm = !!formComp;

        // Check if content is actually empty or just whitespace/placeholders/BRs
        const plainText = content
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/\u200B/g, "") // Zero-width space
          .trim();
        const isEmpty = plainText.length === 0 && !hasSignature && !hasForm;

        // Toggle a class for the placeholder via DOM only — model-level addClass/removeClass
        // triggers a GrapesJS re-render that resets the cursor position mid-typing
        const applyEmptyClass = (target, empty) => {
          if (!target) return;
          if (empty) target.classList.add("is-empty");
          else target.classList.remove("is-empty");
        };
        applyEmptyClass(el, isEmpty);
        // Re-apply after GrapesJS may have re-rendered the component in this tick
        setTimeout(() => applyEmptyClass(contentComp.getEl(), isEmpty), 0);

        if (onContentChange) {
          const containerEl = el?.closest(".text-editor-container");
          onContentChange(
            serializeContainer(containerEl) ?? editor.getHtml(),
            isEmpty
          );
        }
      } else {
        // Saved template: no .text-editor-content — check canvas for any text content
        if (onContentChange) {
          const html = editor.getHtml();
          const plainText = html
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();
          onContentChange(html, plainText.length === 0);
        }
      }
    };

    editor.on("load", () => {
      // Inject placeholder CSS after GrapesJS's own canvas CSS so it wins
      const canvasDoc = editor.Canvas.getDocument();
      if (canvasDoc?.head) {
        const style = canvasDoc.createElement("style");
        style.textContent = `
          .text-editor-content { position: relative !important; }
          .text-editor-content.is-empty::before {
            content: attr(data-placeholder);
            color: #98A2B3;
            pointer-events: none;
            display: block;
            position: absolute;
            left: 0;
            top: 10px;
            width: 100%;
            white-space: pre-wrap;
            z-index: 10;
          }
        `;
        canvasDoc.head.appendChild(style);
      }

      const body = editor.Canvas.getBody();
      if (!attachedBodies.has(body)) {
        attachedBodies.add(body);
        // Link click handler
        body.addEventListener("mousedown", (e) => {
          const link = e.target.closest("a");
          if (link) {
            e.preventDefault();
            e.stopPropagation();

            // Close if already open on same element
            if (
              linkPopupDataRef.current.isOpen &&
              linkPopupDataRef.current.el === link
            ) {
              setLinkPopupData((prev) => ({ ...prev, isOpen: false }));
              return;
            }

            const rect = link.getBoundingClientRect();
            const iframe = editor.Canvas.getFrameEl();
            const iframeRect = iframe.getBoundingClientRect();

            const showBelow = rect.top < 150;

            setLinkPopupData({
              isOpen: true,
              top: showBelow
                ? iframeRect.top + rect.bottom + 12
                : iframeRect.top + rect.top - 12,
              left: iframeRect.left + rect.left + rect.width / 2,
              text: link.textContent,
              url: link.getAttribute("href") || "",
              el: link,
              isBelow: showBelow
            });
          } else {
            if (e.target.closest(".link-interaction-popup")) return;
            setLinkPopupData((prev) =>
              prev.isOpen ? { ...prev, isOpen: false, el: null } : prev
            );
          }
        });
      }

      const componentsList = [
        {
          tagName: "div",
          attributes: {
            class: "text-editor-container",
            style:
              "display: flex; flex-direction: column; box-sizing: border-box;"
          },
          components: [
            {
              tagName: "div",
              type: "text",
              attributes: {
                class: "text-editor-content",
                "data-placeholder":
                  "Start typing or drag and drop a placeholder from left panel.",
                style:
                  "padding: 10px 0; font-family: Inter, sans-serif; font-size: 16px; outline: none; color: #181D25; min-height: 40px;"
              },
              content: "",
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
              attributes: {
                class: "unsubscribe-footer",
                style:
                  "padding: 10px 0; color: #475467; font-size: 14px;  font-family: Inter, sans-serif;"
              },
              content: `Click here to unsubscribe: <a href="https://mh.care/stop" target="_blank" style="color: #1570EF; text-decoration: underline;">https://mh.care/stop</a>`,
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
      ];

      editor.setComponents(initialTemplate || componentsList);

      const wrapper = editor.getWrapper();
      const contentComp = wrapper.find(".text-editor-content")[0];

      if (contentComp) {
        editor.select(contentComp);
      } else {
        // Saved template: seed lastRteComp so execCommand has a default target
        lastRteComp = wrapper.find("[data-gjs-type='text']")[0] || null;
      }
      setTimeout(updateContent, 100);
      updateContent();

      // Handle external drops (placeholders)
      const doc = editor.Canvas.getDocument();
      const win = editor.Canvas.getWindow();
      if (doc) {
        doc.addEventListener("input", updateContent);

        // Save selection whenever it changes so click-to-insert can restore it
        doc.addEventListener("selectionchange", () => {
          const activeEl = doc?.activeElement;
          if (
            activeEl &&
            (activeEl.classList.contains("text-editor-content") ||
              activeEl.getAttribute("contenteditable") === "true")
          ) {
            const sel = win?.getSelection();
            if (sel && sel.rangeCount > 0) {
              savedRange.current = sel.getRangeAt(0).cloneRange();
            }
          }
        });
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

    const rte = editor.RichTextEditor;

    // Remove default actions to replace with custom ones
    rte.remove("bold");
    rte.remove("italic");
    rte.remove("underline");
    rte.remove("strikethrough");
    rte.remove("link");

    const customBoldIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 3H9C10.6569 3 12 4.34315 12 6C12 7.65685 10.6569 9 9 9H4.5V3Z" stroke="#606E80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4.5 9H10.5C12.1569 9 13.5 10.3431 13.5 12C13.5 13.6569 12.1569 15 10.5 15H4.5V9Z" stroke="#606E80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

    rte.add("bold", {
      icon: customBoldIcon,
      attributes: { title: "Bold" },
      result: (rteInstance) => rteInstance.exec("bold")
    });

    rte.add("italic", {
      icon: `<img src="${italicIcon}" width="18" height="18" />`,
      attributes: { title: "Italic" },
      result: (rteInstance) => rteInstance.exec("italic")
    });

    rte.add("underline", {
      icon: `<img src="${underlineIcon}" width="18" height="18" />`,
      attributes: { title: "Underline" },
      result: (rteInstance) => rteInstance.exec("underline")
    });

    rte.add("strikethrough", {
      icon: `<img src="${strikethroughIcon}" width="18" height="18" />`,
      attributes: { title: "Strikethrough" },
      result: (rteInstance) => rteInstance.exec("strikethrough")
    });

    rte.add("superscript", {
      icon: `<img src="${superscriptIcon}" width="18" height="18" />`,
      attributes: { title: "Superscript" },
      result: (rteInstance) => rteInstance.exec("superscript")
    });

    rte.add("subscript", {
      icon: `<img src="${subscriptIcon}" width="18" height="18" />`,
      attributes: { title: "Subscript" },
      result: (rteInstance) => rteInstance.exec("subscript")
    });

    rte.add("highlight", {
      icon: `<img src="${highlightIcon}" width="18" height="18" />`,
      attributes: { title: "Highlight" },
      result: (rteInstance) => {
        const selection = rteInstance.selection();
        if (selection) {
          rteInstance.insertHTML(
            `<span style="background-color: yellow; color: black;">${selection}</span>`
          );
        }
      }
    });

    rte.add("code", {
      icon: `<img src="${codeIcon}" width="18" height="18" />`,
      attributes: { title: "Code Block" },
      result: (rteInstance) => {
        const selection = rteInstance.selection();
        if (selection) {
          rteInstance.insertHTML(
            `<code style="background-color: #f4f4f4; color: #d63384; padding: 2px 4px; border-radius: 4px; font-family: monospace;">${selection}</code>`
          );
        } else {
          rteInstance.insertHTML(
            `<code style="background-color: #f4f4f4; color: #d63384; padding: 2px 4px; border-radius: 4px; font-family: monospace;">&nbsp;</code>`
          );
        }
      }
    });

    rte.add("link", {
      icon: `<img src="${linkIcon}" width="18" height="18" />`,
      attributes: { title: "Link" },
      result: (rteInstance) => {
        const selection = rteInstance.selection();

        const doc = rteInstance.el.ownerDocument;
        const win = doc.defaultView;
        const sel = win.getSelection();

        let plainText = "";
        if (selection) {
          plainText =
            typeof selection === "string"
              ? selection.replace(/<[^>]*>/g, "")
              : selection.toString
                ? selection.toString()
                : "";
        }

        const PLACEHOLDER_URL = "__GJS_LINK_PLACEHOLDER__";
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (range.collapsed) {
            const placeholder = doc.createElement("a");
            placeholder.href = PLACEHOLDER_URL;
            placeholder.textContent = "\u200B"; // Zero-width space
            placeholder.style.color = "#1570EF";
            placeholder.style.textDecoration = "underline";
            range.insertNode(placeholder);
            range.selectNodeContents(placeholder);
            sel.removeAllRanges();
            sel.addRange(range);
          } else {
            doc.execCommand("createLink", false, PLACEHOLDER_URL);
          }
        }

        const selectedComp = editor.getSelected();
        currentCompRef.current = selectedComp;
        currentRteContentRef.current = rteInstance.el.innerHTML;

        setLinkModalText(plainText);
        setLinkModalUrl("");
        setIsLinkModalOpen(true);
      }
    });

    // Ensure the RTE toolbar is visible when enabled; also track which component is active
    editor.on("rte:enable", () => {
      lastRteComp = editor.getSelected() || lastRteComp;
      const rteToolbar = editor.RichTextEditor.getToolbarEl();
      if (rteToolbar) {
        rteToolbar.style.setProperty("display", "flex", "important");
      }
    });

    editor.on("component:update", updateContent);
    editor.on("rte:exec", updateContent);
    editor.on("update", updateContent);

    if (onReady) {
      onReady({
        editor,
        getHtml: () => {
          const wrapper = editor.getWrapper();
          const contentComp = wrapper?.find(".text-editor-content")[0];
          const el = contentComp?.getEl();
          const containerEl = el?.closest(".text-editor-container");
          if (containerEl) return serializeContainer(containerEl);

          // Saved template: read from the live canvas DOM so that all style
          // changes applied via el.style.xxx are captured in the output
          const canvasDoc = editor.Canvas.getDocument();
          if (canvasDoc?.body) {
            const clone = canvasDoc.body.cloneNode(true);
            clone.querySelectorAll("*").forEach((node) => {
              node.removeAttribute("data-gjs-highlightable");
              node.removeAttribute("data-gjs-type");
              node.removeAttribute("draggable");
              node.removeAttribute("contenteditable");
              [
                "gjs-selected",
                "gjs-hovered",
                "gjs-editable",
                "is-empty"
              ].forEach((cls) => node.classList.remove(cls));
              if (node.getAttribute("class") === "")
                node.removeAttribute("class");
            });
            return clone.innerHTML;
          }

          return editor.getHtml();
        },
        setDevice: (device) => editor.setDevice(device),
        insertAtCursor: (text) => {
          const wrapper = editor.getWrapper();
          const doc = editor.Canvas.getDocument();
          const canvasWin = editor.Canvas.getWindow();
          if (!doc || !canvasWin) return;

          // Snapshot saved range BEFORE any focus change triggers selectionchange
          const rangeSnapshot = savedRange.current;

          // Blank template uses .text-editor-content; saved templates use lastRteComp
          const defaultComp = wrapper.find(".text-editor-content")[0];
          const isTemplate = !defaultComp;

          let targetEl = null;
          let rangeToUse = null;

          if (defaultComp) {
            targetEl = defaultComp.getEl();
            if (!targetEl) return;
            if (
              rangeSnapshot &&
              targetEl.contains(rangeSnapshot.commonAncestorContainer)
            ) {
              rangeToUse = rangeSnapshot;
            } else {
              const r = doc.createRange();
              r.selectNodeContents(targetEl);
              r.collapse(false);
              rangeToUse = r;
            }
          } else {
            const fallbackComp =
              lastRteComp || wrapper.find("[data-gjs-type='text']")[0];
            if (!fallbackComp) return;
            targetEl = fallbackComp.getEl();
            if (!targetEl) return;
            if (
              rangeSnapshot &&
              targetEl.contains(rangeSnapshot.commonAncestorContainer)
            ) {
              rangeToUse = rangeSnapshot;
            } else {
              const r = doc.createRange();
              r.selectNodeContents(targetEl);
              r.collapse(false);
              rangeToUse = r;
            }
          }

          if (!rangeToUse) return;

          // Force the element editable so execCommand works regardless of GrapesJS state
          const prevEditable = targetEl.contentEditable;
          targetEl.contentEditable = "true";
          targetEl.focus();

          try {
            const sel = canvasWin.getSelection();
            sel.removeAllRanges();
            sel.addRange(rangeToUse);
          } catch {
            // stale range — cursor stays wherever browser placed it on focus
          }

          const charBeforeCursor = (() => {
            try {
              const sel = canvasWin.getSelection();
              if (!sel?.rangeCount) return "";
              const r = sel.getRangeAt(0).cloneRange();
              r.collapse(true);
              if (r.startOffset === 0) return "";
              r.setStart(r.startContainer, r.startOffset - 1);
              return r.toString();
            } catch {
              return "";
            }
          })();

          const prefix =
            targetEl.innerText?.trim().length > 0 && charBeforeCursor !== " "
              ? " "
              : "";

          doc.execCommand("insertText", false, prefix + text);

          if (!isTemplate) {
            // Blank template: getHtml() reads from DOM — nothing more needed
            targetEl.contentEditable = prevEditable;
            updateContent();
            return;
          }

          // Saved template: getHtml() reads from GrapesJS model, so sync DOM → model
          const updatedHtml = targetEl.innerHTML;
          targetEl.contentEditable = prevEditable;

          // Find the GrapesJS component that owns targetEl by walking up via GJS IDs
          const findOwnerComp = (el) => {
            let cur = el;
            while (cur && cur !== doc.body) {
              const id = cur.getAttribute?.("id");
              if (id) {
                const found = wrapper.find("#" + id);
                if (found.length) return found[0];
              }
              cur = cur.parentElement;
            }
            return lastRteComp || null;
          };

          const ownerComp = findOwnerComp(targetEl);
          if (ownerComp) {
            ownerComp.components().reset();
            ownerComp.set("content", updatedHtml);
            const view = ownerComp.getView?.();
            if (view && typeof view.render === "function") {
              view.render();
            } else {
              editor.trigger("component:update", ownerComp);
            }
            savedRange.current = null; // DOM re-render invalidates the saved range
          }

          updateContent();
        },
        insertHtmlAtCursor: (html) => {
          const wrapper = editor.getWrapper();
          const doc = editor.Canvas.getDocument();
          const canvasWin = editor.Canvas.getWindow();
          if (!doc || !canvasWin) return;

          const rangeSnapshot = savedRange.current;
          const defaultComp = wrapper.find(".text-editor-content")[0];

          let targetEl = null;
          let rangeToUse = null;

          if (defaultComp) {
            targetEl = defaultComp.getEl();
            if (!targetEl) return;
            if (
              rangeSnapshot &&
              targetEl.contains(rangeSnapshot.commonAncestorContainer)
            ) {
              rangeToUse = rangeSnapshot;
            } else {
              const r = doc.createRange();
              r.selectNodeContents(targetEl);
              r.collapse(false);
              rangeToUse = r;
            }
          } else {
            const fallbackComp =
              lastRteComp || wrapper.find("[data-gjs-type='text']")[0];
            if (!fallbackComp) return;
            targetEl = fallbackComp.getEl();
            if (!targetEl) return;
            if (
              rangeSnapshot &&
              targetEl.contains(rangeSnapshot.commonAncestorContainer)
            ) {
              rangeToUse = rangeSnapshot;
            } else {
              const r = doc.createRange();
              r.selectNodeContents(targetEl);
              r.collapse(false);
              rangeToUse = r;
            }
          }

          if (!targetEl) return;

          // Parse HTML to a DocumentFragment
          const tempDiv = doc.createElement("div");
          tempDiv.innerHTML = html;
          const fragment = doc.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }

          const hasContent = targetEl.innerText?.trim().length > 0;
          if (hasContent) {
            const br = doc.createElement("br");
            if (rangeToUse) {
              // insertNode inserts at start of range, so insert fragment first, then br before it
              rangeToUse.insertNode(fragment);
              rangeToUse.insertNode(br);
            } else {
              targetEl.appendChild(br);
              targetEl.appendChild(fragment);
            }
          } else {
            if (rangeToUse) {
              rangeToUse.insertNode(fragment);
            } else {
              targetEl.appendChild(fragment);
            }
          }

          const updatedHtml = targetEl.innerHTML;
          const findOwnerComp = (el) => {
            let cur = el;
            while (cur && cur !== doc.body) {
              const id = cur.getAttribute?.("id");
              if (id) {
                const found = wrapper.find("#" + id);
                if (found.length) return found[0];
              }
              cur = cur.parentElement;
            }
            return lastRteComp || defaultComp || null;
          };

          const ownerComp = findOwnerComp(targetEl);
          if (ownerComp) {
            ownerComp.components().reset();
            ownerComp.set("content", updatedHtml);
            const view = ownerComp.getView?.();
            if (view && typeof view.render === "function") {
              view.render();
            } else {
              editor.trigger("component:update", ownerComp);
            }
            savedRange.current = null;
          }

          updateContent();
        },
        insertSignature: (selectedValue) => {
          const wrapper = editor.getWrapper();
          const doc = editor.Canvas.getDocument();
          const canvasWin = editor.Canvas.getWindow();
          if (!doc || !canvasWin) return;

          const defaultComp = wrapper.find(".text-editor-content")[0];
          const containerComp = wrapper.find(".text-editor-container")[0];
          const sigComp = wrapper.find(".text-signature-section")[0];

          // Legacy inline signature cleanup
          let targetEl = defaultComp ? defaultComp.getEl() : null;
          if (!targetEl) {
            const fallbackComp =
              lastRteComp || wrapper.find("[data-gjs-type='text']")[0];
            if (fallbackComp) targetEl = fallbackComp.getEl();
          }
          if (targetEl) {
            const legacySig = targetEl.querySelector(".text-signature");
            if (legacySig) {
              const prevSib = legacySig.previousSibling;
              if (prevSib && prevSib.nodeName === "BR") {
                prevSib.remove();
              }
              legacySig.remove();
            }
          }

          if (sigComp) {
            if (!selectedValue) {
              sigComp.remove();
            } else {
              sigComp.set("content", selectedValue);
              const view = sigComp.getView?.();
              if (view && typeof view.render === "function") {
                view.render();
              }
            }
          } else {
            if (selectedValue) {
              const newCompData = {
                tagName: "div",
                type: "text",
                attributes: {
                  class: "text-signature-section",
                  style:
                    "padding: 10px 0; font-family: Inter, sans-serif; font-size: 16px; outline: none; color: #181D25;"
                },
                content: selectedValue,
                editable: true,
                draggable: false,
                removable: true,
                copyable: false,
                selectable: true,
                hoverable: false,
                badgable: false
              };

              if (containerComp) {
                const children = containerComp.components();
                let insertIdx = children.length;
                for (let i = 0; i < children.length; i++) {
                  const classes =
                    children.models[i].getAttributes()?.class || "";
                  if (classes.includes("unsubscribe-footer")) {
                    insertIdx = i;
                    break;
                  }
                }
                containerComp.components().add(newCompData, { at: insertIdx });
              } else {
                wrapper.append(newCompData);
              }
            }
          }

          updateContent();
        },
        insertFormLink: (text, url) => {
          const wrapper = editor.getWrapper();
          const doc = editor.Canvas.getDocument();
          const canvasWin = editor.Canvas.getWindow();
          if (!doc || !canvasWin) return;

          const containerComp = wrapper.find(".text-editor-container")[0];
          const formComp = wrapper.find(".text-form-section")[0];

          const linkHtml = `<a href="${url}" target="_blank" style="color: #1570EF; text-decoration: underline; font-family: Inter, sans-serif; font-size: 16px;">${text}</a>`;

          if (formComp) {
            if (!url) {
              formComp.remove();
            } else {
              formComp.set("content", linkHtml);
              const view = formComp.getView?.();
              if (view && typeof view.render === "function") {
                view.render();
              }
            }
          } else {
            if (url) {
              const newCompData = {
                tagName: "div",
                type: "text",
                attributes: {
                  class: "text-form-section",
                  style:
                    "padding: 10px 0; font-family: Inter, sans-serif; font-size: 16px; outline: none; color: #181D25;"
                },
                content: linkHtml,
                editable: true,
                draggable: false,
                removable: true,
                copyable: false,
                selectable: true,
                hoverable: false,
                badgable: false
              };

              if (containerComp) {
                const children = containerComp.components();
                let insertIdx = children.length;
                for (let i = 0; i < children.length; i++) {
                  const classes =
                    children.models[i].getAttributes()?.class || "";
                  if (
                    classes.includes("text-signature-section") ||
                    classes.includes("unsubscribe-footer")
                  ) {
                    insertIdx = i;
                    break;
                  }
                }
                containerComp.components().add(newCompData, { at: insertIdx });
              } else {
                wrapper.append(newCompData);
              }
            }
          }

          updateContent();
        },
        loadTemplate: (templateString) => {
          editor.setComponents(templateString);
          updateContent();
        },
        execCommand: (cmd, value) => {
          const wrapper = editor.getWrapper();
          // Resolve the active component: blank template uses .text-editor-content,
          // saved templates use whichever component the user last edited
          const activeComp =
            wrapper.find(".text-editor-content")[0] || lastRteComp;
          if (!activeComp) return;

          const el = activeComp.getEl();

          if (cmd === "fontName") {
            if (el) el.style.fontFamily = value;
            activeComp.addStyle({ "font-family": value });
            updateContent();
            return;
          }

          if (cmd === "fontWeight") {
            if (el) el.style.fontWeight = value;
            activeComp.addStyle({ "font-weight": value });
            updateContent();
            return;
          }

          if (cmd === "fontSize") {
            const px = `${value}px`;
            if (el && value) el.style.fontSize = px;
            activeComp.addStyle({ "font-size": px });
            updateContent();
            return;
          }

          if (cmd === "foreColor") {
            if (el && value) el.style.color = value;
            activeComp.addStyle({ color: value });
            updateContent();
            return;
          }

          if (
            [
              "justifyLeft",
              "justifyCenter",
              "justifyRight",
              "justifyFull"
            ].includes(cmd)
          ) {
            const alignMap = {
              justifyLeft: "left",
              justifyCenter: "center",
              justifyRight: "right",
              justifyFull: "justify"
            };
            const alignValue = alignMap[cmd];
            if (el) {
              el.style.textAlign = alignValue;
              el.querySelectorAll("ul, ol").forEach((list) => {
                list.style.listStylePosition = "inside";
                list.style.paddingLeft = "0";
              });
            }
            activeComp.addStyle({ "text-align": alignValue });
            updateContent();
            return;
          }

          if (cmd === "uppercase") {
            const newTransform =
              el?.style.textTransform === "uppercase" ? "none" : "uppercase";
            if (el) el.style.textTransform = newTransform;
            activeComp.addStyle({ "text-transform": newTransform });
            updateContent();
            return;
          }

          if (["italic", "bold", "underline", "strikethrough"].includes(cmd)) {
            const doc = editor.Canvas.getDocument();
            const canvasWin = editor.Canvas.getWindow();

            // If the user had a non-collapsed text selection saved, re-enable
            // the RTE and apply inline formatting to that selection only.
            const savedSel = savedRange.current;
            const hasTextSelection = savedSel && !savedSel.collapsed;

            if (hasTextSelection && doc) {
              if (editor.getSelected() !== activeComp)
                editor.select(activeComp);
              editor.runCommand("rte:enable", { target: activeComp });

              const nativeMap = {
                italic: "italic",
                bold: "bold",
                underline: "underline",
                strikethrough: "strikeThrough"
              };

              setTimeout(() => {
                const freshEl = activeComp.getEl();
                if (freshEl && canvasWin) {
                  freshEl.focus();
                  try {
                    const sel = canvasWin.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(savedSel);
                  } catch {
                    //
                  }
                }
                doc.execCommand(nativeMap[cmd], false, null);
                updateContent();
              }, 10);
              return;
            }

            // No text selection – apply as an element-level style so it works
            // even when the RTE / canvas is not focused.
            if (!el) return;

            if (cmd === "italic") {
              const next =
                el.style.fontStyle === "italic" ? "normal" : "italic";
              el.style.fontStyle = next;
              activeComp.addStyle({ "font-style": next });
            } else if (cmd === "bold") {
              const w = el.style.fontWeight;
              const next = w === "bold" || w === "700" ? "400" : "bold";
              el.style.fontWeight = next;
              activeComp.addStyle({ "font-weight": next });
            } else {
              // underline / strikethrough share text-decoration
              const token = cmd === "underline" ? "underline" : "line-through";
              const cur = el.style.textDecoration || "";
              const next = cur.includes(token)
                ? cur.replace(token, "").trim().replace(/\s+/g, " ") || "none"
                : cur && cur !== "none"
                  ? `${cur} ${token}`
                  : token;
              el.style.textDecoration = next;
              activeComp.addStyle({ "text-decoration": next });
            }
            updateContent();
            return;
          }

          if (cmd === "insertUnorderedList" || cmd === "insertOrderedList") {
            // Defer past GrapesJS's own deactivation/re-render cycle so we
            // read and write the DOM after it finishes settling.
            setTimeout(() => {
              const freshEl = activeComp.getEl();
              if (!freshEl) return;

              const tag = cmd === "insertUnorderedList" ? "ul" : "ol";
              const listStyle =
                "list-style-position:inside;padding-left:20px;margin:4px 0;";
              const currentHtml = freshEl.innerHTML;
              const alreadyHasList = new RegExp(`<${tag}[\\s>]`, "i").test(
                currentHtml
              );

              let newHtml;
              if (alreadyHasList) {
                const tmp = document.createElement("div");
                tmp.innerHTML = currentHtml;
                const items = Array.from(tmp.querySelectorAll(`${tag} > li`));
                newHtml =
                  items.map((li) => li.innerHTML).join("<br>") || "&nbsp;";
              } else {
                const lines = currentHtml
                  .split(/<br\s*\/?>/i)
                  .map((l) => l.trim())
                  .filter((l) => l && l.replace(/&nbsp;/g, "").trim() !== "");
                const items = (lines.length > 0 ? lines : ["&nbsp;"])
                  .map((l) => `<li>${l}</li>`)
                  .join("");
                newHtml = `<${tag} style="${listStyle}">${items}</${tag}>`;
              }

              freshEl.innerHTML = newHtml;
              updateContent();
            }, 0);
            return;
          }

          // Fallback: focus canvas window and drive via RTE
          const win = editor.Canvas.getWindow();
          if (win) win.focus();
          if (editor.getSelected() !== activeComp) {
            editor.select(activeComp);
          }
          editor.runCommand("rte:enable", { target: activeComp });
          setTimeout(() => {
            editor.RichTextEditor.exec(cmd, value);
            updateContent();
          }, 10);
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
  }, [onContentChange, onReady, initialTemplate]);

  const handleToolbarLinkConfirm = () => {
    let url = linkModalUrl;
    if (
      url &&
      !url.includes("://") &&
      !url.startsWith("#") &&
      !url.startsWith("/") &&
      !url.startsWith("mailto:") &&
      !url.startsWith("tel:")
    ) {
      url = "https://" + url;
    }

    const editor = editorRef.current;
    const PLACEHOLDER_URL = "__GJS_LINK_PLACEHOLDER__";

    if (editor) {
      const comp = currentCompRef.current;
      if (comp) {
        const getCompHtml = (c) =>
          c.components().length > 0 ? c.getInnerHTML() : c.get("content") || "";
        const baseContent = currentRteContentRef.current || getCompHtml(comp);
        const finalUrl = url || "#";
        const linkText = linkModalText || "Link";

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = baseContent;

        const placeholderLink =
          tempDiv.querySelector(`a[href="${PLACEHOLDER_URL}"]`) ||
          tempDiv.querySelector(`a[href='${PLACEHOLDER_URL}']`);
        if (placeholderLink) {
          placeholderLink.href = finalUrl;
          placeholderLink.target = "_blank";
          placeholderLink.style.color = "#1570EF";
          placeholderLink.style.textDecoration = "underline";
          placeholderLink.textContent = linkText;
        }

        const newContent = tempDiv.innerHTML;
        comp.components().reset();
        comp.set("content", newContent);

        const view = comp.getView?.();
        if (view && typeof view.render === "function") {
          view.render();
        } else {
          editor.trigger("component:update", comp);
        }
      }
    }

    currentCompRef.current = null;
    currentRteContentRef.current = null;
    setIsLinkModalOpen(false);
    setLinkModalText("");
    setLinkModalUrl("");
  };

  const handleRemoveLink = () => {
    const link = linkPopupData.el;
    const editor = editorRef.current;

    if (link && editor) {
      // Find the component containing the link
      const comp = editor.Components.getWrapper()
        .find("*")
        .filter((c) => {
          try {
            return c.getView()?.el?.contains(link);
          } catch {
            return false;
          }
        })
        .pop();

      if (comp) {
        const getCompHtml = (c) =>
          c.components().length > 0 ? c.getInnerHTML() : c.get("content") || "";
        const currentContent = getCompHtml(comp);

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = currentContent;

        const href = link.getAttribute("href");
        const text = link.textContent.trim();

        const matchingLink = Array.from(tempDiv.querySelectorAll("a")).find(
          (a) =>
            a.getAttribute("href") === href && a.textContent.trim() === text
        );

        if (matchingLink) {
          const textNode = document.createTextNode(matchingLink.textContent);
          matchingLink.replaceWith(textNode);
          const newContent = tempDiv.innerHTML;
          comp.components().reset();
          comp.set("content", newContent);

          const view = comp.getView?.();
          if (view && typeof view.render === "function") {
            view.render();
          } else {
            editor.trigger("component:update", comp);
          }
        }
      }
    }
    setLinkPopupData((prev) => ({ ...prev, isOpen: false, el: null }));
  };

  return (
    <div className="BroadcastTextMessageEditor">
      <div className="editor-canvas" ref={containerRef}></div>
      <ReusableLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onConfirm={handleToolbarLinkConfirm}
        formName={linkModalText}
        setFormName={setLinkModalText}
        linkValue={linkModalUrl}
        setLinkValue={setLinkModalUrl}
      />

      {linkPopupData.isOpen &&
        ReactDOM.createPortal(
          <div
            className={`link-interaction-popup ${
              linkPopupData.isBelow ? "is-below" : ""
            }`}
            style={{
              top: linkPopupData.top,
              left: linkPopupData.left,
              position: "fixed",
              transform: linkPopupData.isBelow
                ? "translateX(-50%)"
                : "translateX(-50%) translateY(-100%)",
              zIndex: 999999,
              pointerEvents: "auto"
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="popup-content">
              <div className="popup-header">
                <span className="link-text">{linkPopupData.text}</span>
                <button
                  className="close-popup"
                  onClick={() =>
                    setLinkPopupData({ ...linkPopupData, isOpen: false })
                  }
                >
                  <svg width="20" height="20" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M9 3L3 9M3 3L9 9"
                      stroke="#667085"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="popup-body">
                <a
                  href={linkPopupData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="link-url"
                >
                  {linkPopupData.url}
                </a>
              </div>
              <div className="popup-footer">
                <button
                  className="edit-btn"
                  onClick={() => {
                    setLinkModalText(linkPopupData.text);
                    setLinkModalUrl(linkPopupData.url);
                    setIsLinkModalOpen(true);
                    setLinkPopupData({ ...linkPopupData, isOpen: false });
                  }}
                >
                  Edit
                </button>
                <button className="remove-btn" onClick={handleRemoveLink}>
                  Remove
                </button>
              </div>
            </div>
            <div className="popup-arrow" />
          </div>,
          document.body
        )}
    </div>
  );
};

export default BroadcastTextMessageEditor;
