import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import mjmlPlugin from "grapesjs-mjml";
import { uploadToCloudinary } from "../../../../../utils/uploadUtils";
import "grapesjs/dist/css/grapes.min.css";
import emptyTemplateIcon from "../../../../../assets/editor/emptyTemplate.svg";
import pdfIcon from "../../../../../assets/mainScreen/pdfImage.svg";
import uploadImage from "../../../../../assets/commonIcons/uploadImage.svg";

import "../style.scss";
import { LinkModal } from "../linkModal/index";

const EMPTY_TEMPLATE = `
<mjml>
  <mj-body width="100%" background-color="transparent" padding="0px" margin="0px">
 
  </mj-body>
</mjml>
`.trim();

const SIGNATURE_SECTION_HTML = `<mj-section full-width="full-width" data-type="signature-section" padding="0px" margin="0px" width="100%" background-color="transparent">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text  padding="16px 0px" margin="0px" color="#181D25" font-size="16px" font-weight="500" font-family="Inter" line-height=20px>
      Add Signature
    </mj-text>
  </mj-column>
</mj-section>`;

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

// Check if a component is nested inside a row/column frame
function isInsideFrame(comp) {
  return !!findNearestFrame(comp);
}

// Find the nearest frame ancestor for a component
function findNearestFrame(comp) {
  let ancestor = comp.parent();
  while (ancestor) {
    try {
      const dt = ancestor.getAttributes?.()?.["data-type"];
      if (
        dt === "row-frame-column" ||
        dt === "column-frame-column" ||
        dt === "column-frame-section"
      ) {
        return ancestor;
      }
    } catch {
      /* skip destroyed */
    }
    ancestor = ancestor.parent();
  }
  return null;
}

// Calculate the nesting depth of frames
function getFrameDepth(comp) {
  let depth = 0;
  let current = comp;
  while (current) {
    try {
      const dt = current.getAttributes?.()?.["data-type"];
      if (dt === "column-frame-section" || dt === "row-frame-column") {
        depth++;
      }
    } catch {
      /* skip errors */
    }
    current = current.parent();
  }
  return depth;
}

// Check if a component model is a Frame block
function isFrameBlock(model) {
  if (!model) return false;
  const type = model.get("type");
  const dt = model.getAttributes?.()["data-type"];

  if (dt === "column-frame-section" || dt === "row-frame-column") return true;

  // Check if it's a section that contains a row-frame-column (typical for Row block)
  if (type === "mj-section") {
    let hasRowFrame = false;
    model.components().each((c) => {
      if (c.getAttributes?.()["data-type"] === "row-frame-column") {
        hasRowFrame = true;
      }
    });
    return hasRowFrame;
  }

  return false;
}

// Check if a component is nested inside a column frame
function isInsideColumnFrame(comp) {
  return !!findNearestColumnFrame(comp);
}

// Find the nearest column-frame ancestor
function findNearestColumnFrame(comp) {
  let ancestor = comp.parent();
  while (ancestor) {
    try {
      if (
        ancestor.getAttributes?.()?.["data-type"] === "column-frame-section"
      ) {
        return ancestor;
      }
    } catch {
      /* skip destroyed */
    }
    ancestor = ancestor.parent();
  }
  return null;
}

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

// Helper to clear frame placeholders from a container (no longer needed for component-based, but kept for compatibility)
function clearFramePlaceholder(container) {
  if (!container) return;
  const placeholder = container
    .components()
    .find((c) => c.getAttributes()["data-type"] === "frame-placeholder-ui");
  if (placeholder) {
    placeholder.remove();
  }
}

// Determine whether a component should accept drops.
// Only column-frame sections and frame columns (row-frame-column, or any
// mj-column that is a direct child of a column-frame-section) are droppable.
// Regular mj-sections and mj-columns are NOT droppable so the GrapesJS Sorter
// falls back to placing blocks at the mj-body level, which fixes the scroll bug
// where dropping near the bottom of a scrolled canvas incorrectly targeted the
// last section's column.
function resolveDroppable(comp) {
  const type = comp.get("type");
  const dt = comp.getAttributes?.()?.["data-type"];
  const depth = getFrameDepth(comp);

  if (type === "mj-body") return true;

  // Level restriction function
  const checkNesting = (droppedModel) => {
    // If we are already at depth 3, we only allow content blocks (not frames)
    if (depth >= 3 && isFrameBlock(droppedModel)) {
      return false;
    }
    return true;
  };

  if (type === "mj-section") {
    if (dt === "column-frame-section") {
      return (droppedModel) => checkNesting(droppedModel);
    }
    return false;
  }

  if (type === "mj-column") {
    if (dt === "row-frame-column") {
      return (droppedModel) => checkNesting(droppedModel);
    }

    const parentDt = comp.parent()?.getAttributes?.()?.["data-type"];
    if (parentDt === "column-frame-section") {
      return (droppedModel) => checkNesting(droppedModel);
    }
  }

  // leaf types remain non-droppable to prevent accidental block nesting
  return type === "mj-body";
}

// Scan every frame column and sync placeholder visibility via data-is-empty attribute
function reconcileFramePlaceholders(editor, isReconciling) {
  if (isReconciling.current) return;
  isReconciling.current = true;
  try {
    const frameCols = [];
    const wrapper = editor.getWrapper();
    if (!wrapper) return;
    const collect = (comp) => {
      try {
        const dt = comp.getAttributes()?.["data-type"];
        if (
          dt === "row-frame-column" ||
          dt === "column-frame-column" ||
          dt === "column-frame-section"
        ) {
          frameCols.push(comp);
        }
        comp.components().each(collect);
      } catch {
        /* skip destroyed components */
      }
    };
    collect(wrapper);

    frameCols.forEach((col) => {
      let hasReal = false;

      col.components().each((c) => {
        const childDt = c.getAttributes()?.["data-type"];
        const childType = c.get("type");

        // Ignore placeholder component if it still exists from old versions
        if (childDt === "frame-placeholder-ui") {
          // c.remove(); // Optional: clean up old placeholders
          return;
        }

        // Check if it's real content:
        // - If it's a textnode or text, it must have non-whitespace content
        // - If it's a frame placeholder UI component, skip it
        // - Otherwise, any component (sections, columns, images, etc.) is real content
        if (childType === "textnode" || childType === "text") {
          const content = c.get("content")?.trim();
          if (content && content.length > 0) {
            hasReal = true;
          }
        } else if (childDt !== "frame-placeholder-ui") {
          // Any other component (mj-section, mj-column, mj-image, etc.) counts as content
          hasReal = true;
        }
      });

      // Update the attribute instead of adding/removing components
      const currentStatus = col.getAttributes()["data-is-empty"];
      const newStatus = hasReal ? "false" : "true";
      if (currentStatus !== newStatus) {
        col.addAttributes({ "data-is-empty": newStatus });
      }
    });

    // Rebalance mj-column widths inside every column-frame-section
    // so blocks are displayed side-by-side with equal width.
    // FORCE EQUAL only if column count changed.
    frameCols.forEach((col) => {
      const attrs = col.getAttributes() || {};
      if (attrs["data-type"] !== "column-frame-section") return;

      const columns = [];
      col.components().each((c) => {
        if (c.get("type") === "mj-column") columns.push(c);
      });

      const n = columns.length;
      if (n === 0) return;

      const lastN = parseInt(attrs["data-column-count"] || "0", 10);
      if (n !== lastN) {
        // Enforce equal widths and reset manual tags
        const equalWidth = `${(100 / n).toFixed(4)}%`;
        columns.forEach((c) => {
          c.addAttributes({
            width: equalWidth,
            "data-manual-width": "false"
          });
        });
        col.addAttributes({ "data-column-count": n.toString() });
      }
    });
  } finally {
    isReconciling.current = false;
  }
}

