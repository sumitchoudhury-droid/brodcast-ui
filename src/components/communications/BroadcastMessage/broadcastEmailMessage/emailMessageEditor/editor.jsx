import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import ReactDOM from "react-dom";

import mjmlPlugin from "grapesjs-mjml";
import {
  uploadImageToServer,
  uploadAttachmentToServer
} from "../../../../../utils/uploadUtils";
import "grapesjs/dist/css/grapes.min.css";
import emptyTemplateIcon from "../../../../../assets/editor/emptyTemplate.svg";
import pdfIcon from "../../../../../assets/mainScreen/pdfImage.svg";
import uploadImage from "../../../../../assets/commonIcons/uploadImage.svg";

import underlineIcon from "../../../../../assets/textStyleIcons/underlineIcon.svg";
import italicIcon from "../../../../../assets/textStyleIcons/italicIcon.svg";
import strikethroughIcon from "../../../../../assets/textStyleIcons/strikethroughIcon.svg";
import highlightIcon from "../../../../../assets/textStyleIcons/highlightIcon.svg";
import codeIcon from "../../../../../assets/textStyleIcons/codeIcon.svg";
import subscriptIcon from "../../../../../assets/textStyleIcons/subscriptIcon.svg";
import superscriptIcon from "../../../../../assets/textStyleIcons/superscriptIcon.svg";
import linkIcon from "../../../../../assets/commonIcons/externalLinkIcon.svg";
import imgIcon from "../../../../../assets/commonIcons/imgIcon.svg";

import "../style.scss";
import "./style.scss";
import { useToast } from "../../../../../hooks/useToast";
import ReusableLinkModal from "../../../../../reusableComponents/reusableLinkModal/index";

const EMPTY_TEMPLATE = `
<mjml>
  <mj-head>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"></mj-font>
    <mj-font name="Roboto" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"></mj-font>
  </mj-head>
  <mj-body width="600px" background-color="transparent" padding="0px" margin="0px">

  </mj-body>
</mjml>
`.trim();

const SIGNATURE_SECTION_HTML = `<mj-section full-width="full-width" data-type="signature-section" padding="0px" padding-top="0px" padding-right="0px" padding-bottom="0px" padding-left="0px" margin="0px" width="100%" background-color="transparent">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text padding="16px" margin="0px" color="#181D25" font-size="16px" font-weight="500" font-family="Arial" line-height="20px">
      Add Signature
    </mj-text>
  </mj-column>
</mj-section>`;

// const UNSUBSCRIBE_SECTION_HTML = `<mj-section full-width="full-width" data-type="unsubscribe-section" padding="0px" margin="0px" width="100%" background-color="transparent">
//   <mj-column padding="0px" margin="0px" width="100%">
//     <mj-text padding="20px" margin="0px" color="#929FB1" font-size="14px" font-weight="400" font-family="Arial" line-height="20px" align="center">
//       Click here to unsubscribe: <a href="https://mh.care/stop" style="color:#929FB1; text-decoration:underline;">https://mh.care/stop</a>
//     </mj-text>
//   </mj-column>
// </mj-section>`;

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

// Check if a component sits inside the attachment block (mj-wrapper with
// data-type="attachment-filled"). Used to exempt attachment mj-columns from
// the generic padding/width overrides so they keep their 50% pair layout.
function isInsideAttachmentBlock(comp) {
  let ancestor = comp?.parent?.();
  while (ancestor) {
    try {
      if (ancestor.getAttributes?.()?.["data-type"] === "attachment-filled") {
        return true;
      }
    } catch {
      /* skip destroyed */
    }
    ancestor = ancestor.parent();
  }
  return false;
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
function resolveDroppable(comp, isHtml) {
  const type = comp.get("type");
  const dt = comp.getAttributes?.()?.["data-type"];
  const tagName = comp.get?.("tagName")?.toLowerCase?.();
  const depth = getFrameDepth(comp);

  if (type === "mj-body" || type === "wrapper" || tagName === "body")
    return true;

  if (isHtml) {
    if (type === "textnode" || type === "text") return false;

    // Custom user frames are always droppable
    if (dt === "column-frame-section" || dt === "row-frame-column") {
      return true;
    }

    // Allow dropping into any common HTML container so blocks can be placed
    // anywhere inside a saved HTML template (cells, divs, sections, etc.).
    const structuralContainers = [
      "table",
      "tbody",
      "thead",
      "tfoot",
      "tr",
      "td",
      "th",
      "div",
      "section",
      "main",
      "article",
      "header",
      "footer",
      "nav",
      "aside"
    ];
    if (tagName && structuralContainers.includes(tagName)) {
      return true;
    }
    return false;
  }

  // Level restriction function
  const checkNesting = (droppedModel) => {
    // If we are already at depth 3, we only allow content blocks (not frames)
    if (depth >= 3 && isFrameBlock(droppedModel)) {
      return false;
    }
    return true;
  };

  // Allow droppable for custom frames
  if (dt === "column-frame-section" || dt === "row-frame-column") {
    return (droppedModel) => checkNesting(droppedModel);
  }

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

  // Also support dropping into standard HTML container tags in selected templates
  if (["table", "tr", "td", "div", "section"].includes(tagName)) {
    return (droppedModel) => checkNesting(droppedModel);
  }

  // leaf types remain non-droppable to prevent accidental block nesting
  return type === "mj-body" || type === "wrapper";
}

// Scan every frame column and sync placeholder visibility via data-is-empty attribute
function reconcileFramePlaceholders(editor, isReconciling) {
  // After editor.destroy() the internal DomComponents is nulled but
  // getWrapper is still on the prototype — calling it throws. This
  // reconciler runs on a debounced setTimeout that can fire after unmount.
  if (
    isReconciling.current ||
    !editor ||
    !editor.DomComponents ||
    typeof editor.getWrapper !== "function"
  )
    return;
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
    // Always enforce equal widths (auto-equal is the current design).
    frameCols.forEach((col) => {
      const attrs = col.getAttributes() || {};
      if (attrs["data-type"] !== "column-frame-section") return;

      const columns = [];
      col.components().each((c) => {
        if (c.get("type") === "mj-column") columns.push(c);
      });

      const n = columns.length;
      if (n === 0) return;

      const equalWidth = `${(100 / n).toFixed(4)}%`;
      columns.forEach((c) => {
        const currentAttrs = c.getAttributes() || {};
        const needsWidth = currentAttrs["width"] !== equalWidth;
        const needsVAlign = !currentAttrs["vertical-align"];
        if (needsWidth || needsVAlign) {
          const toSet = {};
          if (needsWidth) toSet.width = equalWidth;
          if (needsVAlign) toSet["vertical-align"] = "top";
          c.addAttributes(toSet);
          // Each mj-column renders independently via grapesjs-mjml's
          // getTemplateFromMjml. addAttributes updates the model but the
          // view only picks up the new width when render() is called on
          // the column itself (not the parent section).
          const view = c.getView?.();
          if (view && typeof view.render === "function") {
            view.render();
          }
        }
      });

      const lastN = parseInt(attrs["data-column-count"] || "0", 10);
      if (n !== lastN) {
        col.addAttributes({ "data-column-count": n.toString() });
      }
    });
  } finally {
    isReconciling.current = false;
  }
}

