import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import mjmlPlugin from "grapesjs-mjml";
import "grapesjs/dist/css/grapes.min.css";
import emptyTemplateIcon from "../../../../../assets/editor/emptyTemplate.svg";
import pdfIcon from "../../../../../assets/mainScreen/pdfImage.svg";

import "../style.scss";

const EMPTY_TEMPLATE = `
<mjml>
  <mj-body width="100%" background-color="#ffffff">
  
  </mj-body>
</mjml>
`.trim();

// All MJML types that are valid direct children of mj-column
const COLUMN_VALID_CHILDREN = [
  "mj-text",
  "mj-image",
  "mj-button",
  "mj-divider",
  "mj-spacer",
  "mj-social",
  "mj-table",
  "mj-accordion",
  "mj-raw"
];

// Walk a component tree and collect every leaf-level content node
function collectLeafContent(comp, results = []) {
  const type = comp.get("type");
  if (COLUMN_VALID_CHILDREN.includes(type)) {
    results.push(comp);
    return results;
  }
  comp.components().each((child) => collectLeafContent(child, results));
  return results;
}

export default function Editor({ editorRef, onReady, setIsEditorEmpty }) {
  const containerRef = useRef(null);
  const gjsInstance = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachmentClickPending = useRef(false);
  const isUnwrapping = useRef(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const editor = gjsInstance.current;
    const selected = editor.getSelected();
    if (!selected) return;

    let targetComp = selected;
    while (
      targetComp &&
      targetComp.getAttributes()["data-type"] !== "attachment-placeholder"
    ) {
      targetComp = targetComp.parent();
    }
    if (!targetComp) return;

    const docIcon = `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#F2F4F7"/><path d="M12 12V28H28V18L22 12H12Z" fill="white" stroke="#2563EB" stroke-width="2"/><path d="M22 12V18H28" stroke="#2563EB" stroke-width="2"/><text x="13" y="24" fill="#2563EB" font-family="Arial" font-size="5" font-weight="bold">DOC</text></svg>'
    )}`;
    const closeIconSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="white" stroke="#D0D5DD"/><path d="M16 8L8 16M8 8L16 16" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    )}`;

    const fileColumnsHtml = files
      .map((file) => {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        const isDoc = /\.docx?$/i.test(file.name);
        const icon = isDoc ? docIcon : pdfIcon;
        const downloadId = Math.floor(Math.random() * 90000) + 10000;
        return `
<mj-column width="60%" vertical-align="top">
  <mj-text padding="10px">
    <div style="border:1px solid #EAEDF2;border-radius:8px;overflow:hidden;background-color:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td width="48" style="padding:12px 0 12px 12px;vertical-align:middle;">
            <img src="${icon}" width="40" height="40" style="display:block;" />
          </td>
          <td style="padding:12px 8px;vertical-align:middle;">
            <div style="font-size:14px;font-weight:600;color:#1D2939;font-family:Inter,sans-serif;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">${file.name}</div>
            <div style="font-size:12px;color:#667085;font-family:Inter,sans-serif;line-height:1.4;">${sizeMb} MB</div>
          </td>
          <td width="40" style="padding:12px 12px 12px 0;vertical-align:middle;text-align:right;">
            <img src="${closeIconSvg}" class="remove-file-icon" width="24" height="24" style="display:block;cursor:pointer;margin-left:auto;" />
          </td>
        </tr>
      </table>
      <div style="padding:8px 12px 12px;border-top:1px solid #EAEDF2;font-size:14px;color:#404B5A;font-family:Inter,sans-serif;line-height:1.5;align-items:center;justify-content:center;display:flex;">
        Download using Link:&nbsp;<a href="#" style="color:#00A3FF;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;max-width:250px;">https://manipal.care/dl${downloadId}</a>
      </div>
    </div>
  </mj-text>