export default function Editor({ editorRef, onReady, setIsEditorEmpty }) {
  const containerRef = useRef(null);
  const gjsInstance = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const isUnwrapping = useRef(false);
  const imageTargetCompRef = useRef(null);

  // Link Modal state for toolbar Link icon
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState("");
  const [linkModalUrl, setLinkModalUrl] = useState("");
  const currentRteRef = useRef(null);
  const savedRangeRef = useRef(null);

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

    const columnsHtml = files
      .map((file) => {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        const isDoc = /\.docx?$/i.test(file.name);
        const icon = isDoc ? docIcon : pdfIcon;
        const downloadId = Math.floor(Math.random() * 90000) + 10000;
        return `<mj-column width="100%" vertical-align="top" padding="0px">
    <mj-text padding="0px 0px 10px 0px" width="100%">
      <div style="display:flex; gap:8px; flex-direction:column; width:60%; box-sizing:border-box;">
        <div style="background-color:#ffffff; padding:10px; box-sizing:border-box; border:1px solid #EAEDF2; border-radius:8px; display:flex; align-items:center; width:100%; gap:10px;">
          <img src="${icon}" width="40" height="40" style="display:block; flex-shrink:0;" />
          <div style="display:flex; flex-direction:column; gap:4px; overflow:hidden; flex:1; min-width:0;">
            <p style="margin:0; padding:0; font-size:12px; font-weight:500; color:#181D25; font-family:Inter, sans-serif; line-height:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${file.name}</p>
            <p style="margin:0; padding:0; font-size:12px; color:#929FB1; font-weight:500; font-family:Inter, sans-serif; line-height:18px;">${sizeMb} MB</p>
          </div>
          <img src="${closeIconSvg}" class="remove-file-icon" width="24" height="24" style="display:block; cursor:pointer; flex-shrink:0; margin-left:auto;" />
        </div>
        <div style="display:flex; align-items:center; gap:4px; width:101%; box-sizing:border-box; justify-content:center;">
          <p style="margin:0; padding:0; font-size:12px; color:#404B5A; font-family:Inter, sans-serif; line-height:18px; white-space:nowrap; flex-shrink:0;">Download using Link:</p>
          <p style="margin:0; padding:0; font-size:12px; color:#1570EF; text-decoration:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0;">
            https://manipal.care/dl${downloadId}
          </p>
        </div>
      </div>
    </mj-text>
  </mj-column>`;
      })
      .join("");

    const sectionHtml = `<mj-section full-width="full-width" padding="4px 0px" margin="0px" width="100%" direction="ltr" text-align="left" data-type="attachment-filled">
      ${columnsHtml}
    </mj-section>`;

    const parent = targetComp.parent();
    const idx = parent.components().indexOf(targetComp);

    // Clear selection before removing the component
    editor.select(null);

    isUnwrapping.current = true;
    try {
      targetComp.remove();
      parent.components().add(sectionHtml, { at: idx });
      editor.trigger("component:update", parent);
    } finally {
      isUnwrapping.current = false;
    }
    e.target.value = "";
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Capture the target ref before async operations clear it
    const capturedTarget = imageTargetCompRef.current;
    imageTargetCompRef.current = null;

    try {
      const dataUrl = await uploadToCloudinary(file);
      if (!dataUrl) return;

      // Resolve actual pixel dimensions before inserting into the editor
      const img = new window.Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const widthAttr = `${naturalWidth}px`;
        const heightAttr = `${naturalHeight}px`;

        const editor = gjsInstance.current;
        const targetFromRef = capturedTarget;
        const selected = editor.getSelected();

        if (targetFromRef || selected) {
          // Case 1: An mj-image is selected (or targeted) — update src and dimensions directly
          let target = targetFromRef || selected;
          while (target && !target.is("mj-image")) {
            target = target.parent();
          }
          if (target) {
            target.addAttributes({
              src: dataUrl,
              width: widthAttr,
              height: heightAttr
            });
            editor.trigger("component:update", target);
            return;
          }

          // Case 2: The image placeholder div is inside an mj-column — replace only the placeholder
          let column = selected;
          while (column && column.get("type") !== "mj-column") {
            column = column.parent();
          }
          if (column) {
            editor.select(null);
            // Find the active placeholder component within this column
            const placeholderTarget = column.components().find((c) => {
              try {
                return c.getView()?.el?.querySelector(".image-click-area");
              } catch {
                return false;
              }
            });

            if (placeholderTarget) {
              const index = column.components().indexOf(placeholderTarget);
              isUnwrapping.current = true;
              try {
                placeholderTarget.remove();
                column
                  .components()
                  .add(
                    `<mj-image src="${dataUrl}" padding="0px" margin="0px" width="${widthAttr}" height="${heightAttr}" align="center" />`,
                    { at: index }
                  );
              } finally {
                isUnwrapping.current = false;
              }
            } else {
              // Fallback: append to column if placeholder not found
              column.append(
                `<mj-image src="${dataUrl}" padding="0px" margin="0px" width="${widthAttr}" height="${heightAttr}" align="center" />`
              );
            }
            editor.trigger("component:update", column);
            return;
          }
        }

        // Case 3: Nothing selected — find any column that has the placeholder and replace it
        const allColumns = [];
        const collectColumns = (comp) => {
          if (comp.get("type") === "mj-column") allColumns.push(comp);
          comp.components().each(collectColumns);
        };
        collectColumns(editor.getWrapper());

        for (const col of allColumns) {
          try {
            const view = col.getView?.();
            if (view?.el?.querySelector?.(".image-click-area")) {
              // Find the specific component within this column that is the placeholder
              const placeholderComp = col.components().find((c) => {
                try {
                  return c.getView()?.el?.querySelector(".image-click-area");
                } catch {
                  return false;
                }
              });

              if (placeholderComp) {
                const index = col.components().indexOf(placeholderComp);
                isUnwrapping.current = true;
                try {
                  placeholderComp.remove();
                  col
                    .components()
                    .add(
                      `<mj-image src="${dataUrl}" padding="0px" margin="0px" width="${widthAttr}" height="${heightAttr}" align="center" />`,
                      { at: index }
                    );
                } finally {
                  isUnwrapping.current = false;
                }
              } else {
                // Fallback: replace whole column only if individual component look-up fails
                col.components().reset();
                col.append(
                  `<mj-image src="${dataUrl}" padding="0px" margin="0px" width="${widthAttr}" height="${heightAttr}" align="center" />`
                );
              }
              editor.trigger("component:update", col);
              break;
            }
          } catch {
            /* skip */
          }
        }
      };
      img.src = dataUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      // alert("Upload failed. Using local fallback.");
    }
    e.target.value = "";
  };

  const handleToolbarLinkConfirm = () => {
    if (!currentRteRef.current) return;

    // Ensure the URL has a protocol
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

    const rte = currentRteRef.current;
    if (rte.el) {
      const doc = rte.el.ownerDocument;
      const win = doc.defaultView;

      // Find the placeholder span we inserted when the modal was opened.
      // Using a real DOM node as the marker means this works correctly for
      // every link (including the first), even after React re-renders or
      // GrapesJS model syncs that would otherwise invalidate a saved Range.
      const placeholder = doc.getElementById("gjs-link-placeholder");
      if (placeholder) {
        const link = doc.createElement("a");
        link.href = url || "#";
        link.target = "_blank";
        link.style.color = "#1570EF";
        link.style.textDecoration = "underline";
        link.textContent = linkModalText || url || "Link";

        // Swap placeholder with the real link, preserving exact position
        placeholder.parentNode.replaceChild(link, placeholder);

        // Focus the editor and place cursor after the inserted link
        rte.el.focus();
        const sel = win.getSelection();
        const newRange = doc.createRange();
        newRange.setStartAfter(link);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        // Trigger GrapesJS to recognize the change
        rte.el.dispatchEvent(new Event("input", { bubbles: true }));
        if (gjsInstance.current) {
          const selected = gjsInstance.current.getSelected();
          if (selected) {
            gjsInstance.current.trigger("component:update", selected);
          }
        }
      }

      savedRangeRef.current = null;
    }

    setIsLinkModalOpen(false);
    setLinkModalText("");
    setLinkModalUrl("");
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
                html, body { margin: 0; min-height: 100%; width: 100%; overflow-x: hidden; }
                body {
                  min-height: 100%;
                  word-break: break-word;
                  overflow-wrap: break-word;
                }
                [data-gjs-type] { min-height: 20px; }

                /* Remove focus border/outline on editable elements */
                [data-gjs-type]:focus,
                [contenteditable]:focus,
                [contenteditable="true"]:focus {
                  outline: none !important;
                  border: none !important;
                  box-shadow: none !important;
                }

                /* ── Bullet / ordered-list fix ─────────────────────────────────
                   MJML renders mj-text content inside <td> elements. Browsers
                   default to clipping <td> overflow which hides bullet markers
                   that hang to the left of the text flow.
                   - overflow:visible on td/th lets markers paint in the gutter.
                   - overflow:visible on ul/ol prevents nested re-clipping.
                   - display:list-item on li survives MJML's CSS reset.
                   - margin-left (not padding-left) is used in convertToList so
                     bullets render in the physical left gutter of the list box.
                ──────────────────────────────────────────────────────────── */
                td, th {
                  overflow: visible !important;
                }
                ul, ol {
                  overflow: visible !important;
                  list-style-type: disc;
                  padding-left: 0;
                  margin-left: 20px;
                }
                ol {
                  list-style-type: decimal;
                }
                li {
                  display: list-item !important;
                  overflow: visible !important;
                }
                .list-content-cell p, .list-content-cell div {
                  display: inline !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                  .list-item-row {
                    display: flex !important;
                    align-items: center !important;
                  }

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

                /* Row Frame Placeholder Styles */
                [data-type="row-frame-column"] {
                  position: relative;
                  min-height: 80px;
                }

                [data-type="row-frame-column"][data-is-empty="true"] {
                  position: relative !important;
                  background: transparent !important;
                  border: 1px dashed transparent !important;
                  min-height: 100px !important;
                  box-sizing: border-box !important;
                  cursor: pointer !important;
                  transition: all 0.2s ease !important;
                }

                [data-type="row-frame-column"][data-is-empty="true"]:hover {
                  background: transparent !important;
                  border-color: #1570ef !important;
                }

                [data-type="row-frame-column"][data-is-empty="true"]::before {
                  content: "" !important;
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  transform: translate(-50%, -24px) !important;
                  width: 24px !important;
                  height: 24px !important;
                  display: block !important;
                  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'><path d='M4 12H20M4 6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V6Z' stroke='%231570EF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>") !important;
                  background-size: contain !important;
                  background-repeat: no-repeat !important;
                  opacity: 0.7 !important;
                }

                [data-type="row-frame-column"][data-is-empty="true"]::after {
                  content: "Drag and drop items here to stack them in rows" !important;
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  transform: translate(-50%, 8px) !important;
                  font-family: Inter, Arial, sans-serif !important;
                  font-size: 13px !important;
                  color: #4D5761 !important;
                  font-weight: 500 !important;
                  display: block !important;
                  white-space: normal !important;
                  text-align: center !important;
                  width: 90% !important;
                  box-sizing: border-box !important;
                  opacity: 0.8 !important;
                }

                /* Column Frame Placeholder Styles */
                [data-type="column-frame-section"],
                [data-type="column-frame-column"] {
                  position: relative;
                  min-height: 80px;
                }

                [data-type="column-frame-section"][data-is-empty="true"],
                [data-type="column-frame-column"][data-is-empty="true"] {
                  position: relative !important;
                  background: transparent !important;
                  border: 1px dashed transparent !important;
                  min-height: 100px !important;
                  box-sizing: border-box !important;
                  cursor: pointer !important;
                  transition: all 0.2s ease !important;
                }

                [data-type="column-frame-section"][data-is-empty="true"]:hover,
                [data-type="column-frame-column"][data-is-empty="true"]:hover {
                  background: transparent !important;
                  border-color: #1570ef !important;
                }

                [data-type="column-frame-section"][data-is-empty="true"]::before,
                [data-type="column-frame-column"][data-is-empty="true"]::before {
                  content: "" !important;
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  transform: translate(-50%, -24px) !important;
                  width: 24px !important;
                  height: 24px !important;
                  display: block !important;
                  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'><path d='M12 4V20M4 6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V6Z' stroke='%231570EF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>") !important;
                  background-size: contain !important;
                  background-repeat: no-repeat !important;
                  opacity: 0.7 !important;
                }

                [data-type="column-frame-section"][data-is-empty="true"]::after,
                [data-type="column-frame-column"][data-is-empty="true"]::after {
                  content: "Drag and drop items here to stack them in columns" !important;
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  transform: translate(-50%, 8px) !important;
                  font-family: Inter, Arial, sans-serif !important;
                  font-size: 13px !important;
                  color: #4D5761 !important;
                  font-weight: 500 !important;
                  display: block !important;
                  white-space: normal !important;
                  text-align: center !important;
                  width: 90% !important;
                  box-sizing: border-box !important;
                  opacity: 0.8 !important;
                }

                /* First section top border-radius */
                [data-gjs-type="mj-section"]:first-child {
                  border-top-left-radius: 10px !important;
                  border-top-right-radius: 10px !important;
                }

                /* Disable pointer events for links in editor */
                a { pointer-events: none !important; }
            `,
      plugins: [mjmlPlugin],
      pluginsOpts: {
        "grapesjs-mjml": {
          exportButton: false,
          importButton: false
        }
      }
    });

    // ── Override Asset Manager to use native file picker ─────────────────────
    editor.Commands.add("open-assets", {
      run(editor, sender, opts = {}) {
        const target = opts.target || editor.getSelected();
        if (
          target &&
          (target.is("mj-image") || target.get("type") === "mj-image")
        ) {
          imageTargetCompRef.current = target;
          imageInputRef.current?.click();
        } else {
          // If not an image, fall back to default if needed, or just do nothing
          // For now, we only care about images.
          imageTargetCompRef.current = target;
          imageInputRef.current?.click();
        }
      }
    });

    // ── Double-click on mj-image triggers open-assets ────────────────────────
    editor.on("component:dblclick", (comp) => {
      if (comp.is("mj-image")) {
        editor.runCommand("open-assets", { target: comp });
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Override MJML component type defaults RIGHT AFTER plugin loads.
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

      const ZERO_PADDING_TYPES = new Set([
        "mj-body",
        "mj-column",
        "mj-hero",
        "mj-wrapper",
        ...COLUMN_VALID_CHILDREN
      ]);

      typesToPatch.forEach((typeName) => {
        const typeObj = editor.Components.getType(typeName);
        if (!typeObj) return;

        // mj-section gets 20px all-side padding; everything else gets 0px.
        const extraAttrs = ZERO_PADDING_TYPES.has(typeName)
          ? { padding: "0px", margin: "0px", width: "100%" }
          : typeName === "mj-section"
            ? { padding: "20px", margin: "0px", width: "100%" }
            : {};

        editor.Components.addType(typeName, {
          model: {
            defaults: {
              ...typeObj.model.prototype.defaults,
              droppable: true,
              draggable: true,
              attributes: {
                ...(typeObj.model.prototype.defaults.attributes || {}),
                ...extraAttrs
              }
            }
          }
        });
      });

      // ── Extend mj-text stylable to include 'width' ────────────────────────
      // grapesjs-mjml's renderStyle() only applies CSS to the component's DOM
      // element for properties listed in the `stylable` array.  'width' is NOT
      // in mj-text's default stylable list, so width changes had no visual
      // effect.  Adding it here lets the canvas reflect per-item width when a
      // mj-text sits inside a row-frame-column.
      const mjTextType = editor.Components.getType("mj-text");
      if (mjTextType) {
        const existingStylable =
          mjTextType.model.prototype.defaults.stylable || [];
        if (!existingStylable.includes("width")) {
          editor.Components.addType("mj-text", {
            model: {
              defaults: {
                stylable: [...existingStylable, "width", "max-width"]
              }
            }
          });
        }
      }

      const patchInstance = (comp) => {
        const type = comp.get("type");
        const inFrame =
          COLUMN_VALID_CHILDREN.includes(type) && isInsideFrame(comp);
        const isSignature =
          comp.getAttributes?.()?.["data-type"] === "signature-section";

        comp.set({
          droppable: resolveDroppable(comp),
          draggable: !inFrame && !isSignature
        });

        if (type === "mj-section") {
          comp.addAttributes({ padding: "20px", margin: "0px" });
        }

        if (type === "mj-column") {
          const parentDt = comp.parent()?.getAttributes?.()?.["data-type"];
          // Column-frame columns are managed by reconcileFramePlaceholders.
          if (parentDt !== "column-frame-section") {
            comp.addAttributes({
              padding: "0px",
              margin: "0px",
              width: "100%"
            });
          } else {
            comp.addAttributes({ padding: "0px", margin: "0px" });
          }
        }

        comp.components().each(patchInstance);
      };
      patchInstance(editor.getWrapper());
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Fix invalid MJML nesting AFTER the sorter places the component.
    // ─────────────────────────────────────────────────────────────────────────
    const pendingFixups = [];
    let fixupScheduled = false;

    // ── Frame placeholder reconciler (debounced) ──────────────────────────
    const isReconciling = { current: false };
    let reconcileTimer = null;
    const scheduleReconcile = () => {
      if (reconcileTimer) return;
      reconcileTimer = setTimeout(() => {
        reconcileTimer = null;
        reconcileFramePlaceholders(editor, isReconciling);
      }, 0);
    };

    // ── Signature-section reconciler ──────────────────────────────────────────
    // Ensures the "Add Signature" section is always present at the bottom
    // whenever there is real content, and absent when the canvas is empty.
    // Set suppressSigReconcile = true before calling setComponents() during
    // a template import so the reconciler does not add a signature mid-load.
    const suppressSigReconcile = { current: false };
    const isEnsuringSig = { current: false };
    let sigTimer = null;
    const scheduleSignatureReconcile = () => {
      if (suppressSigReconcile.current) return;
      if (sigTimer) clearTimeout(sigTimer);
      sigTimer = setTimeout(() => {
        sigTimer = null;
        if (isEnsuringSig.current) return;
        isEnsuringSig.current = true;
        try {
          const wrapper = editor.getWrapper();
          if (!wrapper) return;
          let mjBody = null;
          const findBody = (comp) => {
            if (mjBody) return;
            if (comp.get("type") === "mj-body") {
              mjBody = comp;
              return;
            }
            comp.components().each(findBody);
          };
          findBody(wrapper);
          if (!mjBody) return;

          let existingSig = null;
          const realSections = [];
          mjBody.components().each((c) => {
            if (c.get("type") === "textnode") return;
            if (c.getAttributes()?.["data-type"] === "signature-section") {
              existingSig = c;
            } else {
              realSections.push(c);
            }
          });

          if (realSections.length === 0 && !existingSig) {
            return;
          }

          // Real content exists — sig must be the last child
          const allNonText = [];
          mjBody.components().each((c) => {
            if (c.get("type") !== "textnode") allNonText.push(c);
          });
          const lastComp = allNonText[allNonText.length - 1];

          if (!existingSig) {
            mjBody.append(SIGNATURE_SECTION_HTML);
          } else if (lastComp !== existingSig) {
            // Sig exists but is not last — move it to the end
            mjBody.append(existingSig);
          }
        } finally {
          isEnsuringSig.current = false;
        }
      }, 50);
    };

    const processPendingFixups = () => {
      fixupScheduled = false;
      const items = pendingFixups.splice(0, pendingFixups.length);

      const itemCids = new Set(items.map((c) => c.cid));
      const topLevel = items.filter((comp) => {
        let p = comp.parent();
        while (p) {
          if (itemCids.has(p.cid)) return false;
          p = p.parent();
        }
        return true;
      });

      isUnwrapping.current = true;
      try {
        topLevel.forEach((component) => {
          if (!component.parent()) return;

          const type = component.get("type");
          const parent = component.parent();
          if (!parent) return;
          const parentType = parent.get("type");

          // ── Case 0: Deep nesting inside a frame ──────────────────
          // If a section is dropped inside a frame but not directly into
          // its primary container (e.g. dropped inside an mj-text),
          // we force unwrap it into the frame's container.
          const frameContainer = findNearestFrame(component);
          if (
            type === "mj-section" &&
            frameContainer &&
            parent !== frameContainer
          ) {
            // EXEMPT: If it's a Column Frame, move it to the root of the frame container but do NOT unwrap it.
            // HOWEVER, if the parent is already an mj-column (part of a frame), we want to RETAIN that nesting
            // for multi-level recursive structures.
            if (
              component.getAttributes()?.["data-type"] ===
              "column-frame-section"
            ) {
              if (parentType === "mj-column") {
                return; // Stay where you are (in the column)
              }
              // Wrap in mj-column so it participates in side-by-side balancing
              const newCol = frameContainer
                .components()
                .add(
                  `<mj-column padding="0px" margin="0px" width="100%"></mj-column>`
                );
              newCol.append(component);
              return;
            }

            const fcType = frameContainer.get("type");
            const fcDt = frameContainer.getAttributes?.()["data-type"];

            if (fcType === "mj-column") {
              const fcDt = frameContainer.getAttributes?.()["data-type"];

              // SMART TARGETING for Case 0: If we are deep-nested, we might want
              // to snap to the Column Frame instead of the Row Frame if we are dropping a section.
              if (
                fcDt === "row-frame-column" &&
                isInsideColumnFrame(frameContainer)
              ) {
                const columnFrame = findNearestColumnFrame(frameContainer);
                if (columnFrame) {
                  columnFrame.append(component);
                  return;
                }
              }

              // Target is row-frame-column or similar
              const leaves = collectLeafContent(component);
              clearFramePlaceholder(frameContainer);
              leaves.forEach((leaf) => frameContainer.append(leaf.clone()));
              component.remove();
              return;
            } else if (fcDt === "column-frame-section") {
              // Target is column-frame-section
              const innerCols = [];
              const directContent = [];
              component.components().each((c) => {
                if (c.get("type") === "mj-column") innerCols.push(c.clone());
                else directContent.push(c.clone());
              });
              innerCols.forEach((col) => frameContainer.append(col));
              if (directContent.length > 0) {
                const newCol = frameContainer
                  .components()
                  .add(
                    `<mj-column padding="0px" margin="0px" width="100%"></mj-column>`
                  );
                directContent.forEach((c) => newCol.append(c));
              }
              component.remove();
              return;
            }
          }

          // ── Case 1: mj-section landed inside mj-column ───────────
          if (type === "mj-section" && parentType === "mj-column") {
            // EXEMPT: If it's a Column Frame, allow it to stay inside the column (useful for nesting in row-frames)
            if (
              component.getAttributes()?.["data-type"] ===
              "column-frame-section"
            ) {
              return;
            }

            const leaves = collectLeafContent(component);
            clearFramePlaceholder(parent);
            leaves.forEach((leaf) => parent.append(leaf.clone()));
            component.remove();
            return;
          }

          // ── Case 2: mj-section inside another mj-section ─────────
          if (type === "mj-section" && parentType === "mj-section") {
            // EXEMPT: If it's a Column Frame, allow it to stay inside the section (useful for nesting)
            // Wrap in mj-column so it participates in side-by-side balancing
            if (
              component.getAttributes()?.["data-type"] ===
              "column-frame-section"
            ) {
              const newCol = parent
                .components()
                .add(
                  `<mj-column padding="0px" margin="0px" width="100%"></mj-column>`
                );
              newCol.append(component);
              return;
            }

            const innerCols = [];
            const directContent = [];
            component.components().each((c) => {
              if (c.get("type") === "mj-column") innerCols.push(c.clone());
              else directContent.push(c.clone());
            });
            innerCols.forEach((col) => parent.append(col));
            if (directContent.length > 0) {
              const newCol = parent
                .components()
                .add(
                  `<mj-column padding="0px" margin="0px" width="100%"></mj-column>`
                );
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
              .add(
                `<mj-column padding="0px" margin="0px" width="100%"></mj-column>`,
                { at: idx }
              );
            newCol.addAttributes({
              padding: "0px",
              margin: "0px",
              width: "100%"
            });
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
              .add(
                `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%"></mj-section>`,
                { at: idx }
              );
            newSection.addAttributes({
              padding: "0px",
              margin: "0px",
              width: "100%",
              "full-width": "full-width"
            });
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
              .add(
                `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%"></mj-section>`,
                { at: idx }
              );
            newSection.addAttributes({
              padding: "0px",
              margin: "0px",
              width: "100%",
              "full-width": "full-width"
            });
            const newCol = newSection
              .components()
              .add(
                `<mj-column padding="0px" margin="0px" width="100%"></mj-column>`
              );
            newCol.addAttributes({
              padding: "0px",
              margin: "0px",
              width: "100%"
            });
            newCol.append(cloned);
          }
        });
      } finally {
        isUnwrapping.current = false;
        scheduleReconcile(); // Ensure placeholders are updated after all fixups
        scheduleSignatureReconcile(); // Ensure signature section stays at bottom

        // Re-evaluate draggability: content blocks inside frames must not be
        // draggable; the fixup just moved them there so update them now.
        const reconcileDraggability = (comp) => {
          try {
            const type = comp.get("type");
            if (type && type !== "textnode" && type !== "text") {
              const inFrame =
                COLUMN_VALID_CHILDREN.includes(type) && isInsideFrame(comp);
              const isSignature =
                comp.getAttributes?.()?.["data-type"] === "signature-section";

              comp.set({
                draggable: !inFrame && !isSignature,
                droppable: resolveDroppable(comp)
              });
            }
            comp.components().each(reconcileDraggability);
          } catch {
            /* skip destroyed */
          }
        };
        reconcileDraggability(editor.getWrapper());
      }
    };

    editor.on("component:add", (comp) => {
      const type = comp.get("type");

      // Skip processing for the signature section — it's managed by the reconciler
      if (comp.getAttributes()?.["data-type"] === "signature-section") {
        comp.set({ draggable: false, droppable: false });
        return;
      }

      // Trigger signature reconcile so it stays at the bottom
      if (type === "mj-section" && comp.parent()?.get("type") === "mj-body") {
        scheduleSignatureReconcile();
      }

      // Auto-remove placeholder when something is added to its container
      if (
        comp.getAttributes()["data-type"] !== "frame-placeholder-ui" &&
        type !== "textnode" &&
        type !== "text"
      ) {
        let container = comp.parent();
        while (container) {
          const containerType = container.getAttributes()["data-type"];
          if (
            containerType === "row-frame-column" ||
            containerType === "column-frame-column" ||
            containerType === "column-frame-section"
          ) {
            clearFramePlaceholder(container);
            break;
          } else if (container.get("type") === "mj-column") {
            const placeholder = container
              .components()
              .find(
                (c) =>
                  c.getAttributes()["data-type"] === "frame-placeholder-ui" &&
                  c !== comp
              );
            if (placeholder) {
              placeholder.remove();
              break;
            }
          }
          container = container.parent();
        }

        // Schedule a full reconcile to catch cases where the parent chain
        // traversal above misses the frame column (e.g. section-in-section fixups)
        scheduleReconcile();
      }

      if (type && type !== "textnode" && type !== "text") {
        // Draggability for content blocks depends on whether they land inside a
        // frame. At this point the fixup hasn't run yet (it's async), so we
        // optimistically allow dragging and reconcile after fixups complete.
        comp.set({ droppable: resolveDroppable(comp), draggable: true });

        if (type === "mj-section") {
          comp.addAttributes({ padding: "20px", margin: "0px" });
        }

        if (type === "mj-column") {
          const parentDt = comp.parent()?.getAttributes?.()?.["data-type"];
          if (parentDt !== "column-frame-section") {
            comp.addAttributes({
              padding: "0px",
              margin: "0px",
              width: "100%"
            });
          } else {
            comp.addAttributes({ padding: "0px", margin: "0px" });
          }
        }
      }

      if (isUnwrapping.current) return;

      if (type && type !== "textnode" && type !== "text") {
        pendingFixups.push(comp);
        if (!fixupScheduled) {
          fixupScheduled = true;
          setTimeout(processPendingFixups, 0);
        }
      }
    });

    // Restore placeholder when a frame column becomes empty after a removal
    editor.on("component:remove", (comp) => {
      const dt = comp.getAttributes()?.["data-type"];
      if (dt !== "frame-placeholder-ui") {
        scheduleReconcile();
        // Don't re-trigger sig reconcile when the sig itself is being removed
        if (dt !== "signature-section") {
          scheduleSignatureReconcile();
        }
      }

      // Recursive cleanup of empty parents (mj-section, mj-column)
      // This prevents empty wrapper sections from lingering when their content is deleted.
      if (isUnwrapping.current) return;

      const parent = comp.parent();
      if (parent) {
        const type = parent.get("type");
        const parentDt = parent.getAttributes?.()["data-type"];

        // Only cleanup regular mj-column and mj-section containers that are now empty.
        // We skip body, frames, signature-section, etc.
        if (
          (type === "mj-column" || type === "mj-section") &&
          !parentDt &&
          parent.components().length === 0
        ) {
          parent.remove();
        }
      }
    });

    editor.on("component:update", () => {
      scheduleReconcile();
    });

    registerBlocks(editor);
    editor.setComponents(EMPTY_TEMPLATE);

    // ── Restrict nested block drops to column-frame / row-frame only ────────────
    // Any block may be dropped at the top level (direct child of mj-body), which
    // creates a new main section in the editor. However, when a block is dropped
    // NESTED inside an existing section, it is only permitted inside a
    // column-frame-section or row-frame-column container. Drops nested inside any
    // other kind of section are immediately removed.
    editor.on("block:drag:stop", (component) => {
      if (!component) return;
      const parentType = component.parent()?.get?.("type");
      // Top-level drop (direct child of mj-body) — always allowed.
      if (parentType === "mj-body") return;
      // Nested inside a column-frame or row-frame — allowed.
      if (isInsideFrame(component)) return;
      // Nested inside any other section — reject.
      component.remove();
    });

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

    // ── Upload icon SVG (shared between attachment block and restore logic) ───
    const uploadIconSvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#F2F4F7"/><path d="M25.333 16l-6.012 7.155a1.667 1.667 0 1 0 2.358 2.357l7.011-7.155a3.333 3.333 0 1 0-4.714-4.714l-7.012 7.126a5 5 0 0 0 7.071 7.071L30.047 20.714" stroke="#555F75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      );

    // ── Helper: restore empty attachment placeholder on a section ─────────────
    const restoreAttachmentPlaceholder = (section) => {
      section.addAttributes({
        "data-type": "attachment-placeholder",
        border: "2px dashed #00A3FF",
        padding: "0px 0px"
      });
      section.components(`
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-text align="center" padding="0px" margin="0px">
            <div class="attachment-click-area" style="display:inline-flex;flex-direction:column;align-items:center;gap:8px;width:fit-content;margin:0 auto;cursor:pointer;">
              <img src="${uploadIconSvg}" width="40" height="40" style="display:block;" />
              <span style="font-size:16px;font-weight:500;color:#404B5A;font-family:Inter,sans-serif;">Upload Attachment</span>
              <span style="font-size:12px;color:#98A2B3;font-family:Inter,sans-serif;">Click to browse files</span>
            </div>
          </mj-text>
        </mj-column>
      `);
      editor.trigger("component:update", section);
    };

    // Track which body elements already have our listeners to prevent
    // duplicate registration if the "load" event fires more than once.
    const attachedBodies = new WeakSet();

    editor.on("load", () => {
      // ── Custom RTE Configuration ───────────────────────────────────────────
      const rte = editor.RichTextEditor;

      // Clear standard link action to avoid collision with built-in behavior
      rte.remove("link");

      const linkIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3.9 12c0-1.7 1.4-3.1 3.1-3.1h4V7H7c-2.8 0-5 2.2-5 5s2.2 5 5 5h4v-1.9H7c-1.7 0-3.1-1.4-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.7 0 3.1 1.4 3.1 3.1s-1.4 3.1-3.1 3.1h-4V17h4c2.8 0 5-2.2 5-5s-2.2-5-5-5z"></path></svg>`;

      rte.add("link", {
        icon: linkIcon,
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

          // Immediately replace the selected text with a placeholder <span>
          // so the insertion point is a real DOM node that survives React
          // re-renders and GrapesJS model syncs triggered by opening the modal.
          if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const placeholder = doc.createElement("span");
            placeholder.id = "gjs-link-placeholder";
            placeholder.textContent = plainText || "";
            range.insertNode(placeholder);
          }

          setLinkModalText(plainText || "");
          setLinkModalUrl("");
          currentRteRef.current = rteInstance;
          setIsLinkModalOpen(true);
        }
      });

      // Restore other common actions
      rte.add("bold", {
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.6 11.8c1 .7 1.6 1.8 1.6 3.2 0 2.8-2.2 5-5 5H6V4h5.5c2.5 0 4.5 2 4.5 4.5 0 1.4-.6 2.6-1.6 3.3zM10.5 7.5H8.5v3h2c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5zm1 6.5h-3v3h3c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5z"></path></svg>`,
        result: (rteInstance) => rteInstance.exec("bold")
      });
      rte.add("italic", {
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 5v3h2.2l-3.4 8H6v3h8v-3h-2.2l3.4-8H18V5z"></path></svg>`,
        result: (rteInstance) => rteInstance.exec("italic")
      });
      rte.add("underline", {
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 17c3.3 0 6-2.7 6-6V3h-2.5v8c0 1.9-1.6 3.5-3.5 3.5S8.5 12.9 8.5 11V3H6v8c0 3.3 2.7 6 6 6zm-7 2v2h14v-2H5z"></path></svg>`,
        result: (rteInstance) => rteInstance.exec("underline")
      });
      rte.add("strikethrough", {
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5l1 1v3h1.4l1.4 1.4L15 8.9V7.6l1-1V4H5zM2 11v2h20v-2H2z"></path></svg>`,
        result: (rteInstance) => rteInstance.exec("strikethrough")
      });

      rte.add("case-toggle", {
        icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 12L4.52925 4.7325C4.55773 4.66418 4.6058 4.60581 4.66739 4.56476C4.72899 4.52371 4.80135 4.5018 4.87538 4.5018C4.9494 4.5018 5.02176 4.52371 5.08336 4.56476C5.14495 4.60581 5.19302 4.66418 5.2215 4.7325L8.25 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 6.75V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.47803 9.75H7.27203" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.875 12C15.3247 12 16.5 10.8247 16.5 9.375C16.5 7.92525 15.3247 6.75 13.875 6.75C12.4253 6.75 11.25 7.92525 11.25 9.375C11.25 10.8247 12.4253 12 13.875 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        attributes: { title: "Toggle Case" },
        result: (rteInstance) => {
          const selection = rteInstance.selection();
          if (!selection) return;
          const plainText =
            typeof selection === "string"
              ? selection.replace(/<[^>]*>/g, "")
              : selection.toString
                ? selection.toString()
                : "";
          const isAllUpper = plainText === plainText.toUpperCase();
          const toggled = isAllUpper
            ? selection.toLowerCase()
            : selection.toUpperCase();
          rteInstance.insertHTML(toggled);
        }
      });

      const body = editor.Canvas.getBody();
      if (attachedBodies.has(body)) return;
      attachedBodies.add(body);

      // ── Canvas click handler ───────────────────────────────────────────────
      body.addEventListener("click", (e) => {
        // ── Image upload area click ───────────────────────────────────────
        if (e.target.closest(".image-click-area")) {
          const allColumns = [];
          const collectCols = (comp) => {
            if (comp.get("type") === "mj-column") allColumns.push(comp);
            comp.components().each(collectCols);
          };
          collectCols(editor.getWrapper());
          const clickedColumn = allColumns.find((col) => {
            try {
              const view = col.getView?.();
              return view?.el?.contains?.(e.target);
            } catch {
              return false;
            }
          });
          if (clickedColumn) {
            editor.select(clickedColumn);
            imageTargetCompRef.current = clickedColumn;
          }
          imageInputRef.current?.click();
          return;
        }

        // ── Attachment upload area click ──────────────────────────────────
        if (e.target.closest(".attachment-click-area")) {
          fileInputRef.current?.click();
          return;
        }

        // ── Remove file icon click ────────────────────────────────────────
        if (e.target.classList.contains("remove-file-icon")) {
          const allColumns = [];
          const collectColumns = (comp) => {
            if (comp.get("type") === "mj-column") allColumns.push(comp);
            comp.components().each(collectColumns);
          };
          collectColumns(editor.getWrapper());

          const targetColumn = allColumns.find((col) => {
            try {
              const view = col.getView?.();
              return view?.el?.contains?.(e.target);
            } catch {
              return false;
            }
          });

          if (!targetColumn) return;

          const parentSection = targetColumn.parent();
          targetColumn.remove();

          if (parentSection && parentSection.components().length === 0) {
            const grandParent = parentSection.parent();
            parentSection.remove();

            if (grandParent) {
              const hasAttachments = grandParent
                .components()
                .some(
                  (c) => c.getAttributes()["data-type"] === "attachment-filled"
                );
              if (!hasAttachments) {
                restoreAttachmentPlaceholder(
                  grandParent
                    .components()
                    .add(
                      `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%" background-color="transparent"></mj-section>`
                    )
                );
              }
            }
          }

          return;
        }
      });

      // ── Handle external drop of placeholders ──────────────────────────────
      body.addEventListener("dragover", (e) => {
        if (e.target.isContentEditable) return;
        const textData = e.dataTransfer.types.includes("text/plain");
        if (textData) {
          let targetEl =
            e.target.closest && e.target.closest("[data-gjs-type]");
          let comp =
            targetEl && targetEl.id
              ? editor.Components.getWrapper().find("#" + targetEl.id)[0]
              : null;
          if (comp) {
            let current = comp;
            while (current && current.get("type") !== "mj-text") {
              current = current.parent();
            }
            if (current && current.get("type") === "mj-text") {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            } else {
              let container = comp;
              while (
                container &&
                !["mj-column", "mj-section", "mj-body"].includes(
                  container.get("type")
                )
              ) {
                container = container.parent();
              }
              if (container) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }
            }
          }
        }
      });

      body.addEventListener("drop", (e) => {
        if (e.target.isContentEditable) return;
        const text = e.dataTransfer.getData("text/plain");
        if (text && text.trim().startsWith("$")) {
          let targetEl =
            e.target.closest && e.target.closest("[data-gjs-type]");
          let comp =
            targetEl && targetEl.id
              ? editor.Components.getWrapper().find("#" + targetEl.id)[0]
              : null;
          if (comp) {
            let current = comp;
            while (current && current.get("type") !== "mj-text") {
              current = current.parent();
            }
            if (current && current.get("type") === "mj-text") {
              if (
                current.getAttributes()["data-type"] === "frame-placeholder-ui"
              ) {
                let container = current.parent();
                current.remove();
                if (container) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  container.append(
                    `<mj-text padding="0px" margin="0px">${text}</mj-text>`
                  );
                }
              } else {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                const content = current.get("content") || "";
                current.set("content", content + (content ? " " : "") + text);
                editor.trigger("component:update", current);
              }
            } else {
              let container = comp;
              while (
                container &&
                !["mj-column", "mj-section", "mj-body"].includes(
                  container.get("type")
                )
              ) {
                container = container.parent();
              }
              if (container) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";

                clearFramePlaceholder(container);

                container.append(
                  `<mj-text padding="0px" margin="0px">${text}</mj-text>`
                );
              }
            }
          }
        }
      });

      // ── Handle paste to clean up styles ──────────────────────────────────
      body.addEventListener("paste", (e) => {
        const html = e.clipboardData.getData("text/html");
        if (html) {
          e.preventDefault();
          const doc = new DOMParser().parseFromString(html, "text/html");

          const cleanNode = (node) => {
            if (node.nodeType === 1) {
              // Element node
              node.style.removeProperty("color");
              node.style.removeProperty("font-family");
              node.style.removeProperty("font-size");
              node.style.color = "";
              node.style.fontFamily = "";
              node.style.fontSize = "";

              if (node.hasAttribute("color")) node.removeAttribute("color");
              if (node.hasAttribute("face")) node.removeAttribute("face");
              if (node.hasAttribute("size")) node.removeAttribute("size");

              Array.from(node.childNodes).forEach(cleanNode);
            }
          };

          Array.from(doc.body.childNodes).forEach(cleanNode);
          const cleanHtml = doc.body.innerHTML;
          editor.Canvas.getWindow().document.execCommand(
            "insertHTML",
            false,
            cleanHtml
          );
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
        const supportedTypes = [
          "mj-section",
          "mj-hero",
          "mj-wrapper",
          "mj-body",
          "mj-column",
          "mj-image",
          "mj-button",
          "mj-text"
        ];
        if (!supportedTypes.includes(type)) return;

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

        if (style["width"]) attributes["width"] = style["width"];
        if (style["height"]) attributes["height"] = style["height"];

        if (style["padding-top"])
          attributes["padding-top"] = style["padding-top"];
        if (style["padding-right"])
          attributes["padding-right"] = style["padding-right"];
        if (style["padding-bottom"])
          attributes["padding-bottom"] = style["padding-bottom"];
        if (style["padding-left"])
          attributes["padding-left"] = style["padding-left"];
        if (style["padding"]) attributes["padding"] = style["padding"];

        if (style["border"]) attributes["border"] = style["border"];
        if (style["border-radius"])
          attributes["border-radius"] = style["border-radius"];

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
        getCompiledHtml: getCompiledHtmlFromCanvas,
        /**
         * Load a full MJML string into the editor, replacing all current
         * content. The signature-section reconciler is suppressed during the
         * load and re-enabled immediately after so the import does not
         * accidentally inject a signature mid-parse.
         */
        loadTemplate: (mjmlString) => {
          suppressSigReconcile.current = true;
          try {
            editor.setComponents(mjmlString);
          } finally {
            // Re-enable after a short delay so any in-flight timers from
            // setComponents() have already been skipped.
            setTimeout(() => {
              suppressSigReconcile.current = false;
            }, 200);
          }
        }
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

  // ── Unselect on outside click ──────────────────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const editor = gjsInstance.current;
      if (!editor) return;

      const safeSelectors = [
        ".editorArea",
        ".rightPanel",
        ".leftPanel",
        ".placeholderSection",
        ".reusable-modal",
        ".gjs-mdl-container",
        ".sp-container"
      ];

      const isSafe = safeSelectors.some((sel) => e.target.closest(sel));

      if (!isSafe) {
        editor.select(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <>
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

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          // Restore the placeholder back to a plain text node on cancel
          if (currentRteRef.current?.el) {
            const doc = currentRteRef.current.el.ownerDocument;
            const placeholder = doc.getElementById("gjs-link-placeholder");
            if (placeholder) {
              const textNode = doc.createTextNode(placeholder.textContent);
              placeholder.parentNode.replaceChild(textNode, placeholder);
            }
          }
          savedRangeRef.current = null;
          setIsLinkModalOpen(false);
        }}
        onConfirm={handleToolbarLinkConfirm}
        formName={linkModalText}
        setFormName={setLinkModalText}
        linkValue={linkModalUrl}
        setLinkValue={setLinkModalUrl}
        title="Add Link"
        textLabel="Link Text"
      />
    </>
  );
}

function registerBlocks(editor) {
  const bm = editor.BlockManager;
  if (bm.getAll) bm.getAll().reset();

  // ── Frame blocks ──────────────────────────────────────────────────────────
  bm.add("row", {
    label: "Frame - Row",
    category: "Blocks",
    content: `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%">
      <mj-column data-type="row-frame-column" data-is-empty="true" padding="0px" margin="0px" width="100%">
      </mj-column>
    </mj-section>`
  });

  bm.add("column", {
    label: "Frame - Column",
    category: "Blocks",
    content: `<mj-section data-type="column-frame-section" data-is-empty="true" full-width="full-width" padding="0px" margin="0px" width="100%" background-color="transparent">
    </mj-section>`
  });

  // ── Content blocks ────────────────────────────────────────────────────────
  bm.add("heading", {
    label: "Heading",
    category: "Content",
    content: `<mj-section full-width="full-width" padding="16px" margin="0px" width="100%">
      <mj-column padding="0px" margin="0px" width="100%">
        <mj-text font-family="Inter" font-size="32px" font-weight="600" color="#404B5A" align="center" line-height="42px" padding="0px" margin="0px">
          Title goes here
        </mj-text>
      </mj-column>
    </mj-section>`
  });

  bm.add("paragraph", {
    label: "Paragraph",
    category: "Content",
    content: `<mj-section full-width="full-width" padding="16px" margin="0px" width="100%">
      <mj-column padding="0px" margin="0px" width="100%">
        <mj-text font-size="14px" color="#555555" line-height="1.6" padding="0px" margin="0px">
          Paragraph content
        </mj-text>
      </mj-column>
    </mj-section>`
  });

  bm.add("image", {
    label: "Image",
    category: "Content",
    content: `<mj-section full-width="full-width" padding="16px" margin="0px" width="100%">
      <mj-column padding="0px" margin="0px" width="100%" >
        <mj-text padding="0px" margin="0px">
          <div class="image-click-area" style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:6px; width:100% !important;margin:0 auto;cursor:pointer; height: 116px; background-color:#F6F7F9; border-radius: 8px; border: 1px dashed #1570EF;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16 5H22" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 2V8" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 11.5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12.5" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 14.9999L17.914 11.9139C17.5389 11.539 17.0303 11.3284 16.5 11.3284C15.9697 11.3284 15.4611 11.539 15.086 11.9139L6 20.9999" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 11C10.1046 11 11 10.1046 11 9C11 7.89543 10.1046 7 9 7C7.89543 7 7 7.89543 7 9C7 10.1046 7.89543 11 9 11Z" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span style="font-size:14px;font-weight:500;color:#4D5761;font-family:Inter;">Add Image</span>
          </div>
        </mj-text>
      </mj-column>
    </mj-section>`
  });

  bm.add("button", {
    label: "Button",
    category: "Content",
    content: `<mj-section full-width="full-width" padding="16px" margin="0px" width="100%">
      <mj-column padding="0px" margin="0px" width="100%">
        <mj-button background-color="#295E3F" color="#ffffff" border-radius="8px" padding="0px" margin="0px" width="fit-content" font-family="Inter" font-size="14px" font-weight="500" line-height="20px" align="center">
          Click Here
        </mj-button>
      </mj-column>
    </mj-section>`
  });

  bm.add("divider", {
    label: "Divider",
    category: "Content",
    content: `<mj-section full-width="full-width" padding="16px" margin="0px" width="100%">
      <mj-column padding="0px" margin="0px" width="100%">
        <mj-divider border-color="#dddddd" border-width="1px" padding="0px" margin="0px" />
      </mj-column>
    </mj-section>`
  });

  bm.add("Attachment", {
    label: "Attachment",
    category: "Content",
    content: `
      <mj-section full-width="full-width" data-type="attachment-placeholder" border="2px dashed #1570EF" padding="16px" margin="0px" width="100%" background-color="transparent" align="center" justify="center">
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-text align="center" padding="10px" margin="0px">
            <div class="attachment-click-area" style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;width:fit-content;margin:0 auto;cursor:pointer;">
             <svg xmlns="http://www.w3.org/2000/svg" width="19" height="21" viewBox="0 0 19 21" fill="none">
  <path d="M12.112 4.9902L5.61201 11.4902C5.21418 11.888 4.99069 12.4276 4.99069 12.9902C4.99069 13.5528 5.21418 14.0924 5.61201 14.4902C6.00983 14.888 6.5494 15.1115 7.11201 15.1115C7.67462 15.1115 8.21418 14.888 8.61201 14.4902L15.112 7.9902C15.9077 7.19455 16.3546 6.11542 16.3546 4.9902C16.3546 3.86498 15.9077 2.78585 15.112 1.9902C14.3164 1.19455 13.2372 0.747559 12.112 0.747559C10.9868 0.747559 9.90766 1.19455 9.11201 1.9902L2.61201 8.4902C1.41853 9.68367 0.748047 11.3024 0.748047 12.9902C0.748047 14.678 1.41853 16.2967 2.61201 17.4902C3.80548 18.6837 5.42418 19.3542 7.11201 19.3542C8.79984 19.3542 10.4185 18.6837 11.612 17.4902L18.112 10.9902" stroke="#555F75" stroke-width="1.495" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
              <span style="font-size:14px;font-weight:500;color:#4D5761;font-family:Inter,sans-serif;">Upload Attachment</span>
            </div>
          </mj-text>
        </mj-column>
      </mj-section>`
  });

  // ── Component blocks ──────────────────────────────────────────────────────
  bm.add("custom-header", {
    label: "Header Banner",
    category: "Components",
    content: `
      <mj-section full-width="full-width" padding="0px" margin="0px" width="100%" background-color="#2f6f4e">
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-text align="center" color="#ffffff" font-size="24px" font-weight="bold" padding="0px" margin="0px">
            Your Header Here
          </mj-text>
        </mj-column>
      </mj-section>`
  });

  bm.add("custom-text-block", {
    label: "Text Block",
    category: "Components",
    content: `
      <mj-section full-width="full-width" background-color="transparent" padding="0px" margin="0px" width="100%">
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-text font-size="14px" color="#555555" line-height="1.6" padding="0px" margin="0px">
            Add your content here. This is a paragraph of text.
          </mj-text>
        </mj-column>
      </mj-section>`
  });

  bm.add("custom-button-block", {
    label: "CTA Button",
    category: "Components",
    content: `
      <mj-section full-width="full-width" padding="0px" margin="0px" width="100%">
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-button background-color="#2f6f4e" color="#ffffff" border-radius="6px" font-size="14px" width="100%" padding="0px" margin="0px" href="#">
            Click Here
          </mj-button>
        </mj-column>
      </mj-section>`
  });

  bm.add("custom-image-block", {
    label: "Image Section",
    category: "Components",
    content: `
      <mj-section full-width="full-width" background-color="#000000" padding="0px" margin="0px" width="100%">
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-image src="${uploadImage}" padding="0px" margin="0px" width="100%" align="center" />
          <mj-text font-size="14px" color="#555555" line-height="1.6" padding="0px" margin="0px">
            Add Image.
          </mj-text>
        </mj-column>
      </mj-section>`
  });
}