export default function Editor({
  editorRef,
  onReady,
  setIsEditorEmpty,
  onDirtyChange,
  initialTemplate
}) {
  const toast = useToast();
  const containerRef = useRef(null);
  const gjsInstance = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const isUnwrapping = useRef(false);
  const imageTargetCompRef = useRef(null);
  const isHtmlTemplate = useRef(false);
  const attachmentUrlsRef = useRef([]);
  isHtmlTemplate.current = !!(
    initialTemplate &&
    !initialTemplate.includes("<mjml>") &&
    !initialTemplate.includes("<mj-body>")
  );

  // Link Modal state for toolbar Link icon
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalText, setLinkModalText] = useState("");
  const [linkModalUrl, setLinkModalUrl] = useState("");
  const currentRteRef = useRef(null);
  const currentCompRef = useRef(null);
  const currentRteContentRef = useRef(null); // innerHTML of rte.el at click time (with placeholder)
  const savedRangeRef = useRef(null);

  // Link Popup state for clicking existing links in canvas
  const [linkPopupData, setLinkPopupData] = useState({
    isOpen: false,
    top: 0,
    left: 0,
    text: "",
    url: "",
    el: null
  });

  const handleFileChange = async (e) => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
    const ALLOWED_EXTS = /\.(jpg|jpeg|png|pdf)$/i;
    const allFiles = Array.from(e.target.files);
    const files = allFiles.filter(
      (f) => ALLOWED_TYPES.includes(f.type) || ALLOWED_EXTS.test(f.name)
    );
    if (allFiles.length !== files.length) {
      toast.error("Only JPG, PNG, JPEG and PDF files are allowed.");
    }
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

    const uploadedAttachments = await Promise.all(
      files.map((file) => uploadAttachmentToServer(file))
    );

    uploadedAttachments.forEach((att) => {
      if (att?.publicUrl) attachmentUrlsRef.current.push(att);
    });

    const docIcon = `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#F2F4F7"/><path d="M12 12V28H28V18L22 12H12Z" fill="white" stroke="#2563EB" stroke-width="2"/><path d="M22 12V18H28" stroke="#2563EB" stroke-width="2"/><text x="13" y="24" fill="#2563EB" font-family="Arial" font-size="5" font-weight="bold">DOC</text></svg>'
    )}`;
    const closeIconSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="white" stroke="#D0D5DD"/><path d="M16 8L8 16M8 8L16 16" stroke="#667085" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    )}`;

    // Build a single attachment card as a nested <table> with only inline
    // styles. No flex/grid/CSS variables — safe for Outlook, Gmail, Apple Mail,
    // and every other email client. Kept identical between the HTML and MJML
    // paths so both render the same after send.
    const buildCardHtml = (file, uploadedAttachment) => {
      const sizeInBytes = file.size;
      const sizeDisplay =
        sizeInBytes < 1024 * 1024
          ? `${(sizeInBytes / 1024).toFixed(2)} KB`
          : `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
      const isDoc = /\.docx?$/i.test(file.name);
      const icon = isDoc ? docIcon : pdfIcon;
      const downloadUrl =
        uploadedAttachment?.publicUrl || URL.createObjectURL(file);
      const displayName =
        file.name.length > 28 ? file.name.substring(0, 25) + "..." : file.name;

      return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="attachment-container" style="width:100%;border-collapse:collapse;table-layout:fixed;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr>
          <td style="padding:0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #EAEDF2;border-radius:8px;">
              <tr>
                <td width="40" valign="middle" style="width:40px;padding:10px 0 10px 10px;">
                  <img src="${icon}" width="40" height="40" alt="" style="display:block;border:0;outline:none;text-decoration:none;" />
                </td>
                <td valign="middle" style="padding:10px;word-break:break-all;overflow:hidden;">
                  <p style="margin:0;padding:0;font-size:12px;font-weight:500;color:#181D25;font-family:Inter,sans-serif;line-height:18px;word-break:break-all;" title="${file.name}">${displayName}</p>
                  <p style="margin:4px 0 0 0;padding:0;font-size:12px;color:#929FB1;font-weight:500;font-family:Inter,sans-serif;line-height:18px;">${sizeDisplay}</p>
                </td>
                <td width="34" valign="middle" align="right" style="width:34px;padding:10px 10px 10px 0;">
                  <img src="${closeIconSvg}" class="remove-file-icon" width="24" height="24" alt="" style="display:block;cursor:pointer;border:0;outline:none;text-decoration:none;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 0 0 0;font-family:Inter,sans-serif;line-height:18px;">
            <span style="font-size:12px;color:#404B5A;font-family:Inter,sans-serif;line-height:18px;">Download using Link:&nbsp;</span>
            <a href="${downloadUrl}" download="${file.name}" style="font-size:12px;color:#1570EF;text-decoration:none;font-family:Inter,sans-serif;line-height:18px;word-break:break-all;">${downloadUrl}</a>
          </td>
        </tr>
      </table>`;
    };

    if (isHtmlTemplate.current) {
      // HTML template: 2-per-row <table> layout. Each item is a <td class="attachment-item">
      // so the existing remove-icon handler (which walks up to .attachment-item)
      // continues to work.
      const rows = [];
      for (let i = 0; i < files.length; i += 2) {
        const leftCard = buildCardHtml(files[i], uploadedAttachments[i]);
        const rightCard =
          i + 1 < files.length
            ? buildCardHtml(files[i + 1], uploadedAttachments[i + 1])
            : null;
        const rightCell = rightCard
          ? `<td class="attachment-item" valign="top" width="50%" style="width:50%;padding:8px;vertical-align:top;">${rightCard}</td>`
          : `<td valign="top" width="50%" style="width:50%;padding:8px;vertical-align:top;">&nbsp;</td>`;
        rows.push(
          `<tr>
            <td class="attachment-item" valign="top" width="50%" style="width:50%;padding:8px;vertical-align:top;">${leftCard}</td>
            ${rightCell}
          </tr>`
        );
      }
      const tableHtml = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="attachment-items-wrapper" style="width:100%;border-collapse:collapse;table-layout:fixed;">${rows.join("")}</table>`;

      editor.select(null);
      isUnwrapping.current = true;
      try {
        targetComp.components().reset();
        targetComp.set("content", "");
        targetComp.addAttributes({
          "data-type": "attachment-filled",
          style: "padding:20px 8px;margin:0px;width:100%;box-sizing:border-box;"
        });
        targetComp.components(tableHtml);

        const view = targetComp.getView?.();
        if (view && typeof view.render === "function") {
          view.render();
        } else {
          editor.trigger("component:update", targetComp);
        }
      } finally {
        isUnwrapping.current = false;
      }
    } else {
      // MJML template: wrap pairs of cards in mj-column width="50%" so MJML
      // emits proper responsive tables that stack on mobile in every email
      // client. mj-wrapper marks the entire block as attachment-filled.
      const mjSections = [];
      for (let i = 0; i < files.length; i += 2) {
        const leftCard = buildCardHtml(files[i], uploadedAttachments[i]);
        const rightCard =
          i + 1 < files.length
            ? buildCardHtml(files[i + 1], uploadedAttachments[i + 1])
            : null;

        const leftCol = `<mj-column width="50%" vertical-align="top" padding="0px" padding-top="0px" padding-right="0px" padding-bottom="0px" padding-left="0px">
          <mj-text padding="0px" width="100%">
            <div class="attachment-item">${leftCard}</div>
          </mj-text>
        </mj-column>`;

        const rightCol = rightCard
          ? `<mj-column width="50%" vertical-align="top" padding="0px" padding-top="0px" padding-right="0px" padding-bottom="0px" padding-left="0px">
              <mj-text padding="0px" width="100%">
                <div class="attachment-item">${rightCard}</div>
              </mj-text>
            </mj-column>`
          : `<mj-column width="50%" vertical-align="top" padding="0px" padding-top="0px" padding-right="0px" padding-bottom="0px" padding-left="0px">
              <mj-text padding="0px" width="100%"><div>&nbsp;</div></mj-text>
            </mj-column>`;

        mjSections.push(
          `<mj-section padding="0px" margin="0px" width="100%" direction="ltr" text-align="left">
            ${leftCol}
            ${rightCol}
          </mj-section>`
        );
      }

      const wrapperHtml = `<mj-wrapper padding="20px 8px" padding-top="20px" padding-right="8px" padding-bottom="20px" padding-left="8px" data-type="attachment-filled">${mjSections.join("")}</mj-wrapper>`;

      const parent = targetComp.parent();
      const idx = parent.components().indexOf(targetComp);

      editor.select(null);

      isUnwrapping.current = true;
      try {
        targetComp.remove();
        parent.components().add(wrapperHtml, { at: idx });
        editor.trigger("component:update", parent);
      } finally {
        isUnwrapping.current = false;
      }
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
      const dataUrl = await uploadImageToServer(file);
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
          // Case 1: An mj-image or standard HTML image is selected (or targeted) — update src and dimensions directly
          let target = targetFromRef || selected;
          while (
            target &&
            !target.is("mj-image") &&
            !target.is("image") &&
            target.get("type") !== "image" &&
            target.get("tagName") !== "img"
          ) {
            target = target.parent();
          }
          if (target) {
            target.set("src", dataUrl);

            const currentAttrs = target.getAttributes() || {};
            const currentStyle = target.getStyle() || {};

            let finalWidth = widthAttr;
            let finalHeight = heightAttr;

            // If the original image had a 100% width (making it full-width/responsive),
            // preserve it so it continues to span the entire column width perfectly!
            if (
              currentAttrs.width === "100%" ||
              currentStyle.width === "100%" ||
              currentAttrs.width === "100vw" ||
              currentStyle.width === "100vw"
            ) {
              finalWidth = "100%";
              finalHeight = "auto";
              if (target.is("image") || target.get("tagName") === "img") {
                target.setStyle({
                  ...currentStyle,
                  width: "100%",
                  height: "auto"
                });
              }
            } else {
              if (target.is("image") || target.get("tagName") === "img") {
                target.setStyle({
                  ...currentStyle,
                  width: widthAttr,
                  height: heightAttr
                });
              }
            }

            target.addAttributes({
              src: dataUrl,
              width: finalWidth,
              height: finalHeight
            });
            editor.trigger("component:update", target);
            editor.select(target);
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
                const added = column
                  .components()
                  .add(
                    `<mj-image src="${dataUrl}" padding="0px" margin="0px" width="${widthAttr}" height="${heightAttr}" align="center"></mj-image>`,
                    { at: index }
                  );
                const newComp = Array.isArray(added) ? added[0] : added;
                if (newComp) editor.select(newComp);
              } finally {
                isUnwrapping.current = false;
              }
            } else {
              // Fallback: append to column if placeholder not found
              column.append(
                `<mj-image src="${dataUrl}" padding="0px" margin="0px" width="${widthAttr}" height="${heightAttr}" align="center"></mj-image>`
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
                  const added = col
                    .components()
                    .add(
                      `<mj-image src="${dataUrl}" padding="0px" margin="0px" width="${widthAttr}" height="${heightAttr}" align="center"></mj-image>`,
                      { at: index }
                    );
                  const newComp = Array.isArray(added) ? added[0] : added;
                  if (newComp) editor.select(newComp);
                } finally {
                  isUnwrapping.current = false;
                }
              } else {
                // Fallback: replace whole column only if individual component look-up fails
                col.components().reset();
                const added = col.append(
                  `<mj-image src="${dataUrl}" padding="0px" margin="0px" width="${widthAttr}" height="${heightAttr}" align="center"></mj-image>`
                );
                const newComp = Array.isArray(added) ? added[0] : added;
                if (newComp) editor.select(newComp);
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

    const editor = gjsInstance.current;
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

    savedRangeRef.current = null;
    currentCompRef.current = null;
    currentRteContentRef.current = null;
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
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');
                html, body { margin: 0; min-height: 100%; width: 100%; overflow-x: hidden; font-family: Arial, sans-serif; }
                body {
                  min-height: 100%;
                  word-break: break-word;
                  overflow-wrap: break-word;
                }
                // [data-gjs-type] { min-height: 20px; }

                /* Remove focus border/outline on editable elements */
                [data-gjs-type]:focus,
                [contenteditable]:focus,
                [contenteditable="true"]:focus {
                  outline: none !important;
                  border: none !important;
                  box-shadow: none !important;
                }

                /* Placeholder text for empty heading/paragraph blocks — disappears when user starts typing */
                [data-placeholder]:empty::before,
                [data-placeholder].is-empty::before {
                  content: attr(data-placeholder);
                  color: #98A2B3;
                  pointer-events: none;
                  display: inline;
                  opacity: 1;
                }

                /* Allow native text selection inside text-editable blocks so
                   trackpad click-drag selects text instead of starting a
                   component drag. The user-select override defeats the
                   GrapesJS-wide 'user-select: none' that ships with grapes.min.css. */
                [data-gjs-type="mj-text"],
                [data-gjs-type="mj-text"] *,
                [data-gjs-type="mj-button"],
                [data-gjs-type="mj-button"] *,
                [data-placeholder],
                [data-placeholder] * {
                  -webkit-user-select: text !important;
                  -moz-user-select: text !important;
                  -ms-user-select: text !important;
                  user-select: text !important;
                  cursor: text !important;
                }

                /* Override GrapesJS default empty component placeholder (black box with </> icon) */
                [data-gjs-type="mj-image"].gjs-no-app {
                  background-image: none !important;
                  background-color: #F6F7F9 !important;
                  border: 1px dashed #1570EF !important;
                  border-radius: 8px !important;
                  height: 116px !important;
                  width: 100%;
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  justify-content: center !important;
                  outline: none !important;
                }
                [data-gjs-type="mj-image"].gjs-no-app::before {
                  content: "" !important;
                  display: block !important;
                  width: 24px !important;
                  height: 24px !important;
                  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'><path d='M16 5H22' stroke='%23606E80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M19 2V8' stroke='%23606E80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M21 11.5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12.5' stroke='%23606E80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M21 14.9999L17.914 11.9139C17.5389 11.539 17.0303 11.3284 16.5 11.3284C15.9697 11.3284 15.4611 11.539 15.086 11.9139L6 20.9999' stroke='%23606E80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>") !important;
                  background-repeat: no-repeat !important;
                  background-position: center !important;
                }
                [data-gjs-type="mj-image"].gjs-no-app::after {
                  content: "Empty Image" !important;
                  display: block !important;
                  text-align: center !important;
                  font-size: 14px !important;
                  font-weight: 500 !important;
                  color: #404B5A !important;
                  font-family: Inter, sans-serif !important;
                  margin-top: 6px !important;
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
                  text-align: left !important;
                }
                ol {
                  list-style-type: decimal;
                }
                li {
                  display: list-item !important;
                  overflow: visible !important;
                  text-align: left !important;
                }
                .list-content-cell p, .list-content-cell div {
                  display: inline !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                  .list-item-row {
                    display: flex !important;
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

                /* Column-frame side-by-side layout in the canvas preview.
                   grapesjs-mjml places mj-column view elements inside the
                   section's <td>. Using flexbox here avoids inline-block
                   whitespace-gap issues that would push the second column down.
                   The column's own render sets max-width from its width attribute,
                   so flex children still respect the calculated equal widths.
                   NOTE: MJML's compiled output uses inline display:inline-block
                   on each column div, which is what actually renders in email
                   clients — the flex here is a canvas-only visual aid. */
                [data-type="column-frame-section"] > table > tbody > tr > td {
                  display: flex !important;
                  flex-direction: row !important;
                  flex-wrap: nowrap !important;
                  align-items: stretch !important;
                }

                /* Hide drag indicator globally by default (e.g. for heading, paragraph, image, attachment) */
                .gjs-placeholder,
                .gjs-placeholder-int {
                  display: none !important;
                }

                /* Show and style vertical drag indicator in column frames (between columns) */
                [data-type="column-frame-section"] > table > tbody > tr > td > .gjs-placeholder,
                [data-type="column-frame-section"] > table > tbody > tr > td > .gjs-placeholder-int {
                  display: inline-block !important;
                  width: 3px !important;
                  height: 100px !important;
                  min-height: 100% !important;
                  margin: 0 5px !important;
                  border-radius: 4px !important;
                  position: relative !important;
                  top: auto !important;
                  left: auto !important;
                  background-color: #f9a8d4 !important;
                }

                /* Show horizontal drag indicator in row frames */
                [data-type="row-frame-column"] > .gjs-placeholder,
                [data-type="row-frame-column"] > .gjs-placeholder-int {
                  display: block !important;
                  background-color: #f9a8d4 !important;
                }

                /* When a column-frame-section is nested inside another frame
                   (row or column), grapesjs-mjml renders an MJML outer wrapper
                   div/table with max-width:600px and margin:0 auto from the
                   email body width. Override so the inner frame fills its
                   parent column with a 90% max-width instead. */
                [data-type="row-frame-column"] [data-type="column-frame-section"] > div,
                [data-type="row-frame-column"] [data-type="column-frame-section"] > table,
                [data-type="column-frame-section"] [data-type="column-frame-section"] > div,
                [data-type="column-frame-section"] [data-type="column-frame-section"] > table {
                  max-width: 100% !important;
                  margin-left: auto !important;
                  margin-right: auto !important;
                }


                /* Ensure there is always space at the bottom of a frame to drop more items */
                [data-type="row-frame-column"]:not([data-is-empty="true"]),
                [data-type="column-frame-column"]:not([data-is-empty="true"]) {
                  padding-bottom: 20px !important;
                }

                /* Enable pointer events for links in editor so we can detect clicks */
                a { 
                  cursor: pointer !important;
                  pointer-events: auto !important;
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

    // ── Double-click on mj-image or standard image triggers open-assets ──────
    editor.on("component:dblclick", (comp) => {
      if (
        comp.is("mj-image") ||
        comp.is("image") ||
        comp.get("type") === "image" ||
        comp.get("tagName") === "img"
      ) {
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

        // All types get 0px padding; individual padding-* properties are zeroed
        // explicitly so they override the plugin's built-in 10px/25px defaults
        // (the shorthand `padding` alone is not enough — individual properties
        // cascade over it in the rendered td style).
        const extraAttrs = ZERO_PADDING_TYPES.has(typeName)
          ? {
              padding: "0px",
              "padding-top": "0px",
              "padding-right": "0px",
              "padding-bottom": "0px",
              "padding-left": "0px",
              margin: "0px",
              width: "100%",
              "font-family": "Arial"
            }
          : typeName === "mj-section"
            ? {
                padding: "20px",
                margin: "0px",
                width: "100%",
                "font-family": "Arial"
              }
            : { "font-family": "Arial" };

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

      // ── Extend MJML types stylable properties ────────────────────────────
      // grapesjs-mjml's renderStyle() only applies CSS to the component's DOM
      // element for properties listed in the `stylable` array. Adding width,
      // height, and constraints here ensures the canvas reflects changes
      // immediately when items are placed inside frames.
      const extendStylable = (typeName, props) => {
        const type = editor.Components.getType(typeName);
        if (type) {
          const existingStylable = type.model.prototype.defaults.stylable || [];
          const toAdd = props.filter((p) => !existingStylable.includes(p));
          if (toAdd.length > 0) {
            editor.Components.addType(typeName, {
              model: {
                defaults: {
                  stylable: [...existingStylable, ...toAdd]
                }
              }
            });
          }
        }
      };

      extendStylable("mj-text", [
        "width",
        "max-width",
        "height",
        "min-height",
        "max-height"
      ]);
      extendStylable("mj-button", [
        "width",
        "max-width",
        "height",
        "min-height",
        "max-height"
      ]);
      extendStylable("mj-divider", [
        "width",
        "max-width",
        "height",
        "min-height",
        "max-height"
      ]);
      extendStylable("mj-raw", [
        "width",
        "max-width",
        "height",
        "min-height",
        "max-height"
      ]);
      extendStylable("mj-spacer", ["width", "max-width", "height"]);

      // ── Preserve live-canvas content across re-renders ──────────────────────
      // grapesjs-mjml's rerender() re-generates HTML from the model, so any
      // text inserted via execCommand (e.g. placeholders) is lost because it
      // only lives in the canvas DOM and not yet in the model.
      // Patching rerender() to first flush the live contenteditable into the
      // model (silent, no cascade) ensures the subsequent render() reads the
      // correct content including any inserted placeholders.
      for (const typeName of ["mj-text", "mj-button"]) {
        const typeObj = editor.Components.getType(typeName);
        if (!typeObj) continue;
        const originalRerender = typeObj.view.prototype.rerender;
        editor.Components.addType(typeName, {
          view: {
            rerender(...args) {
              // Use contenteditable when RTE is active; fall back to
              // getChildrenContainer() which works after RTE deactivation.
              const editable = this.el?.querySelector("[contenteditable]");
              const contentEl = editable || this.getChildrenContainer?.();
              if (contentEl) {
                const liveHtml = contentEl.innerHTML;
                if (liveHtml) {
                  // Clear stale child models so updateContent() uses
                  // model.content rather than re-rendering them as ''.
                  try {
                    this.model.components().reset([], { silent: true });
                  } catch {
                    /* ignore */
                  }
                  this.model.set("content", liveHtml, { silent: true });
                }
              }
              return originalRerender
                ? originalRerender.apply(this, args)
                : this.render(...args);
            }
          }
        });
      }

      const patchInstance = (comp) => {
        const type = comp.get("type");
        const inFrame =
          COLUMN_VALID_CHILDREN.includes(type) && isInsideFrame(comp);
        const isSignature =
          comp.getAttributes?.()?.["data-type"] === "signature-section";
        const isUnsubscribe = false; // unsubscribe section disabled

        comp.set({
          droppable: resolveDroppable(comp, isHtmlTemplate.current),
          draggable: !inFrame && !isSignature && !isUnsubscribe
        });

        if (type === "mj-section") {
          const isFrame =
            comp.getAttributes?.()?.["data-type"] === "column-frame-section" ||
            comp
              .components()
              .find(
                (c) => c.getAttributes?.()?.["data-type"] === "row-frame-column"
              );
          if (isFrame) {
            const isColumnFrame =
              comp.getAttributes?.()?.["data-type"] === "column-frame-section";
            const extraFrameAttrs = isColumnFrame
              ? {
                  "text-align":
                    comp.getAttributes()?.["text-align"] || "center",
                  "vertical-align":
                    comp.getAttributes()?.["vertical-align"] || "top"
                }
              : {};
            comp.addAttributes({
              padding: "20px",
              margin: "0px",
              "data-gjs-direction": isColumnFrame ? "h" : "v",
              ...extraFrameAttrs
            });
          }
        }

        if (type === "mj-column") {
          const parentDt = comp.parent()?.getAttributes?.()?.["data-type"];
          // Attachment-block columns carry their own explicit width/padding
          // (50% + 8px) to lay out attachment cards in a 2-per-row grid —
          // skip the generic override so those values survive.
          if (isInsideAttachmentBlock(comp)) {
            // no-op
          } else if (parentDt !== "column-frame-section") {
            // Column-frame columns are managed by reconcileFramePlaceholders.
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

    // ── Dirty tracking ────────────────────────────────────────────────────
    const suppressDirty = { current: true };
    const hasFiredDirty = { current: false };
    const fireDirty = () => {
      if (suppressDirty.current || hasFiredDirty.current) return;
      hasFiredDirty.current = true;
      onDirtyChange?.();
    };

    // ── Frame placeholder reconciler (debounced) ──────────────────────────
    const isReconciling = { current: false };
    let reconcileTimer = null;
    const scheduleReconcile = () => {
      if (reconcileTimer) return;
      reconcileTimer = setTimeout(() => {
        reconcileTimer = null;
        if (!editor?.DomComponents) return;
        reconcileFramePlaceholders(editor, isReconciling);
      }, 0);
    };

    // ── Signature-section reconciler ──────────────────────────────────────────
    // Ensures the "Add Signature" section is always present at the bottom
    // whenever there is real content, and absent when the canvas is empty.
    // Set suppressSigReconcile = true before calling setComponents() during
    // a template import so the reconciler does not add a signature mid-load.
    const suppressSigReconcile = { current: false };
    const suppressPaddingOverride = { current: false };
    const isEnsuringSig = { current: false };
    let sigTimer = null;
    const scheduleSignatureReconcile = () => {
      if (suppressSigReconcile.current) return;
      if (sigTimer) clearTimeout(sigTimer);
      sigTimer = setTimeout(() => {
        sigTimer = null;
        if (isEnsuringSig.current) return;
        if (!editor?.DomComponents) return;
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
            const type = c.getAttributes()?.["data-type"];
            if (type === "signature-section") {
              existingSig = c;
            } else if (type !== "unsubscribe-section") {
              realSections.push(c);
            }
          });

          if (realSections.length === 0 && !existingSig) {
            return;
          }

          // Real content exists — sig must be at the end
          const allNonText = [];
          mjBody.components().each((c) => {
            if (
              c.get("type") !== "textnode" &&
              c.getAttributes()?.["data-type"] !== "unsubscribe-section"
            ) {
              allNonText.push(c);
            }
          });
          const n = allNonText.length;
          const lastComp = n > 0 ? allNonText[n - 1] : null;

          if (!existingSig || lastComp !== existingSig) {
            if (!existingSig) {
              mjBody.append(SIGNATURE_SECTION_HTML);
            } else {
              mjBody.append(existingSig);
            }
          }
        } finally {
          isEnsuringSig.current = false;
        }
      }, 50);
    };

    const processPendingFixups = () => {
      fixupScheduled = false;
      const items = pendingFixups.splice(0, pendingFixups.length);
      if (isHtmlTemplate.current) return; // Skip all MJML fixups in standard HTML templates

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
            // Wrap in mj-column at the SAME index so drop position is preserved
            if (
              component.getAttributes()?.["data-type"] ===
              "column-frame-section"
            ) {
              const cloned = component.clone();
              const idx = parent.components().indexOf(component);
              component.remove();
              const newCol = parent
                .components()
                .add(
                  `<mj-column padding="0px" margin="0px" width="100%" vertical-align="top"></mj-column>`,
                  { at: idx }
                );
              newCol.append(cloned);
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
                `<mj-column padding="0px" margin="0px" width="100%" vertical-align="top"></mj-column>`,
                { at: idx }
              );
            newCol.addAttributes({
              padding: "0px",
              margin: "0px",
              width: "100%",
              "vertical-align": "top"
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
              const isUnsubscribe =
                comp.getAttributes?.()?.["data-type"] === "unsubscribe-section";

              comp.set({
                draggable: !inFrame && !isSignature && !isUnsubscribe,
                droppable: resolveDroppable(comp, isHtmlTemplate.current)
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
        comp.addAttributes({
          padding: "0px",
          "padding-top": "0px",
          "padding-right": "0px",
          "padding-bottom": "0px",
          "padding-left": "0px"
        });
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
        comp.set({
          droppable: resolveDroppable(comp, isHtmlTemplate.current),
          draggable: true
        });

        if (type === "mj-section") {
          // Defer so children are in the tree before we check data-types
          setTimeout(() => {
            if (suppressPaddingOverride.current) return;
            const isFrame =
              comp.getAttributes?.()?.["data-type"] ===
                "column-frame-section" ||
              comp
                .components()
                .find(
                  (c) =>
                    c.getAttributes?.()?.["data-type"] === "row-frame-column"
                );
            if (isFrame) {
              comp.addAttributes({ padding: "20px", margin: "0px" });
            } else {
              comp.addAttributes({
                padding: "0px",
                "padding-top": "0px",
                "padding-right": "0px",
                "padding-bottom": "0px",
                "padding-left": "0px",
                margin: "0px"
              });
            }
          }, 0);
        }

        if (type === "mj-column" && !suppressPaddingOverride.current) {
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

        if (
          COLUMN_VALID_CHILDREN.includes(type) &&
          !suppressPaddingOverride.current
        ) {
          const isInsideSig = (() => {
            let p = comp.parent();
            while (p) {
              if (p.getAttributes?.()?.["data-type"] === "signature-section")
                return true;
              p = p.parent();
            }
            return false;
          })();
          if (isInsideSig) {
            // Type defaults already wrote 0px to the individual padding attrs.
            // Sync them to the shorthand value so CSS individual properties
            // don't override the intended padding.
            const sigPadding = comp.getAttributes()?.["padding"] || "16px";
            comp.addAttributes({
              "padding-top": sigPadding,
              "padding-right": sigPadding,
              "padding-bottom": sigPadding,
              "padding-left": sigPadding
            });
          } else {
            comp.addAttributes({
              padding: "0px",
              "padding-top": "0px",
              "padding-right": "0px",
              "padding-bottom": "0px",
              "padding-left": "0px"
            });
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
        // Real user-driven content additions mark the editor dirty; the
        // suppressDirty flag still covers the initial template load window.
        if (!isEnsuringSig.current) fireDirty();
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
          if (!isEnsuringSig.current && !isUnwrapping.current) fireDirty();
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

    // Fire dirty only for real user edits. component:update also fires when
    // GrapesJS flips internal component state (e.g. status = "selected"),
    // which previously caused the Save button to enable on plain selection.
    const isInternalUpdate = () =>
      isReconciling.current ||
      isUnwrapping.current ||
      suppressPaddingOverride.current ||
      suppressSigReconcile.current ||
      isEnsuringSig.current;

    editor.on("component:update:content", () => {
      if (isInternalUpdate()) return;
      fireDirty();
    });
    editor.on("component:update:style", () => {
      if (isInternalUpdate()) return;
      fireDirty();
    });
    editor.on("component:update:attributes", () => {
      if (isInternalUpdate()) return;
      fireDirty();
    });

    registerBlocks(editor, initialTemplate);
    suppressPaddingOverride.current = true;
    suppressSigReconcile.current = true;
    editor.setComponents(initialTemplate || EMPTY_TEMPLATE);
    setTimeout(() => {
      suppressPaddingOverride.current = false;
      suppressSigReconcile.current = false;
    }, 0);
    setTimeout(() => {
      suppressDirty.current = false;
    }, 500);

    // ── Restrict nested block drops to column-frame / row-frame only ────────────
    // Any block may be dropped at the top level (direct child of mj-body), which
    // creates a new main section in the editor. However, when a block is dropped
    // NESTED inside an existing section, it is only permitted inside a
    // column-frame-section or row-frame-column container. Drops nested inside any
    // other kind of section are immediately removed.
    editor.on("block:drag:stop", (component) => {
      if (!component) return;
      if (isHtmlTemplate.current) return; // Allow nested drops in standard HTML templates
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
      if (isHtmlTemplate.current) {
        section.addAttributes({
          "data-type": "attachment-placeholder",
          style:
            "border: 1px dashed #1570EF; padding: 0px; text-align: center; width: 100%; box-sizing: border-box; background-color: transparent;"
        });
        section.components(`
          <div style="padding:20px;display:flex;justify-content:center;align-items:center;">
            <div style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;width:100%;padding:20px 0;background:#F6F7F9;border-radius:6px;">
              <img src="${imgIcon}" alt="imgIcon" style="width:30px;height:30px;" />
              <p style="font-size:14px;font-weight:500;color:#404B5A;font-family:Inter,sans-serif;margin:0"><span class="browse-click-trigger" style="color:#1570EF;cursor:pointer;">click to browse</span> and upload your files here</p>
              <p style="color:#888E9E;text-align:center;font-size:12px;font-weight:400;line-height:18px;margin:0">JPG, PNG, JPEG and PDF up to 10MB each.</p>
            </div>
          </div>
        `);
      } else {
        section.addAttributes({
          "data-type": "attachment-placeholder",
          border: "1px dashed #1570EF",
          padding: "0px"
        });
        section.components(`
          <mj-column padding="0px" margin="0px" width="100%">
            <mj-text align="center" padding="0px" margin="0px">
              <div style="padding:20px;display:flex;justify-content:center;align-items:center;">
                <div style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;width:100%;padding:20px 0;background:#F6F7F9;border-radius:6px;">
                  <img src="${imgIcon}" alt="imgIcon" style="width:30px;height:30px;" />
                  <p style="font-size:14px;font-weight:500;color:#404B5A;font-family:Inter,sans-serif;margin:0"><span class="browse-click-trigger" style="color:#1570EF;cursor:pointer;">click to browse</span> and upload your files here</p>
                  <p style="color:#888E9E;text-align:center;font-size:12px;font-weight:400;line-height:18px;margin:0">JPG, PNG, JPEG and PDF up to 10MB each.</p>
                </div>
              </div>
            </mj-text>
          </mj-column>
        `);
      }
      editor.trigger("component:update", section);
    };

    // Track which body elements already have our listeners to prevent
    // duplicate registration if the "load" event fires more than once.
    const attachedBodies = new WeakSet();

    editor.on("load", () => {
      // ── Custom RTE Configuration ───────────────────────────────────────────
      const rte = editor.RichTextEditor;

      // Clear standard actions to replace them with custom icons
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

          console.log(
            "[Link] result fired. rangeCount:",
            sel.rangeCount,
            "selection:",
            selection
          );

          let plainText = "";
          if (selection) {
            plainText =
              typeof selection === "string"
                ? selection.replace(/<[^>]*>/g, "")
                : selection.toString
                  ? selection.toString()
                  : "";
          }

          // Use execCommand('createLink') while the RTE is active and the
          // selection is still valid. The browser wraps the selected text in
          // <a href="__GJS_LINK_PLACEHOLDER__"> — we update the real URL on
          // confirm. This is more reliable than inserting a span placeholder
          // because execCommand handles partial selections, nested elements, etc.
          const PLACEHOLDER_URL = "__GJS_LINK_PLACEHOLDER__";
          if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (range.collapsed) {
              // Handle collapsed selection (just a cursor)
              const placeholder = doc.createElement("a");
              placeholder.href = PLACEHOLDER_URL;
              placeholder.textContent = "\u200B"; // Zero-width space
              placeholder.style.color = "#1570EF";
              placeholder.style.textDecoration = "underline";
              placeholder.target = "_blank";
              range.insertNode(placeholder);
            } else {
              doc.execCommand("createLink", false, PLACEHOLDER_URL);
              // Apply preview styles to the inserted link
              const placeholderLink = rteInstance.el.querySelector(
                `a[href="${PLACEHOLDER_URL}"]`
              );
              if (placeholderLink) {
                placeholderLink.style.color = "#1570EF";
                placeholderLink.style.textDecoration = "underline";
                placeholderLink.target = "_blank";
              }
            }
          }

          setLinkModalText(plainText || "");
          setLinkModalUrl("");
          currentRteRef.current = rteInstance;
          // Find the DEEPEST component whose view contains rteInstance.el.
          // editor.getSelected() can return a parent (mj-column/mj-section)
          // instead of the mj-text, which would corrupt the wrong component.
          // Deepest-match search always resolves to the mj-text itself.
          let editingComp = null;
          (function searchDeep(c) {
            try {
              const viewEl = c.getView()?.el;
              if (viewEl && viewEl.contains(rteInstance.el)) {
                editingComp = c; // overwrite — deeper match is more specific
                c.components().each(searchDeep);
              }
            } catch {
              /* skip */
            }
          })(editor.Components.getWrapper());
          if (!editingComp) editingComp = editor.getSelected();
          currentCompRef.current = editingComp;
          // Snapshot rte.el.innerHTML synchronously (contains the placeholder
          // link). Used as fallback if GrapesJS hasn't synced to model yet.
          currentRteContentRef.current = rteInstance.el
            ? rteInstance.el.innerHTML
            : null;
          setLinkPopupData((prev) => ({ ...prev, el: null, isOpen: false }));
          setIsLinkModalOpen(true);
        }
      });

      const body = editor.Canvas.getBody();
      if (attachedBodies.has(body)) return;
      attachedBodies.add(body);

      // ── Canvas mousedown handler (using mousedown to catch before GrapesJS selection) ──
      body.addEventListener("mousedown", (e) => {
        // ── Hyperlink click ───────────────────────────────────────────────
        const link = e.target.closest("a");
        if (link) {
          // If the link is a standalone GrapesJS component (like a button or structural link)
          // or part of an mj-button or mj-image, we skip the popup because these
          // are managed via the Right Panel URL inputs.
          const isStructuralLink = link.closest(
            '[data-gjs-type="mj-button"], [data-gjs-type="mj-image"], [data-gjs-type="link"], [data-gjs-type="button"]'
          );
          if (isStructuralLink) return;

          console.log("Link clicked in canvas:", link.href);
          e.preventDefault();
          e.stopPropagation();

          // Toggle behavior: if clicking the same link, close it
          if (linkPopupData.isOpen && linkPopupData.el === link) {
            setLinkPopupData((prev) => ({ ...prev, isOpen: false }));
            return;
          }

          const rect = link.getBoundingClientRect();
          const iframe = editor.Canvas.getFrameEl();
          const iframeRect = iframe.getBoundingClientRect();

          // Detect if there's enough space above the link (popup height ~150px)
          const showBelow = rect.top < 150;

          // Position popup relative to the viewport (for Portal)
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
          return;
        } else {
          // Close popup if clicking elsewhere
          if (e.target.closest(".link-interaction-popup")) return;
          setLinkPopupData((prev) =>
            prev.isOpen ? { ...prev, isOpen: false, el: null } : prev
          );
        }
      });

      // ── Canvas click handler (for other elements) ──────────────────────────
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
        if (
          e.target.closest(".attachment-click-area") ||
          e.target.closest(".browse-click-trigger")
        ) {
          fileInputRef.current?.click();
          return;
        }

        // ── Remove file icon click ────────────────────────────────────────
        if (e.target.closest(".remove-file-icon")) {
          // Find the .attachment-item wrapper in the DOM
          const attachmentItemEl = e.target.closest(".attachment-item");
          if (!attachmentItemEl) return;

          // Drop the removed card's uploaded attachment from the tracked list
          // so it isn't included in the CREATE /templates payload.
          const removedLink = attachmentItemEl.querySelector(
            'a[download][href^="http"]'
          );
          const removedUrl = removedLink?.getAttribute("href");
          if (removedUrl) {
            const idx = attachmentUrlsRef.current.findIndex(
              (att) => att?.publicUrl === removedUrl
            );
            if (idx !== -1) attachmentUrlsRef.current.splice(idx, 1);
          }

          // Find the matching GrapesJS component by DOM containment
          const allComps = [];
          const collectComps = (comp) => {
            allComps.push(comp);
            comp.components().each(collectComps);
          };
          collectComps(editor.getWrapper());

          let currentEl = attachmentItemEl;
          let itemComp = null;
          while (currentEl) {
            itemComp = allComps.find((comp) => {
              try {
                return comp.getView?.()?.el === currentEl;
              } catch {
                return false;
              }
            });
            if (itemComp) break;
            currentEl = currentEl.parentElement;
          }

          if (!itemComp) return;

          // Walk up GrapesJS components starting from itemComp to find the attachment-filled container
          let mjSection = itemComp;
          while (
            mjSection &&
            mjSection.getAttributes?.()?.["data-type"] !== "attachment-filled"
          ) {
            mjSection = mjSection.parent();
          }

          // Count all remaining .attachment-item elements from the entire
          // attachment-filled container. The 2-per-row layout splits items
          // into separate DOM parents (rows/columns), so a query on the
          // item's parentElement alone would undercount.
          const filledContainerEl = mjSection?.getView?.()?.el;
          const siblingCountBefore = filledContainerEl
            ? filledContainerEl.querySelectorAll(".attachment-item").length
            : attachmentItemEl.parentElement
              ? attachmentItemEl.parentElement.querySelectorAll(
                  ".attachment-item"
                ).length
              : 0;

          const hasItemsAfter = siblingCountBefore > 1;

          if (hasItemsAfter) {
            // Not the last item — clean up just this item plus any layout
            // parents (mj-column / mj-section) it leaves empty.
            if (isHtmlTemplate.current) {
              // itemComp is the <td class="attachment-item"> — turn it into
              // an empty spacer td so the 2-column table layout is preserved.
              if (currentEl === attachmentItemEl) {
                itemComp.set("classes", []);
                itemComp.addAttributes({
                  valign: "top",
                  width: "50%",
                  style: "width:50%;padding:8px;vertical-align:top;"
                });
                itemComp.components().reset();
                itemComp.set("content", "&nbsp;");
                const view = itemComp.getView?.();
                if (view && typeof view.render === "function") view.render();
                else editor.trigger("component:update", itemComp);
              } else {
                const parentEl = attachmentItemEl.parentElement;
                attachmentItemEl.remove();
                if (parentEl) {
                  itemComp.set("content", currentEl.innerHTML);
                  const view = itemComp.getView?.();
                  if (view && typeof view.render === "function") view.render();
                  else editor.trigger("component:update", itemComp);
                }
              }
            } else {
              // MJML: remove the item's mj-column. If its mj-section then
              // has no mj-columns left, remove the section too.
              let columnComp = itemComp;
              while (columnComp && columnComp.get?.("type") !== "mj-column") {
                columnComp = columnComp.parent();
              }
              const sectionComp = columnComp?.parent?.();

              if (columnComp) {
                columnComp.remove();
              } else {
                itemComp.remove();
              }

              if (sectionComp && sectionComp.get?.("type") === "mj-section") {
                let remainingCols = 0;
                sectionComp.components().each((c) => {
                  if (c.get?.("type") === "mj-column") remainingCols++;
                });
                if (remainingCols === 0) sectionComp.remove();
              }
            }
            return;
          }

          if (mjSection) {
            if (isHtmlTemplate.current) {
              // Convert the existing td/div to an empty placeholder in-place
              mjSection.components().reset();
              mjSection.set("content", "");
              mjSection.addAttributes({
                "data-type": "attachment-placeholder",
                style:
                  "border: 1px dashed #1570EF; padding: 20px; text-align: center; width: 100%; box-sizing: border-box; background-color: transparent;"
              });
              mjSection.components(`
                <div class="attachment-click-area" style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;width:fit-content;margin:0 auto;cursor:pointer;">
                  <img src="${uploadIconSvg}" width="40" height="40" style="display:block;" />
                  <span style="font-size:16px;font-weight:500;color:#404B5A;font-family:Inter,sans-serif;">Upload Attachment</span>
                  <span style="font-size:12px;color:#98A2B3;font-family:Inter,sans-serif;">Click to browse files</span>
                </div>
              `);

              const view = mjSection.getView?.();
              if (view && typeof view.render === "function") {
                view.render();
              } else {
                editor.trigger("component:update", mjSection);
              }
            } else {
              // MJML path
              const grandParent = mjSection.parent();
              mjSection.remove();

              if (grandParent) {
                const hasAttachments = grandParent
                  .components()
                  .some(
                    (c) =>
                      c.getAttributes()["data-type"] === "attachment-filled"
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
          }

          return;
        }
      });

      // Handled natively by GrapesJS Sorter processing text/html drops.

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
        if (!mjBody) {
          // If no mj-body exists (e.g. when loading a standard HTML template),
          // check if there are any non-textnode components in the wrapper.
          const realComponents = wrapper
            .components()
            .filter((c) => c.get("type") !== "textnode");
          return realComponents.length > 0;
        }
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

        // Alignment — critical for column layout in emails
        if (style["text-align"]) attributes["text-align"] = style["text-align"];
        if (style["vertical-align"])
          attributes["vertical-align"] = style["vertical-align"];

        // Typography — MJML reads these as attributes to produce the inline
        // style in the compiled email. Without syncing, changes made via the
        // style manager only touch the model style and get ignored on render.
        if (style["font-family"])
          attributes["font-family"] = style["font-family"];
        if (style["font-size"]) attributes["font-size"] = style["font-size"];
        if (style["font-weight"])
          attributes["font-weight"] = style["font-weight"];
        if (style["font-style"]) attributes["font-style"] = style["font-style"];
        if (style["color"]) attributes["color"] = style["color"];
        if (style["line-height"])
          attributes["line-height"] = style["line-height"];
        if (style["letter-spacing"])
          attributes["letter-spacing"] = style["letter-spacing"];

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
        if (!src) {
          imageInputRef.current?.click();
        }
      }
    });

    // ── Text-selection fix for mj-text / mj-button ────────────────────────────
    // Without this, click-dragging over text starts a GrapesJS component drag
    // (because the model has draggable:true) which preempts native browser
    // text selection. We:
    //   1. Force `draggable:false` on a text component the moment it becomes
    //      selected, so the Sorter cannot pick up subsequent mousedown/move.
    //      Restore the previous draggable state on deselect so users can still
    //      re-order the block via its parent section drag handle.
    //   2. Programmatically enable RTE on selection so the component enters
    //      contenteditable mode without needing an explicit double-click —
    //      trackpad users can then immediately drag to select, then copy/cut.
    const restoreDraggableFor = (comp) => {
      try {
        const type = comp.get("type");
        const inFrame =
          COLUMN_VALID_CHILDREN.includes(type) && isInsideFrame(comp);
        const isSignature =
          comp.getAttributes?.()?.["data-type"] === "signature-section";
        comp.set("draggable", !inFrame && !isSignature);
      } catch {
        /* ignore destroyed components */
      }
    };

    const isTextEditableComp = (c) => {
      if (!c) return false;
      if (c.is?.("mj-text") || c.is?.("mj-button")) return true;
      // HTML-template mode drops heading/paragraph as a plain <div
      // data-placeholder="..."> — those need the same drag-free treatment
      // so trackpad click-drag can select the typed text.
      const attrs = c.getAttributes?.() || {};
      return !!attrs["data-placeholder"];
    };

    const activateRteFor = (comp) => {
      try {
        const view = comp.getView?.();
        if (!view) return;
        // Skip if RTE is already active for this view.
        if (view.activeRte || view.rteActive) return;
        // Prefer the built-in onActive() hook exposed by MJML text/button
        // views (subclass of GrapesJS TextView). Fallback to dispatching a
        // synthetic double-click on the content element, which is what
        // GrapesJS listens for by default.
        if (typeof view.onActive === "function") {
          view.onActive();
          return;
        }
        const el = view.getChildrenContainer?.() || view.el;
        if (el) {
          const dblEvt = new MouseEvent("dblclick", {
            bubbles: true,
            cancelable: true,
            view: el.ownerDocument?.defaultView || window
          });
          el.dispatchEvent(dblEvt);
        }
      } catch {
        /* ignore */
      }
    };

    editor.on("component:selected", (cmp) => {
      if (!isTextEditableComp(cmp)) return;
      // Freeze drag so a trackpad click-drag over the text becomes a text
      // selection instead of a component drag.
      try {
        cmp.set("draggable", false);
      } catch {
        /* ignore */
      }
      // Defer RTE activation to next tick so the view is finished rendering
      // and GrapesJS has attached its own mouse handlers. Without this, the
      // synthetic dblclick fires before the listeners exist and is dropped.
      setTimeout(() => activateRteFor(cmp), 0);
    });

    editor.on("component:deselected", (cmp) => {
      if (!isTextEditableComp(cmp)) return;
      restoreDraggableFor(cmp);
    });

    // Some GrapesJS builds emit rte:enable/rte:disable — use them as a
    // second line of defense. `view` here is the ComponentView.
    editor.on("rte:enable", (view) => {
      try {
        const comp = view?.model;
        if (comp) comp.set("draggable", false);
      } catch {
        /* ignore */
      }
    });

    editor.on("rte:disable", (view) => {
      try {
        const comp = view?.model;
        if (comp) restoreDraggableFor(comp);
      } catch {
        /* ignore */
      }
    });

    // ── Get compiled HTML from the live canvas iframe ─────────────────────────
    // fixCanvasDomForExport – called on a CLONE of the canvas document.
    // GrapesJS places column-frame-section <div>s as direct children of
    // <table> elements via programmatic DOM insertion (bypassing the HTML5
    // parser rules). Serialising with outerHTML produces invalid HTML: a
    // <div> inside <table> triggers "foster parenting" when re-parsed,
    // completely mangling the layout and order.
    //
    // Fix: for every table that has div[data-type] as direct children, split
    // the table's children into ordered fragments at each such div boundary,
    // preserving visual order (e.g. a heading row that precedes a column frame
    // must still appear before it after the transform).
    const fixCanvasDomForExport = (root) => {
      // Snapshot all tables before we start mutating the DOM.
      const tables = Array.from(root.querySelectorAll("table"));
      tables.forEach((table) => {
        const parent = table.parentNode;
        if (!parent) return; // already detached by an earlier iteration

        const children = Array.from(table.children);
        const hasDataTypeDivs = children.some(
          (child) => child.tagName === "DIV" && child.hasAttribute("data-type")
        );
        if (!hasDataTypeDivs) return;

        // Walk children in order, grouping consecutive non-div elements into
        // sub-tables and letting div[data-type] elements become plain siblings.
        const fragments = [];
        let pendingTableChildren = [];
        children.forEach((child) => {
          if (child.tagName === "DIV" && child.hasAttribute("data-type")) {
            if (pendingTableChildren.length > 0) {
              fragments.push({ type: "table", children: pendingTableChildren });
              pendingTableChildren = [];
            }
            fragments.push({ type: "div", el: child });
          } else {
            pendingTableChildren.push(child);
          }
        });
        if (pendingTableChildren.length > 0) {
          fragments.push({ type: "table", children: pendingTableChildren });
        }

        // Insert fragments before the original table, in order.
        fragments.forEach((fragment) => {
          if (fragment.type === "div") {
            parent.insertBefore(fragment.el, table);
          } else {
            const newTable = table.cloneNode(false); // copy attrs, no children
            fragment.children.forEach((child) => newTable.appendChild(child));
            parent.insertBefore(newTable, table);
          }
        });

        table.remove(); // original is now empty
      });
    };

    const getCompiledHtmlFromCanvas = () => {
      try {
        const frames = editor.Canvas.getFrames();
        if (frames && frames.length > 0) {
          const frameView = frames.at(0).view;
          if (frameView && frameView.el) {
            const iframeDoc =
              frameView.el.contentDocument ||
              frameView.el.contentWindow?.document;
            if (iframeDoc) {
              const clone = iframeDoc.documentElement.cloneNode(true);
              fixCanvasDomForExport(clone);
              return clone.outerHTML;
            }
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
          if (iframeDoc) {
            const clone = iframeDoc.documentElement.cloneNode(true);
            fixCanvasDomForExport(clone);
            return clone.outerHTML;
          }
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
        getAttachments: () => [...attachmentUrlsRef.current],
        /**
         * Load a full MJML string into the editor, replacing all current
         * content. The signature-section reconciler is suppressed during the
         * load and re-enabled immediately after so the import does not
         * accidentally inject a signature mid-parse.
         */
        loadTemplate: (templateString) => {
          attachmentUrlsRef.current = [];
          suppressSigReconcile.current = true;
          suppressPaddingOverride.current = true;
          const isMjmlTemplate = !!(
            templateString &&
            (templateString.trim().startsWith("<mjml") ||
              templateString.trim().startsWith("<mj-body") ||
              (templateString.includes("<mj-section") &&
                templateString.includes("<mj-column")))
          );
          isHtmlTemplate.current = !isMjmlTemplate;
          try {
            editor.setComponents(templateString);
          } finally {
            // Re-enable after a short delay so any in-flight timers from
            // setComponents() have already been skipped.
            setTimeout(() => {
              suppressSigReconcile.current = false;
              suppressPaddingOverride.current = false;
            }, 200);
          }
        },
        clearAll: () => {
          attachmentUrlsRef.current = [];
          suppressSigReconcile.current = true;
          suppressPaddingOverride.current = true;
          isHtmlTemplate.current = false;
          try {
            editor.setComponents(EMPTY_TEMPLATE);
          } finally {
            setTimeout(() => {
              suppressSigReconcile.current = false;
              suppressPaddingOverride.current = false;
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
      if (reconcileTimer) clearTimeout(reconcileTimer);
      if (sigTimer) clearTimeout(sigTimer);
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
        ".reusableModal",
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
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          zIndex: 999
        }}
      >
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
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={imageInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleImageChange}
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
                  <button
                    className="remove-btn"
                    onClick={() => {
                      const link = linkPopupData.el;
                      const editor = gjsInstance.current;

                      // Find the deepest component containing this link (usually an mj-text)
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
                          c.components().length > 0
                            ? c.getInnerHTML()
                            : c.get("content") || "";
                        const currentContent = getCompHtml(comp);

                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = currentContent;

                        const href = link.getAttribute("href");
                        const text = link.textContent.trim();

                        const matchingLinks = Array.from(
                          tempDiv.querySelectorAll("a")
                        ).filter(
                          (a) =>
                            a.getAttribute("href") === href &&
                            a.textContent.trim() === text
                        );

                        if (matchingLinks.length > 0) {
                          const targetLink = matchingLinks[0];
                          const parent = targetLink.parentNode;
                          while (targetLink.firstChild) {
                            parent.insertBefore(
                              targetLink.firstChild,
                              targetLink
                            );
                          }
                          parent.removeChild(targetLink);

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
                        toast.success(
                          "Link Removed",
                          "The link has been successfully removed from the text."
                        );
                      }

                      setLinkPopupData({
                        isOpen: false,
                        top: 0,
                        left: 0,
                        text: "",
                        url: "",
                        el: null
                      });
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="popup-arrow"></div>
            </div>,
            document.body
          )}
      </div>

      <ReusableLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          // On cancel: unwrap the placeholder link, restoring the plain text
          const comp = currentCompRef.current;
          const editor = gjsInstance.current;
          const PLACEHOLDER_URL = "__GJS_LINK_PLACEHOLDER__";
          if (comp && editor) {
            const getCompHtml = (c) =>
              c.components().length > 0
                ? c.getInnerHTML()
                : c.get("content") || "";
            const currentContent =
              currentRteContentRef.current || getCompHtml(comp);
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = currentContent;

            const placeholderLink =
              tempDiv.querySelector(`a[href="${PLACEHOLDER_URL}"]`) ||
              tempDiv.querySelector(`a[href='${PLACEHOLDER_URL}']`);
            if (placeholderLink) {
              const parent = placeholderLink.parentNode;
              while (placeholderLink.firstChild) {
                parent.insertBefore(
                  placeholderLink.firstChild,
                  placeholderLink
                );
              }
              parent.removeChild(placeholderLink);
            }

            const restoredContent = tempDiv.innerHTML;
            comp.components().reset();
            comp.set("content", restoredContent);
            const view = comp.getView?.();
            if (view && typeof view.render === "function") {
              view.render();
            } else {
              editor.trigger("component:update", comp);
            }
          }
          currentCompRef.current = null;
          currentRteContentRef.current = null;
          savedRangeRef.current = null;
          setIsLinkModalOpen(false);
          // Also clear popup ref if we were editing an existing link
          setLinkPopupData((prev) => ({ ...prev, el: null }));
        }}
        onConfirm={() => {
          try {
            if (linkPopupData.el) {
              // Updating existing link
              const link = linkPopupData.el;
              link.href = linkModalUrl;
              link.textContent = linkModalText;

              // Trigger GrapesJS update
              const editor = gjsInstance.current;
              // Find the deepest component containing this link
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
                  c.components().length > 0
                    ? c.getInnerHTML()
                    : c.get("content") || "";
                const currentContent = getCompHtml(comp);

                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = currentContent;

                const oldHref = link.getAttribute("href");
                const oldText = link.textContent.trim();

                const matchingLinks = Array.from(
                  tempDiv.querySelectorAll("a")
                ).filter(
                  (a) =>
                    a.getAttribute("href") === oldHref &&
                    a.textContent.trim() === oldText
                );

                if (matchingLinks.length > 0) {
                  const targetLink = matchingLinks[0];
                  targetLink.href = linkModalUrl;
                  targetLink.textContent = linkModalText;

                  const newContent = tempDiv.innerHTML;
                  comp.components().reset();
                  comp.set("content", newContent);

                  const view = comp.getView?.();
                  if (view && typeof view.render === "function") {
                    view.render();
                  } else {
                    editor.trigger("component:update", comp);
                  }
                } else {
                  // Fallback: update the live DOM link and let GrapesJS re-render
                  link.href = linkModalUrl;
                  link.textContent = linkModalText;
                  editor.trigger("component:update", comp);
                }
              }
            } else {
              handleToolbarLinkConfirm();
            }
          } finally {
            setIsLinkModalOpen(false);
            setLinkPopupData({
              isOpen: false,
              top: 0,
              left: 0,
              text: "",
              url: "",
              el: null,
              isBelow: false
            });
            setLinkModalText("");
            setLinkModalUrl("");
          }
        }}
        formName={linkModalText}
        setFormName={setLinkModalText}
        linkValue={linkModalUrl}
        setLinkValue={setLinkModalUrl}
        title={linkPopupData.el ? "Edit Link" : "Add Link"}
        textLabel="Link Text"
        confirmText={linkPopupData.el ? "Edit" : "Send"}
        urlLabel={linkPopupData.el ? "Edit Link" : "Add Link"}
      />
    </>
  );
}

function registerBlocks(editor, initialTemplate) {
  const bm = editor.BlockManager;
  if (bm.getAll) bm.getAll().reset();

  const isHtml =
    initialTemplate &&
    !initialTemplate.includes("<mjml>") &&
    !initialTemplate.includes("<mj-body>");

  if (isHtml) {
    // ── Frame blocks (Standard HTML equivalents) ─────────────────────────────
    bm.add("row", {
      label: "Frame - Row",
      category: "Blocks",
      content: `<div data-type="row-frame-column" data-is-empty="true" style="padding: 20px 0; width: 100%; box-sizing: border-box; display: flex; flex-direction: column;"></div>`
    });

    bm.add("column", {
      label: "Frame - Column",
      category: "Blocks",
      content: `<div data-type="column-frame-section" data-is-empty="true" style="padding: 20px; width: 100%; box-sizing: border-box; display: flex; flex-direction: row; gap: 20px;"></div>`
    });

    // ── Content blocks ────────────────────────────────────────────────────────
    bm.add("heading", {
      label: "Heading",
      category: "Content",
      content: `<div data-placeholder="Title goes here" style="padding: 10px 20px; text-align: left; font-family: Arial, sans-serif; font-size: 32px; font-weight: 600; color: #404B5A; line-height: 42px; width: 100%; box-sizing: border-box;"></div>`
    });

    bm.add("paragraph", {
      label: "Paragraph",
      category: "Content",
      content: `<div data-placeholder="Paragraph Text" style="padding: 10px 20px; text-align: left; font-family: Arial, sans-serif; font-size: 16px; font-weight: 400; color: #404B5A; line-height: 22px; width: 100%; box-sizing: border-box;"></div>`
    });

    bm.add("image", {
      label: "Image",
      category: "Content",
      content: `<div style="padding: 10px 20px; width: 100%; box-sizing: border-box;">
        <div class="image-click-area" style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:6px; width:100%;margin:0 auto;cursor:pointer; height: 116px; background-color:#F6F7F9; border-radius: 8px; border: 1px dashed #1570EF;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 5H22" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19 2V8" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 11.5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12.5" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 14.9999L17.914 11.9139C17.5389 11.539 17.0303 11.3284 16.5 11.3284C15.9697 11.3284 15.4611 11.539 15.086 11.9139L6 20.9999" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 11C10.1046 11 11 10.1046 11 9C11 7.89543 10.1046 7 9 7C7.89543 7 7 7.89543 7 9C7 10.1046 7.89543 11 9 11Z" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="font-size:14px;font-weight:500;color:#4D5761;font-family:Inter;">Add Image</span>
        </div>
      </div>`
    });

    bm.add("button", {
      label: "Button",
      category: "Content",
      content: `<div style="padding: 10px 20px; text-align: center; width: 100%; box-sizing: border-box;">
        <a href="#" style="display: inline-block; background-color: #295E3F; color: #ffffff; border-radius: 8px; padding: 10px 20px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 500; text-decoration: none; line-height: 20px;">
          Click Here
        </a>
      </div>`
    });

    bm.add("divider", {
      label: "Divider",
      category: "Content",
      content: `<div style="padding: 16px 20px; width: 100%; box-sizing: border-box;">
        <hr style="border: 0; border-top: 1px solid #dddddd; margin: 0; padding: 0;" />
      </div>`
    });

    bm.add("Attachment", {
      label: "Attachment",
      category: "Content",
      content: `<div data-type="attachment-placeholder" style="border: 1px dashed #1570EF; padding: 20px; text-align: center; width: 100%; box-sizing: border-box; background-color: transparent;">
        <div class="attachment-click-area" style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;width:fit-content;margin:0 auto;cursor:pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="21" viewBox="0 0 19 21" fill="none">
            <path d="M12.112 4.9902L5.61201 11.4902C5.21418 11.888 4.99069 12.4276 4.99069 12.9902C4.99069 13.5528 5.21418 14.0924 5.61201 14.4902C6.00983 14.888 6.5494 15.1115 7.11201 15.1115C7.67462 15.1115 8.21418 14.888 8.61201 14.4902L15.112 7.9902C15.9077 7.19455 16.3546 6.11542 16.3546 4.9902C16.3546 3.86498 15.9077 2.78585 15.112 1.9902C14.3164 1.19455 13.2372 0.747559 12.112 0.747559C10.9868 0.747559 9.90766 1.19455 9.11201 1.9902L2.61201 8.4902C1.41853 9.68367 0.748047 11.3024 0.748047 12.9902C0.748047 14.678 1.41853 16.2967 2.61201 17.4902C3.80548 18.6837 5.42418 19.3542 7.11201 19.3542C8.79984 19.3542 10.4185 18.6837 11.612 17.4902L18.112 10.9902" stroke="#555F75" stroke-width="1.495" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="font-size:14px;font-weight:500;color:#4D5761;font-family:Inter,sans-serif;">Upload Attachment</span>
        </div>
      </div>`
    });

    // ── Component blocks ──────────────────────────────────────────────────────
    bm.add("custom-header", {
      label: "Header Banner",
      category: "Components",
      content: `<div style="padding: 20px; background-color: #2f6f4e; text-align: center; width: 100%; box-sizing: border-box;">
        <div style="font-family: Arial, sans-serif; color: #ffffff; font-size: 24px; font-weight: bold;">Your Header Here</div>
      </div>`
    });

    bm.add("custom-text-block", {
      label: "Text Block",
      category: "Components",
      content: `<div style="padding: 20px; background-color: transparent; text-align: left; width: 100%; box-sizing: border-box;">
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.6;">Add your content here. This is a paragraph of text.</div>
      </div>`
    });

    bm.add("custom-button-block", {
      label: "CTA Button",
      category: "Components",
      content: `<div style="padding: 10px 20px; text-align: center; width: 100%; box-sizing: border-box;">
        <a href="#" style="display: block; background-color: #2f6f4e; color: #ffffff; border-radius: 6px; padding: 10px 20px; font-family: Arial, sans-serif; font-size: 14px; text-decoration: none;">Click Here</a>
      </div>`
    });

    bm.add("custom-image-block", {
      label: "Image Section",
      category: "Components",
      content: `<div style="padding: 20px; background-color: #000000; text-align: center; width: 100%; box-sizing: border-box;">
        <div style="padding: 10px 20px; width: 100%; box-sizing: border-box;">
          <div class="image-click-area" style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:6px; width:100%;margin:0 auto;cursor:pointer; height: 116px; background-color:#F6F7F9; border-radius: 8px; border: 1px dashed #1570EF;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16 5H22" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 2V8" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 11.5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12.5" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 14.9999L17.914 11.9139C17.5389 11.539 17.0303 11.3284 16.5 11.3284C15.9697 11.3284 15.4611 11.539 15.086 11.9139L6 20.9999" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 11C10.1046 11 11 10.1046 11 9C11 7.89543 10.1046 7 9 7C7.89543 7 7 7.89543 7 9C7 10.1046 7.89543 11 9 11Z" stroke="#606E80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span style="font-size:14px;font-weight:500;color:#4D5761;font-family:Inter;">Add Image</span>
          </div>
        </div>
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.6; padding-top: 10px;">Add Image.</div>
      </div>`
    });
  } else {
    // ── Frame blocks (Original MJML Blocks) ──────────────────────────────────
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
      content: `<mj-section data-type="column-frame-section" data-gjs-direction="h" data-is-empty="true" padding="20px" margin="0px" width="100%" background-color="transparent" text-align="center" vertical-align="top">
      </mj-section>`
    });

    // ── Content blocks (Original MJML Blocks) ──────────────────────────────────
    bm.add("heading", {
      label: "Heading",
      category: "Content",
      content: `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%">
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-text font-family="Arial" font-size="32px" font-weight="600" color="#404B5A" align="left" line-height="42px" padding="0px" margin="0px">
            <div data-placeholder="Title goes here"></div>
          </mj-text>
        </mj-column>
      </mj-section>`
    });

    bm.add("paragraph", {
      label: "Paragraph",
      category: "Content",
      content: `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%">
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-text font-family="Arial" font-size="16px" font-style="normal" font-weight="400" color="#404B5A" align="left" line-height="22px" padding="0px" margin="0px">
            <div data-placeholder="Paragraph Text"></div>
          </mj-text>
        </mj-column>
      </mj-section>`
    });

    bm.add("image", {
      label: "Image",
      category: "Content",
      content: `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%">
        <mj-column padding="0px" margin="0px" width="100%" >
          <mj-text padding="0px" margin="0px">
            <div class="image-click-area" style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:6px; width:100%;margin:0 auto;cursor:pointer; height: 116px; background-color:#F6F7F9; border-radius: 8px; border: 1px dashed #1570EF;">
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
      content: `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%">
        <mj-column padding="0px" margin="0px" width="100%">
          <mj-button background-color="#295E3F" color="#ffffff" border-radius="8px" padding="0px" margin="0px" width="fit-content" font-family="Arial" font-size="14px" font-weight="500" line-height="20px" align="center" text-decoration="none">
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
          <mj-divider border-color="#dddddd" border-width="1px" padding="0px" margin="0px"></mj-divider>
        </mj-column>
      </mj-section>`
    });

    bm.add("Attachment", {
      label: "Attachment",
      category: "Content",
      content: `
        <mj-section full-width="full-width" data-type="attachment-placeholder" border="1px dashed #1570EF" padding="0px" margin="0px" width="100%" background-color="transparent" align="center" justify="center">
          <mj-column padding="0px" margin="0px" width="100%">
            <mj-text align="center" padding="0px" margin="0px">
              <div style="padding:20px;display:flex;justify-content:center;align-items:center;">
              <div style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;width:100%;padding: 20px 0; background:#F6F7F9; border-radius:6px">
                <img src="${imgIcon}" alt="imgIcon" style="width: 30px; height: 30px" />
                <p style="font-size:14px;font-weight:500;color:#404B5A;font-family:Inter,sans-serif;margin:0"><span class="browse-click-trigger" style="color:#1570EF;cursor:pointer;">click to browse</span> and upload your files here</p>
                <p style="color:#888E9E;text-align: center;font-size: 12px;font-weight: 400;line-height: 18px;margin:0">JPG, PNG, JPEG and PDF up to 10MB each.</p>
              </div>
              </div>
            </mj-text>
          </mj-column>
        </mj-section>`
    });

    // ── Component blocks (Original MJML Blocks) ──────────────────────────────────
    bm.add("custom-header", {
      label: "Header Banner",
      category: "Components",
      content: `
        <mj-section full-width="full-width" padding="0px" margin="0px" width="100%" background-color="#2f6f4e">
          <mj-column padding="0px" margin="0px" width="100%">
            <mj-text font-family="Arial" align="center" color="#ffffff" font-size="24px" font-weight="bold" padding="0px" margin="0px">
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
            <mj-text font-family="Arial" font-size="14px" color="#555555" line-height="1.6" padding="0px" margin="0px">
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
            <mj-button font-family="Arial" background-color="#2f6f4e" color="#ffffff" border-radius="6px" font-size="14px" width="100%" padding="0px" margin="0px" href="#" text-decoration="none">
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
            <mj-image src="${uploadImage}" padding="0px" margin="0px" width="100%" align="center"></mj-image>
            <mj-text font-family="Arial" font-size="14px" color="#555555" line-height="1.6" padding="0px" margin="0px">
              Add Image.
            </mj-text>
          </mj-column>
        </mj-section>`
    });
  }
}