</mj-column>`;
      })
      .join("");

    targetComp.components(fileColumnsHtml);
    targetComp.addAttributes({ border: "none", padding: "10px 10px" });
    targetComp.addAttributes({ "data-type": "attachment-filled" });
    editor.trigger("component:update", targetComp);
    e.target.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const editor = gjsInstance.current;
      const selected = editor.getSelected();
      if (selected) {
        let target = selected;
        while (target && !target.is("mj-image")) {
          target = target.parent();
        }
        if (target) {
          target.set("src", event.target.result);
          editor.trigger("component:update", target);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "100%",
      blockManager: {},
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Mobile", width: "320px", widthMedia: "480px" }
        ]
      },
      styleManager: {
        appendTo: "#style-manager",
        sectors: [
          {
            name: "Layout",
            open: false,
            buildProps: [
              "width",
              "height",
              "max-width",
              "min-height",
              "margin",
              "padding"
            ]
          },
          {
            name: "Typography",
            open: false,
            buildProps: [
              "font-family",
              "font-size",
              "font-weight",
              "letter-spacing",
              "color",
              "line-height",
              "text-align"
            ]
          },
          {
            name: "Background",
            open: false,
            buildProps: [
              "background-color",
              "background-image",
              "background-repeat",
              "background-size",
              "background-position"
            ]
          },
          {
            name: "Border",
            open: false,
            buildProps: [
              "border-radius",
              "border-width",
              "border-style",
              "border-color"
            ]
          }
        ]
      },
      storageManager: false,
      showDevices: false,
      panels: { defaults: [] },
      canvasCss: `
                html, body { margin: 0; height: 100%; width: 100%; }
                body { min-height: 100%; }
                [data-gjs-type] { min-height: 20px; }
                
                /* Hide scrollbar track */
                ::-webkit-scrollbar {
                  width: 6px;
                }
                ::-webkit-scrollbar-track {
                  background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                  background: #d1d5db;
                  border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                  background: #9ca3af;
                }
                
                /* For Firefox */
                * {
                  scrollbar-width: thin;
                  scrollbar-color: #d1d5db transparent;
                }
            `,
      plugins: [mjmlPlugin],
      pluginsOpts: {
        "grapesjs-mjml": {
          exportButton: false,
          importButton: false
        }
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Override MJML component type defaults RIGHT AFTER plugin loads.
    //
    // grapesjs-mjml sets strict droppable/draggable rules on each type.
    // We must override them on the type MODEL defaults — not on instances —
    // so every component created from those types inherits the new rules.
    //
    // Key insight: GrapesJS sorter checks `model.get('droppable')` on the
    // TARGET and `model.get('draggable')` on the DRAGGED component to decide
    // if a drop is allowed. We set both to `true` so all targets accept all
    // draggable blocks, then use the component:add handler (Step 2) to fix
    // any invalid MJML nesting that results.
    // ─────────────────────────────────────────────────────────────────────────
    editor.on("load", () => {
      const typesToPatch = [
        "mj-body",
        "mj-section",
        "mj-column",
        "mj-hero",
        "mj-wrapper",
        ...COLUMN_VALID_CHILDREN
      ];

      typesToPatch.forEach((typeName) => {
        const typeObj = editor.Components.getType(typeName);
        if (!typeObj) return;

        // Override defaults on the model prototype so ALL future instances
        // and all already-created instances (via set) get these values
        editor.Components.addType(typeName, {
          model: {
            defaults: {
              ...typeObj.model.prototype.defaults,
              droppable: true,
              draggable: true
            }
          }
        });
      });

      // Also patch every already-existing component instance in the tree
      const patchInstance = (comp) => {
        comp.set({ droppable: true, draggable: true });
        comp.components().each(patchInstance);
      };
      patchInstance(editor.getWrapper());
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Fix invalid MJML nesting AFTER the sorter places the component.
    //
    // We use a debounced queue so that ALL component:add events from a single
    // block drop are collected first, then processed once in a microtask.
    // This prevents duplication: GrapesJS fires component:add for every node
    // in a block's tree (section, column, text, etc). If we immediately
    // clone+append leaves during the first event, GrapesJS still fires events
    // for the original inner nodes AND the new clones, producing duplicates.
    //
    // The pendingFixups queue + queueMicrotask pattern ensures we process
    // only the top-level dropped component after all its children are parsed.
    // ─────────────────────────────────────────────────────────────────────────
    const pendingFixups = [];
    let fixupScheduled = false;

    const processPendingFixups = () => {
      fixupScheduled = false;
      // Take a snapshot and clear
      const items = pendingFixups.splice(0, pendingFixups.length);

      // De-duplicate: only process top-level components (skip children that
      // are part of a parent also in the queue, since the parent handler
      // will move them).
      const itemCids = new Set(items.map((c) => c.cid));
      const topLevel = items.filter((comp) => {
        let p = comp.parent();
        while (p) {
          if (itemCids.has(p.cid)) return false; // parent is also queued
          p = p.parent();
        }
        return true;
      });

      isUnwrapping.current = true;
      try {
        topLevel.forEach((component) => {
          // Component may have been removed by a previous iteration
          if (!component.parent()) return;

          const type = component.get("type");
          const parent = component.parent();
          if (!parent) return;
          const parentType = parent.get("type");

          // ── Case 1: mj-section landed inside mj-column ───────────
          if (type === "mj-section" && parentType === "mj-column") {
            const leaves = collectLeafContent(component);
            leaves.forEach((leaf) => parent.append(leaf.clone()));
            component.remove();
            return;
          }

          // ── Case 2: mj-section inside another mj-section ─────────
          if (type === "mj-section" && parentType === "mj-section") {
            const innerCols = [];
            const directContent = [];
            component.components().each((c) => {
              if (c.get("type") === "mj-column") innerCols.push(c.clone());
              else directContent.push(c.clone());
            });
            innerCols.forEach((col) => parent.append(col));
            if (directContent.length > 0) {
              const newCol = parent.components().add(`<mj-column></mj-column>`);
              directContent.forEach((c) => newCol.append(c));
            }
            component.remove();
            return;
          }

          // ── Case 3: leaf content inside mj-section ───────────────
          if (
            COLUMN_VALID_CHILDREN.includes(type) &&
            parentType === "mj-section"
          ) {
            const cloned = component.clone();
            const idx = parent.components().indexOf(component);
            component.remove();
            const newCol = parent
              .components()
              .add(`<mj-column></mj-column>`, { at: idx });
            newCol.append(cloned);
            return;
          }

          // ── Case 4: mj-column inside mj-body ─────────────────────
          if (type === "mj-column" && parentType === "mj-body") {
            const cloned = component.clone();
            const idx = parent.components().indexOf(component);
            component.remove();
            const newSection = parent
              .components()
              .add(`<mj-section></mj-section>`, { at: idx });
            newSection.append(cloned);
            return;
          }

          // ── Case 5: leaf content inside mj-body ──────────────────
          if (
            COLUMN_VALID_CHILDREN.includes(type) &&
            parentType === "mj-body"
          ) {
            const cloned = component.clone();
            const idx = parent.components().indexOf(component);
            component.remove();
            const newSection = parent
              .components()
              .add(`<mj-section></mj-section>`, { at: idx });
            const newCol = newSection
              .components()
              .add(`<mj-column></mj-column>`);
            newCol.append(cloned);
          }
        });
      } finally {
        isUnwrapping.current = false;
      }
    };

    editor.on("component:add", (comp) => {
      // Patch droppable/draggable on every new instance
      const type = comp.get("type");
      if (type && type !== "textnode" && type !== "text") {
        comp.set({ droppable: true, draggable: true });
      }

      // Skip if we're currently doing our own restructuring
      if (isUnwrapping.current) return;

      // Queue for deferred fixup processing
      if (type && type !== "textnode" && type !== "text") {
        pendingFixups.push(comp);
        if (!fixupScheduled) {
          fixupScheduled = true;
          // Use setTimeout(0) to run after GrapesJS finishes processing
          // all component:add events from the current block drop
          setTimeout(processPendingFixups, 0);
        }
      }
    });

    registerBlocks(editor);
    editor.setComponents(EMPTY_TEMPLATE);

    // ── Inject overlay style ──────────────────────────────────────────────────
    const overlayStyle = document.createElement("style");
    overlayStyle.setAttribute("data-gjs-overlay", "true");
    overlayStyle.textContent = `
            #gjs-empty-overlay {
                position: absolute; inset: 0;
                display: flex; align-items: center; justify-content: center;
                pointer-events: none; z-index: 1000;
                border-radius: 10px; padding: 16px;
            }
            #gjs-empty-overlay-inner {
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                gap: 12px; width: 100%;
            }
            #gjs-empty-overlay-icon { width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; }
            #gjs-empty-overlay-text {
                font-family: 'Inter'; font-size: 16px; color: #404B5A;
                font-weight: 400; line-height: 24px; text-align: center;
            }
            #gjs-empty-overlay-text strong {
                font-family: 'Inter'; color: #404B5A;
                font-weight: 600; font-size: 16px; line-height: 24px;
            }
        `;
    document.head.appendChild(overlayStyle);

    const overlay = document.createElement("div");
    overlay.id = "gjs-empty-overlay";
    overlay.innerHTML = `
            <div id="gjs-empty-overlay-inner">
                <div id="gjs-empty-overlay-icon">
                   <img src="${emptyTemplateIcon}" alt="emptyTemplateIcon" width="45" height="45"/>
                </div>
                <p id="gjs-empty-overlay-text">
                    <strong> Drag &amp; drop </strong>modules or <br/> select a template from the left panel 
                </p>
            </div>
        `;
    const gjsRoot = containerRef.current;
    if (gjsRoot) {
      gjsRoot.style.position = "relative";
      gjsRoot.appendChild(overlay);
    }

    editor.on("load", () => {
      // ── Remove-file icon handler inside canvas iframe ─────────────────────
      const body = editor.Canvas.getBody();
      body.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-file-icon")) {
          const comp = editor.Components.getWrapper().find(e.target)[0];
          if (comp) {
            let column = comp;
            while (column && column.get("type") !== "mj-column") {
              column = column.parent();
            }
            if (column) {
              const section = column.parent();
              column.remove();
              if (section && section.components().length === 0) {
                section.addAttributes({
                  "data-type": "attachment-placeholder",
                  border: "2px dashed #00A3FF",
                  padding: "30px 20px"
                });
                const uploadIcon =
                  "data:image/svg+xml;utf8," +
                  encodeURIComponent(
                    `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#F2F4F7"/><path d="M25.333 16l-6.012 7.155a1.667 1.667 0 1 0 2.358 2.357l7.011-7.155a3.333 3.333 0 1 0-4.714-4.714l-7.012 7.126a5 5 0 0 0 7.071 7.071L30.047 20.714" stroke="#555F75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
                  );
                section.components(`
                                    <mj-column>
                                        <mj-text align="center" padding="0">
                                            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
                                                <img src="${uploadIcon}" width="40" height="40" style="display:block;" />
                                                <span style="font-size:16px;font-weight:500;color:#404B5A;font-family:Inter,sans-serif;">Upload Attachment</span>
                                                <span style="font-size:12px;color:#98A2B3;font-family:Inter,sans-serif;">Click to browse files</span>
                                            </div>
                                        </mj-text>
                                    </mj-column>
                                `);
                editor.trigger("component:update", section);
              }
            }
          }
        }
      });

      // ── Empty-state overlay ───────────────────────────────────────────────
      const hasRealContent = () => {
        const wrapper = editor.getWrapper();
        if (!wrapper) return false;
        let mjBody = null;
        const findBody = (comp) => {
          if (mjBody) return;
          if (comp.get("type") === "mj-body") {
            mjBody = comp;
            return;
          }
          comp.components().forEach(findBody);
        };
        findBody(wrapper);
        if (!mjBody) return false;
        const components = mjBody.components();
        if (components.length === 0) return false;
        const realComponents = components.filter(
          (c) => c.get("type") !== "textnode"
        );
        if (realComponents.length === 0) return false;
        if (realComponents.length === 1) {
          const firstChild = realComponents.at(0);
          if (
            firstChild.get("type") === "mj-section" &&
            firstChild.components().length === 0
          )
            return false;
        }
        return true;
      };

      const toggleOverlay = () => {
        const overlayEl = document.getElementById("gjs-empty-overlay");
        if (!overlayEl) return;
        const isEmpty = !hasRealContent();
        overlayEl.style.display = isEmpty ? "flex" : "none";
        overlayEl.style.opacity = isEmpty ? "1" : "0";
        if (setIsEditorEmpty) setIsEditorEmpty(isEmpty);
      };

      editor.on(
        "component:add component:remove component:clone update:components load",
        toggleOverlay
      );
      toggleOverlay();

      // ── Background / style sync ───────────────────────────────────────────
      editor.on("component:update:style", (comp) => {
        const type = comp.get("type");
        if (!["mj-section", "mj-hero", "mj-wrapper", "mj-body"].includes(type))
          return;
        const style = comp.getStyle();
        const attributes = {};
        if (style["background-image"]) {
          const urlMatch = style["background-image"].match(
            /url\((['"]?)(.*?)\1\)/
          );
          if (urlMatch && urlMatch[2])
            attributes["background-url"] = urlMatch[2];
          else if (style["background-image"] === "none")
            attributes["background-url"] = "";
        }
        if (style["background-color"])
          attributes["background-color"] = style["background-color"];
        if (style["background-repeat"])
          attributes["background-repeat"] = style["background-repeat"];
        if (style["background-size"])
          attributes["background-size"] = style["background-size"];
        if (style["background-position"])
          attributes["background-position"] = style["background-position"];
        if (Object.keys(attributes).length > 0) {
          const currentAttrs = comp.getAttributes();
          const toUpdate = {};
          for (const key in attributes) {
            if (currentAttrs[key] !== attributes[key])
              toUpdate[key] = attributes[key];
          }
          if (Object.keys(toUpdate).length > 0) comp.addAttributes(toUpdate);
        }
      });
    });

    // ── Auto-open image picker when a blank mj-image is selected ─────────────
    editor.on("component:selected", (cmp) => {
      if (cmp && cmp.is("mj-image")) {
        const src = cmp.getAttributes().src;
        if (!src || src.includes("data:image/svg")) {
          imageInputRef.current?.click();
        }
      }
    });

    // ── Open file picker when attachment placeholder is clicked ───────────────
    editor.on("component:selected", (cmp) => {
      if (!cmp) return;
      let current = cmp;
      let isAttachment = false;
      while (current) {
        if (current.getAttributes()["data-type"] === "attachment-placeholder") {
          isAttachment = true;
          break;
        }
        current = current.parent();
      }
      if (isAttachment && !attachmentClickPending.current) {
        attachmentClickPending.current = true;
        setTimeout(() => {
          fileInputRef.current?.click();
          attachmentClickPending.current = false;
        }, 0);
      }
    });

    // ── Get compiled HTML from the live canvas iframe ─────────────────────────
    const getCompiledHtmlFromCanvas = () => {
      try {
        const frames = editor.Canvas.getFrames();
        if (frames && frames.length > 0) {
          const frameView = frames.at(0).view;
          if (frameView && frameView.el) {
            const iframeDoc =
              frameView.el.contentDocument ||
              frameView.el.contentWindow?.document;
            if (iframeDoc) return iframeDoc.documentElement.outerHTML;
          }
        }
      } catch (e) {
        console.warn("getCompiledHtmlFromCanvas error:", e);
      }
      try {
        const frameEl = editor.Canvas.getFrameEl?.();
        if (frameEl) {
          const iframeDoc =
            frameEl.contentDocument || frameEl.contentWindow?.document;
          if (iframeDoc) return iframeDoc.documentElement.outerHTML;
        }
      } catch (e) {
        console.warn("getFrameEl fallback error:", e);
      }
      return null;
    };

    if (editorRef) {
      editorRef.current = {
        undo: () => editor.UndoManager.undo(),
        redo: () => editor.UndoManager.redo(),
        getHtml: () => editor.getHtml(),
        getJson: () => JSON.stringify(editor.getProjectData(), null, 2),
        getEditor: () => editor,
        setDevice: (device) => editor.setDevice(device),
        runCommand: (command, options) => editor.runCommand(command, options),
        getCompiledHtml: getCompiledHtmlFromCanvas
      };
    }

    gjsInstance.current = editor;
    if (onReady) onReady(editor);

    return () => {
      const injected = document.querySelector("style[data-gjs-overlay]");
      if (injected) injected.remove();
      editor.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        id="gjs"
        style={{ width: "100%", height: "100%", position: "relative" }}
      />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        multiple
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleImageChange}
      />
    </div>
  );
}

function registerBlocks(editor) {
  const bm = editor.BlockManager;
  if (bm.getAll) bm.getAll().reset();

  const svgPlaceholder =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200'><rect width='600' height='200' fill='%23F9FAFB'/><rect x='250' y='55' width='100' height='90' rx='4' fill='none' stroke='%2300A3FF' stroke-width='1' stroke-dasharray='4 4'/><g transform='translate(288, 70)' fill='none' stroke='%23475467' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7'/><line x1='16' y1='5' x2='22' y2='5'/><line x1='19' y1='2' x2='19' y2='8'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></g><text x='300' y='130' text-anchor='middle' font-family='Inter, sans-serif' font-size='14' font-weight='500' fill='%23475467'>Add Image</text></svg>";

  const uploadIcon =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#F2F4F7"/><path d="M25.333 16l-6.012 7.155a1.667 1.667 0 1 0 2.358 2.357l7.011-7.155a3.333 3.333 0 1 0-4.714-4.714l-7.012 7.126a5 5 0 0 0 7.071 7.071L30.047 20.714" stroke="#555F75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    );

  // ── Frame blocks ──────────────────────────────────────────────────────────────
  bm.add("row", {
    label: "Frame - Row",
    category: "Blocks",
    content: `<mj-section><mj-column padding="20px" background-color="#ffffff"></mj-column></mj-section>`
  });

  bm.add("column", {
    label: "Frame - Column",
    category: "Blocks",
    content: `<mj-column padding="20px" background-color="#ffffff"></mj-column>`
  });

  // ── Content blocks — wrapped in mj-section > mj-column for canvas drops.
  //    The component:add handler unwraps when dropped into existing sections.

  bm.add("heading", {
    label: "Heading",
    category: "Content",
    content: `<mj-section><mj-column><mj-text font-size="24px" font-weight="bold" color="#000000">Your Heading</mj-text></mj-column></mj-section>`
  });

  bm.add("paragraph", {
    label: "Paragraph",
    category: "Content",
    content: `<mj-section><mj-column><mj-text font-size="14px" color="#555555" line-height="1.6">Paragraph content</mj-text></mj-column></mj-section>`
  });

  bm.add("image", {
    label: "Image",
    category: "Content",
    content: `<mj-section><mj-column><mj-image src="${svgPlaceholder}" /></mj-column></mj-section>`
  });

  bm.add("button", {
    label: "Button",
    category: "Content",
    content: `<mj-section><mj-column><mj-button background-color="#00A3FF" color="#ffffff" border-radius="6px">Click Here</mj-button></mj-column></mj-section>`
  });

  bm.add("divider", {
    label: "Divider",
    category: "Content",
    content: `<mj-section><mj-column><mj-divider border-color="#dddddd" border-width="1px" padding="10px 0"/></mj-column></mj-section>`
  });

  bm.add("Attachment", {
    label: "Attachment",
    category: "Content",
    content: `
            <mj-section data-type="attachment-placeholder" border="2px dashed #00A3FF" padding="0px 0px" background-color="#ffffff">
                <mj-column>
                    <mj-text align="center" padding="0">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                            <img src="${uploadIcon}" width="24" height="24" style="display:block;" />
                            <span style="font-size:14px;font-weight:500;color:#4D5761;font-family:Inter,sans-serif;">Upload Attachment</span>
                        </div>
                    </mj-text>
                </mj-column>
            </mj-section>`
  });

  // ── Component blocks ──────────────────────────────────────────────────────────
  bm.add("custom-header", {
    label: "Header Banner",
    category: "Components",
    content: `
            <mj-section background-color="#2f6f4e">
                <mj-column>
                    <mj-text align="center" color="#ffffff" font-size="24px" font-weight="bold" padding="20px">
                        Your Header Here
                    </mj-text>
                </mj-column>
            </mj-section>`
  });

  bm.add("custom-text-block", {
    label: "Text Block",
    category: "Components",
    content: `
            <mj-section background-color="#ffffff" padding="30px 40px">
                <mj-column>
                    <mj-text font-size="14px" color="#555555" line-height="1.6" padding="10px 0">
                        Add your content here. This is a paragraph of text.
                    </mj-text>
                </mj-column>
            </mj-section>`
  });

  bm.add("custom-button-block", {
    label: "CTA Button",
    category: "Components",
    content: `
            <mj-section>
                <mj-column>
                    <mj-button background-color="#2f6f4e" color="#ffffff" border-radius="6px" font-size="14px" padding="14px 28px" href="#">
                        Click Here
                    </mj-button>
                </mj-column>
            </mj-section>`
  });

  bm.add("custom-image-block", {
    label: "Image Section",
    category: "Components",
    content: `
            <mj-section background-color="#ffffff" padding="20px">
                <mj-column>
                    <mj-image src="${svgPlaceholder}" padding="0" />
                </mj-column>
            </mj-section>`
  });
}
