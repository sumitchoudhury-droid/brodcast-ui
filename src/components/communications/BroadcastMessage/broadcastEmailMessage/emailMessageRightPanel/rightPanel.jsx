import { useState, useEffect, useRef, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { useToast } from "../../../../../hooks/useToast";
import {
  uploadImageToServer,
  uploadBase64ToServer
} from "../../../../../utils/uploadUtils";

import "./style.scss";
import PreviewModal from "../emailMessagePreviewModal/previewModal";
import SignatureSection from "./signatureSection/SignatureSection";

import { DeviceSwitcher } from "./deviceSwitch/DeviceSwitcher";
import { BackgroundContainer } from "./backgroundContainer/backgroundContainer";
import { TextStyleContainer } from "./textStyleContainer/textStyleContainer";
import BorderContainer from "./borderContainer";
import { PaddingContainer } from "./paddingContainer";
import { DimensionContainer } from "./dimensionContainer/DimensionContainer";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";
import { ButtonSection } from "./buttonSection/index";
import { ImageSection } from "./imageSection/index";

// ─────────────────────────────────────────────────────────────────────────────
// Canvas iframe helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCanvasDoc(editor) {
  try {
    const frames = editor.Canvas.getFrames();
    if (!frames?.length) return null;
    const el = frames.at(0).view?.el;
    return el?.contentDocument || el?.contentWindow?.document || null;
  } catch {
    return null;
  }
}

function getComputedStyleOfComp(comp) {
  try {
    const view = comp?.getView?.();
    const el = view?.el;
    if (!el) return null;
    const win = el.ownerDocument?.defaultView;
    if (!win) return null;
    return win.getComputedStyle(el);
  } catch {
    return null;
  }
}

function rgbToHex(rgb) {
  if (!rgb) return "";
  if (rgb.startsWith("#")) return rgb;
  const match = rgb.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/
  );
  if (!match) return rgb;
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  if (match[4] !== undefined && parseFloat(match[4]) === 0) {
    return "transparent";
  }
  const hex =
    "#" +
    [r, g, b]
      .map((x) => {
        const hexParts = x.toString(16);
        return hexParts.length === 1 ? "0" + hexParts : hexParts;
      })
      .join("");
  return hex;
}

function getCanvasSelection(editor) {
  try {
    const frames = editor.Canvas.getFrames();
    if (!frames?.length) return null;
    const win = frames.at(0).view?.el?.contentWindow;
    return win?.getSelection() || null;
  } catch {
    return null;
  }
}

function hasSelection(sel) {
  return !!(sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed);
}

function execInCanvas(editor, command, value = null) {
  const doc = getCanvasDoc(editor);
  if (!doc) return false;
  try {
    doc.execCommand(command, false, value);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// syncContentToModel — used when RTE is still active (selection-based changes)
// ─────────────────────────────────────────────────────────────────────────────
function syncContentToModel(editor) {
  const selected = editor?.getSelected();
  if (!selected) return;
  const type = selected.get("type");
  if (type !== "mj-text" && type !== "mj-button") return;
  try {
    const view = selected.getView?.();
    const el = view?.el;
    if (!el) return;
    const editable = el.querySelector("[contenteditable]");
    if (!editable) return;
    const html = editable.innerHTML;
    if (html !== undefined) {
      selected.set("content", html, { silent: true });
    }
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// syncLiveContentToModel — call BEFORE addStyle() to prevent placeholder loss
//
// When a placeholder is inserted via execCommand, the canvas DOM has the new
// text but the GrapesJS model is stale.  addStyle() triggers a rerender which
// reads from the model, erasing the placeholder.
//
// This function reads the live DOM via view.getChildrenContainer() — which
// works even after the RTE has been deactivated (contenteditable removed) —
// and resets child component models so updateContent() will use model.content
// instead of re-rendering the (stale) child collection.
// ─────────────────────────────────────────────────────────────────────────────
function syncLiveContentToModel(selectedComp) {
  if (!selectedComp) return;
  const type = selectedComp.get("type");
  if (type !== "mj-text" && type !== "mj-button") return;
  try {
    const view = selectedComp.getView?.();
    const el = view?.el;
    if (!el) return;

    // Prefer contenteditable when RTE is active; fall back to the canonical
    // GrapesJS children container which points to the same inner element.
    let contentEl = el.querySelector("[contenteditable]");
    if (!contentEl) {
      contentEl = view.getChildrenContainer?.() ?? null;
    }
    if (!contentEl) return;

    const html = contentEl.innerHTML;
    if (!html) return;

    // Reset child component models so updateContent() uses model.content
    // (when children exist, updateContent sets innerHTML to '' instead).
    try {
      selectedComp.components().reset([], { silent: true });
    } catch {
      /* ignore */
    }

    selectedComp.set("content", html, { silent: true });
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// focusFirstListCell
// ─────────────────────────────────────────────────────────────────────────────
function focusFirstListCell(editor) {
  setTimeout(() => {
    const comp = editor?.getSelected();
    if (!comp) return;

    const view = comp.getView?.();
    const el = view?.el;
    if (!el) return;

    const canvasDoc = getCanvasDoc(editor);
    if (!canvasDoc) return;

    const editable = el.querySelector("[contenteditable]") || el;
    if (!editable) return;

    const cell = editable.querySelector(".list-content-cell");
    if (!cell) return;

    editable.focus();

    const sel = canvasDoc.defaultView?.getSelection();
    if (!sel) return;

    const range = canvasDoc.createRange();
    const firstChild = cell.firstChild;

    if (!firstChild) {
      range.setStart(cell, 0);
      range.collapse(true);
    } else if (firstChild.nodeName === "BR") {
      range.setStartBefore(firstChild);
      range.collapse(true);
    } else {
      // setStart on the child node itself (not the element container) so
      // range.startContainer is the text node, not cell. If it were cell,
      // pressing Enter would extractContents from offset 0 of the element,
      // capturing the entire cell content into the new row.
      range.setStart(firstChild, 0);
      range.collapse(true);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  }, 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// buildListHtml — div/span based (no tables)
// ─────────────────────────────────────────────────────────────────────────────
function buildListHtml({ tag, lines, color, fontSize, fontFamily }) {
  const isOrdered = tag === "ol";

  const rows = lines
    .map((line, i) => {
      const marker = isOrdered
        ? `<div class="list-marker-cell" style="flex-shrink:0;width:15px;color:${color};font-size:${fontSize};font-family:${fontFamily};white-space:nowrap;line-height:1.5; padding-right:16px">${i + 1}.&nbsp;</div>`
        : `<div class="list-marker-cell" style="flex-shrink:0;width:15px;color:${color};font-size:${fontSize};font-family:${fontFamily};white-space:nowrap;line-height:1.5; padding-right:16px">&bull;</div>`;

      return `<div class="list-item-row" style="display:flex;width:100%;padding:0px 0;">
        ${marker}
        <div class="list-content-cell" style="flex:1;color:${color};font-size:${fontSize};font-family:${fontFamily};line-height:1.5;text-align:left;">${line}</div>
      </div>`;
    })
    .join("\n");

  return `<div data-list-type="${tag}" style="width:100%; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; padding-left: 20px; box-sizing: border-box;">${rows}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// extractLinesFromContent
// ────────────────────────
// ─────────────────────────────────────────────────────
function extractLinesFromContent(html, doc) {
  const d = doc || window.document;
  const tmp = d.createElement("div");

  try {
    tmp.innerHTML = html;
  } catch {
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text ? [text] : ["List item"];
  }

  // Strip leading and trailing <br> tags that MJML injects around <p> elements.
  const cleanLine = (s) =>
    s
      .replace(/^(\s*<br\s*\/?>\s*)+/gi, "")
      .replace(/(\s*<br\s*\/?>\s*)+$/gi, "")
      .trim();

  // 1. Our div-based list format
  const listRows = tmp.querySelectorAll(
    "div.list-item-row, div[data-list-type] div.list-item-row"
  );
  if (listRows.length > 0) {
    const lines = [];
    listRows.forEach((row) => {
      const cell = row.querySelector(".list-content-cell");
      if (cell) lines.push(cleanLine(cell.innerHTML.trim()));
    });
    const filtered = lines.filter(Boolean);
    if (filtered.length > 0) return filtered;
  }

  // 2. Native <ul> / <ol>
  const lis = tmp.querySelectorAll("li");
  if (lis.length > 0) {
    return Array.from(lis)
      .map((li) => cleanLine(li.innerHTML.trim()))
      .filter(Boolean);
  }

  // 3. Headings and Paragraphs
  const blocks = tmp.querySelectorAll("h1, h2, h3, h4, h5, h6, p, div");
  if (blocks.length > 0) {
    const lines = Array.from(blocks)
      .map((b) => cleanLine(b.innerHTML.trim()))
      .filter(Boolean);
    if (lines.length > 0) return lines;
  }

  // 4. Fallback: split on line breaks
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [html.trim() || "List item"];
}

// ─────────────────────────────────────────────────────────────────────────────
// clearInternalStyles
// ─────────────────────────────────────────────────────────────────────────────
function clearInternalStyles(html, doc, styles = []) {
  if (!html) return html;
  const d = doc || window.document;
  const tmp = d.createElement("div");
  tmp.innerHTML = html;

  const cleanNode = (node) => {
    if (node.nodeType === 1) {
      styles.forEach((styleProp) => {
        // Clear both kebab-case and camelCase
        node.style.removeProperty(styleProp);
        const camelProp = styleProp.replace(/-([a-z])/g, (g) =>
          g[1].toUpperCase()
        );
        if (node.style[camelProp]) {
          node.style[camelProp] = "";
        }
      });
      if (styles.includes("color") && node.hasAttribute("color")) {
        node.removeAttribute("color");
      }
      if (
        (styles.includes("font-family") || styles.includes("fontFamily")) &&
        node.hasAttribute("face")
      ) {
        node.removeAttribute("face");
      }
      if (
        (styles.includes("font-size") || styles.includes("fontSize")) &&
        node.hasAttribute("size")
      ) {
        node.removeAttribute("size");
      }

      Array.from(node.childNodes).forEach(cleanNode);
    }
  };

  Array.from(tmp.childNodes).forEach(cleanNode);
  return tmp.innerHTML;
}

// ─────────────────────────────────────────────────────────────────────────────
// minifyHTML
// ─────────────────────────────────────────────────────────────────────────────
function minifyHTML(html) {
  if (!html) return "";
  return html
    .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments (incl. MSO conditionals)
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/>\s+</g, "><") // Remove whitespace between tags
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeHtmlForPreview
// The canvas HTML produced by getCompiledHtmlFromCanvas already has any
// div[data-type] elements moved out of their table wrappers (done at the source
// in editor.jsx so the serialised HTML is valid). This function re-parses the
// HTML through DOMParser as a sanity pass and removes any residual empty tables.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeHtmlForPreview(rawHtml) {
  if (!rawHtml) return rawHtml;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
    doc.querySelectorAll("table").forEach((table) => {
      if (!table.querySelector("tr, tbody, thead, tfoot")) {
        table.remove();
      }
    });
    return doc.documentElement.outerHTML;
  } catch {
    return rawHtml;
  }
}

// prepareHtmlForEmail
// Strips GrapesJS canvas editor artifacts (style blocks, data-gjs-* attributes,
// scripts) that are injected into the canvas iframe but are NOT part of the
// actual email HTML.  This typically saves 20-40 KB before the EmailJS check.
// ─────────────────────────────────────────────────────────────────────────────
function prepareHtmlForEmail(rawHtml) {
  if (!rawHtml) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // 1. Remove editor-only styles/selectors from preserved stylesheets
  const styles = doc.querySelectorAll("style");
  styles.forEach((styleTag) => {
    let content = styleTag.textContent;

    // Check if it is a GrapesJS/editor stylesheet
    const isEditorStyle =
      /\.gjs-|#gjs-|\bsp-container\b|\.CodeMirror|pointer-events\s*:\s*none|\[data-gjs-type\]/.test(
        content
      );
    const hasMediaQuery = /@media\s/i.test(content);

    if (isEditorStyle) {
      if (!hasMediaQuery) {
        // Drop pure-editor style blocks completely
        styleTag.remove();
      } else {
        // If it has media queries (like canvasCss), we keep it but clean up the editor-only padding rules
        content = content.replace(
          /\[data-type="row-frame-column"\]:not\(\[data-is-empty="true"\]\)(?:,\s*\[data-type="column-frame-column"\]:not\(\[data-is-empty="true"\]\))?\s*\{\s*padding-bottom\s*:\s*20px\s*!important;?\s*\}/gi,
          ""
        );
        content = content.replace(
          /\[data-type="column-frame-column"\]:not\(\[data-is-empty="true"\]\)\s*\{\s*padding-bottom\s*:\s*20px\s*!important;?\s*\}/gi,
          ""
        );
        styleTag.textContent = content;
      }
    }
  });

  // 2. Remove inline padding-bottom on elements that are row-frame-column or column-frame-column
  const frameElements = doc.querySelectorAll(
    '[data-type="row-frame-column"], [data-type="column-frame-column"]'
  );
  frameElements.forEach((el) => {
    if (el.style.paddingBottom) {
      el.style.paddingBottom = "";
    }
    const styleAttr = el.getAttribute("style");
    if (styleAttr) {
      const cleanStyle = styleAttr
        .replace(/padding-bottom\s*:\s*[^;]+;?/gi, "")
        .trim();
      el.setAttribute("style", cleanStyle);
    }
  });

  let html = doc.documentElement.outerHTML;

  // Remove <script> tags – not valid in email bodies
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove GrapesJS component data attributes (data-gjs-*)
  html = html.replace(/\s+data-gjs-[a-zA-Z0-9-]+(?:="[^"]*"|='[^']*')?/g, "");

  // Remove other editor-specific attributes (keep data-type — needed for column layout CSS)
  html = html.replace(/\s+data-is-empty(?:="[^"]*"|='[^']*')?/g, "");
  html = html.replace(/\s+data-column-count(?:="[^"]*"|='[^']*')?/g, "");
  html = html.replace(/\s+data-manual-width(?:="[^"]*"|='[^']*')?/g, "");

  // Remove selection/hover classes that might be in the HTML
  html = html.replace(/\s*gjs-selected\b/g, "");
  html = html.replace(/\s*gjs-hovered\b/g, "");

  return minifyHTML(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// setupBulletListKeyHandler — div-based
// ─────────────────────────────────────────────────────────────────────────────
function setupBulletListKeyHandler(editor) {
  const doc = getCanvasDoc(editor);
  if (!doc) return;

  const handleKeyDown = (e) => {
    const sel = doc.defaultView?.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    let node = range.startContainer;
    let li = null;
    let divRow = null;

    while (node && node !== doc.body) {
      if (node.nodeName === "LI") {
        li = node;
        break;
      }
      if (
        node.nodeName === "DIV" &&
        node.classList?.contains("list-item-row")
      ) {
        divRow = node;
        break;
      }
      node = node.parentNode;
    }

    if (!li && !divRow) return;

    // ─── Case: Backspace ───────────────────────────────────────────────────
    if (e.key === "Backspace") {
      const contentCell = divRow?.querySelector(".list-content-cell") || li;
      if (!contentCell) return;

      const isAtStart = range.startOffset === 0 && range.collapsed;
      if (!isAtStart) return;

      const isCellEmpty =
        contentCell.textContent.trim() === "" ||
        contentCell.innerHTML === "<br>";

      if (isCellEmpty) {
        e.preventDefault();

        const listContainer = divRow?.closest("div[data-list-type]");
        const prevRow = divRow?.previousElementSibling;

        if (divRow && listContainer) {
          if (prevRow) {
            const prevContentCell = prevRow.querySelector(".list-content-cell");
            divRow.remove();

            // Re-number ordered list
            if (listContainer.getAttribute("data-list-type") === "ol") {
              Array.from(
                listContainer.querySelectorAll("div.list-item-row")
              ).forEach((row, i) => {
                const mc = row.querySelector(".list-marker-cell");
                if (mc) mc.innerHTML = `${i + 1}.&nbsp;`;
              });
            }

            // Focus end of previous row
            if (prevContentCell) {
              const newRange = doc.createRange();
              newRange.selectNodeContents(prevContentCell);
              newRange.collapse(false);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          } else {
            // First/only row — convert list back to plain paragraph
            const parent = listContainer.parentNode;
            const p = doc.createElement("p");
            p.innerHTML = "<br>";
            parent.insertBefore(p, listContainer);
            listContainer.remove();

            const newRange = doc.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }

        // Native LI fallback
        if (li) {
          const list = li.parentNode;
          li.remove();
          if (!list.children.length) list.remove();
        }

        // Sync model
        const selected = editor?.getSelected();
        if (selected) {
          const view = selected.getView?.();
          const editable =
            view?.el?.querySelector("[contenteditable]") || view?.el;
          if (editable)
            selected.set("content", editable.innerHTML, { silent: true });
        }
      }
      return;
    }

    // ─── Case: Enter ───────────────────────────────────────────────────────
    if (e.key === "Enter") {
      e.preventDefault();
      // stopImmediatePropagation prevents GrapesJS's RTE from also handling
      // Enter and injecting its own <br> into the current cell.
      e.stopImmediatePropagation();

      // Native <li> branch
      if (li) {
        const list = li.parentNode;
        if (li.textContent.trim() === "") {
          const p = doc.createElement("p");
          p.innerHTML = "<br>";
          list.parentNode.insertBefore(p, list.nextSibling);
          li.remove();
          if (!list.children.length) list.remove();
          const newRange = doc.createRange();
          newRange.setStart(p, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          const newLi = doc.createElement("li");
          const afterRange = range.cloneRange();
          const lastChild = li.lastChild;
          if (lastChild) afterRange.setEndAfter(lastChild);
          const fragment = afterRange.extractContents();
          newLi.appendChild(fragment);
          if (!newLi.textContent && !newLi.querySelector("br"))
            newLi.innerHTML = "<br>";
          list.insertBefore(newLi, li.nextSibling);
          const newRange = doc.createRange();
          newRange.setStart(newLi, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }

        const selected = editor?.getSelected();
        if (selected) {
          const view = selected.getView?.();
          const editable =
            view?.el?.querySelector("[contenteditable]") || view?.el;
          if (editable)
            selected.set("content", editable.innerHTML, { silent: true });
        }
        return;
      }

      // Div-row branch
      if (divRow) {
        const listContainer = divRow.closest("div[data-list-type]");
        if (!listContainer) return;

        const contentCell = divRow.querySelector(".list-content-cell");
        if (!contentCell) return;

        let editableRoot = contentCell.parentNode;
        while (editableRoot && !editableRoot.hasAttribute("contenteditable")) {
          editableRoot = editableRoot.parentNode;
        }

        const newRow = divRow.cloneNode(true);
        const newContentCell = newRow.querySelector(".list-content-cell");
        // Empty string — no <br> placeholder. An empty div has exactly one
        // valid cursor position (offset 0) so Chrome can't render it
        // ambiguously. <br> in an empty div causes Chrome to place the cursor
        // on the line AFTER the break instead of before it.
        newContentCell.innerHTML = "";

        divRow.parentNode.insertBefore(newRow, divRow.nextSibling);

        // Re-number ordered list
        if (listContainer.getAttribute("data-list-type") === "ol") {
          Array.from(
            listContainer.querySelectorAll("div.list-item-row")
          ).forEach((row, i) => {
            const mc = row.querySelector(".list-marker-cell");
            if (mc) mc.innerHTML = `${i + 1}.&nbsp;`;
          });
        }

        // Focus the contenteditable container first so the selection sticks.
        if (editableRoot) editableRoot.focus();

        const newRange = doc.createRange();
        newRange.setStart(newContentCell, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        if (editableRoot) {
          const selected = editor?.getSelected();
          if (selected)
            selected.set("content", editableRoot.innerHTML, { silent: true });
        }
      }
      return;
    }
  };

  doc.addEventListener("keydown", handleKeyDown, true);
  return () => doc.removeEventListener("keydown", handleKeyDown, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// RightPanel Helpers
// ─────────────────────────────────────────────────────────────────────────────
const isText = (comp) => {
  if (!comp) return false;
  const type = comp.get("type");
  const tag = comp.get("tagName");
  return (
    comp.is("mj-text") ||
    type === "text" ||
    tag === "p" ||
    tag === "span" ||
    tag === "div" ||
    ["h1", "h2", "h3", "h4", "h5", "h6", "td", "th", "font"].includes(tag)
  );
};

const isButton = (comp) => {
  if (!comp) return false;
  const type = comp.get("type");
  const tag = comp.get("tagName");
  return (
    comp.is("mj-button") ||
    comp.is("link") ||
    comp.is("button") ||
    type === "link" ||
    type === "button" ||
    tag === "a" ||
    tag === "button"
  );
};

const isImage = (comp) => {
  if (!comp) return false;
  const type = comp.get("type");
  const tag = comp.get("tagName");
  return (
    comp.is("mj-image") || comp.is("image") || type === "image" || tag === "img"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RightPanel
// ─────────────────────────────────────────────────────────────────────────────
export default function RightPanel({ editorRef, isEditorEmpty }) {
  const toast = useToast();

  const [showPreview, setShowPreview] = useState(false);
  const [showSendTestMail, setShowSendTestMail] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("");
  const [selectedComp, setSelectedComp] = useState(null);

  const [bgColor, setBgColor] = useState("transparent");
  const [bgImage, setBgImage] = useState("");
  const [bgRepeat, setBgRepeat] = useState("no-repeat");
  const [bgSize, setBgSize] = useState("contain");

  const [borderWidth, setBorderWidth] = useState("");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderRadius, setBorderRadius] = useState({
    tl: "",
    tr: "",
    br: "",
    bl: ""
  });

  const [width, setWidth] = useState("0");
  const [widthUnit, setWidthUnit] = useState("%");
  const [height, setHeight] = useState("0");
  const [heightUnit, setHeightUnit] = useState("auto");

  const [textColor, setTextColor] = useState("#000000");
  const [typography, setTypography] = useState({
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: "14",
    textAlign: "left"
  });

  const [activeFormats, setActiveFormats] = useState({});
  const [alignItems, setAlignItems] = useState("flex-start");
  const [justifyContent, setJustifyContent] = useState("flex-start");
  const [padding, setPadding] = useState({
    top: "",
    right: "",
    bottom: "",
    left: ""
  });
  const [gap, setGap] = useState({ gap: "0" });

  const [colWidth, setColWidth] = useState("0");
  const [colWidthUnit, setColWidthUnit] = useState("%");
  const [colHeight, setColHeight] = useState("0");
  const [colHeightUnit, setColHeightUnit] = useState("auto");
  const [colTarget, setColTarget] = useState(null);

  const [buttonUrl, setButtonUrl] = useState("");
  const [imageLink, setImageLink] = useState("");

  const colorInputRef = useRef(null);
  const bgImageInputRef = useRef(null);
  const cleanupRef = useRef(null);
  // Tracks the DOM node where the cursor last was inside the canvas iframe.
  // Read by toggleListAtCursor after the iframe loses focus on button click.
  const lastCursorNodeRef = useRef(null);

  // Returns the <td> that directly parents all mj-column divs inside a section view.
  // Works whether `el` is the section root or an mj-column inside it.
  const getColumnContainerTd = (el) => {
    if (!el) return null;
    // If el is an mj-column div, its parentElement is the td.
    if (el.dataset?.gjsType === "mj-column")
      return el.parentElement?.tagName === "TD" ? el.parentElement : null;
    // Otherwise (section root), find the first column child and climb up.
    const firstCol = el.querySelector("[data-gjs-type='mj-column']");
    return firstCol?.parentElement?.tagName === "TD"
      ? firstCol.parentElement
      : null;
  };

  const getParentSection = (comp) => {
    let curr = comp;
    while (curr) {
      const type = curr.get("type");
      if (type === "mj-section" || type === "mj-hero") return curr;
      curr = curr.parent();
    }
    return null;
  };

  const syncFlexToTd = (td, ai, jc, g) => {
    if (!td) return;
    td.style.setProperty("display", "flex", "important");
    td.style.setProperty("flex-direction", "row", "important");
    td.style.setProperty("flex-wrap", "nowrap", "important");
    td.style.setProperty("align-items", ai, "important");
    td.style.setProperty("justify-content", jc, "important");

    const gapVal = g?.gap;
    if (gapVal === "" || gapVal === undefined || gapVal === "0") {
      td.style.removeProperty("gap");
    } else {
      td.style.setProperty("gap", `${gapVal}px`, "important");
    }
  };

  // ─── Attach bullet-list key handler ────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const attachHandler = () => {
      if (cleanupRef.current) return;
      cleanupRef.current = setupBulletListKeyHandler(editor);
    };

    editor.on("load", attachHandler);
    if (editor.Canvas?.getFrames?.()?.length) attachHandler();

    return () => {
      editor.off("load", attachHandler);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [editorRef]);

  // ─── Track last canvas cursor node (before iframe loses focus on button click) ─
  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    let cleanupTracker = null;

    const attachTracker = () => {
      if (cleanupTracker) return;
      const doc = getCanvasDoc(editor);
      if (!doc) return;

      const track = () => {
        const sel = doc.defaultView?.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        let node = sel.getRangeAt(0).startContainer;
        if (node.nodeType === 3) node = node.parentNode;
        lastCursorNodeRef.current = node;
      };

      doc.addEventListener("mouseup", track);
      doc.addEventListener("keyup", track);
      cleanupTracker = () => {
        doc.removeEventListener("mouseup", track);
        doc.removeEventListener("keyup", track);
      };
    };

    editor.on("load", attachTracker);
    if (editor.Canvas?.getFrames?.()?.length) attachTracker();

    return () => {
      editor.off("load", attachTracker);
      if (cleanupTracker) cleanupTracker();
    };
  }, [editorRef]);

  // ─── Sync panel from selected component ────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    const updateState = () => {
      let selected = editor.getSelected();
      if (!selected) {
        setSelectedComp(null);
        return;
      }

      // Walk up to find if selected component is inside an attachment block
      let current = selected;
      let attachmentAncestor = null;
      while (current) {
        const dt = current.getAttributes?.()?.["data-type"];
        if (dt === "attachment-filled" || dt === "attachment-placeholder") {
          attachmentAncestor = current;
          break;
        }
        current = current.parent();
      }

      if (attachmentAncestor) {
        selected = attachmentAncestor;
      }

      setSelectedComp(selected);

      let dimTarget = selected;
      if (["mj-text", "mj-divider", "mj-raw"].includes(selected.get("type"))) {
        const parent = selected.parent();
        if (parent && parent.get("type") === "mj-column") {
          const isInsideRowFrame =
            parent.getAttributes?.()?.["data-type"] === "row-frame-column";
          if (!isInsideRowFrame) {
            dimTarget = parent;
          }
        }
      }

      const style = selected.getStyle();
      const computedStyle = getComputedStyleOfComp(selected) || {};
      const dimStyle = dimTarget.getStyle() || {};
      const dimComputedStyle = getComputedStyleOfComp(dimTarget) || {};
      const dimAttrs = dimTarget.getAttributes() || {};

      setBgColor(
        rgbToHex(dimStyle["background-color"]) ||
          rgbToHex(dimComputedStyle["background-color"]) ||
          "transparent"
      );
      setBgImage(
        dimStyle["background-image"]?.match(/url\((['"]?)(.*?)\1\)/)?.[2] ||
          dimComputedStyle["background-image"]?.match(
            /url\((['"]?)(.*?)\1\)/
          )?.[2] ||
          ""
      );
      setBgRepeat(
        dimStyle["background-repeat"] ||
          dimComputedStyle["background-repeat"] ||
          "no-repeat"
      );
      const rawSize =
        dimStyle["object-fit"] ||
        dimStyle["background-size"] ||
        dimComputedStyle["object-fit"] ||
        dimComputedStyle["background-size"] ||
        "contain";
      setBgSize(rawSize === "100% 100%" ? "fill" : rawSize);

      const border =
        dimAttrs["border"] ||
        dimStyle["border"] ||
        dimComputedStyle["border"] ||
        "";
      const bp = border ? border.split(" ") : [];
      if (bp.length >= 3) {
        setBorderWidth(bp[0].replace("px", "") || "");
        setBorderStyle(bp[1]);
        setBorderColor(rgbToHex(bp[2]));
      } else {
        setBorderWidth("");
      }
      // Read border-radius from MJML attribute first, then fall back to CSS style
      const rawBrAttr =
        dimAttrs["border-radius"] ||
        dimStyle["border-radius"] ||
        dimComputedStyle["border-radius"] ||
        "";
      const brShorthand = rawBrAttr ? rawBrAttr.split(" ") : [];
      const getBrPart = (idx) => {
        if (brShorthand.length === 0) return "";
        if (brShorthand.length === 1) return brShorthand[0].replace("px", "");
        if (brShorthand.length === 2)
          return brShorthand[idx % 2].replace("px", "");
        if (brShorthand.length === 3) {
          if (idx === 0) return brShorthand[0].replace("px", "");
          if (idx === 1 || idx === 3) return brShorthand[1].replace("px", "");
          if (idx === 2) return brShorthand[2].replace("px", "");
        }
        if (brShorthand.length >= 4) return brShorthand[idx].replace("px", "");
        return "";
      };

      setBorderRadius({
        tl:
          dimStyle["border-top-left-radius"]?.replace("px", "") ||
          dimComputedStyle["border-top-left-radius"]?.replace("px", "") ||
          getBrPart(0) ||
          "",
        tr:
          dimStyle["border-top-right-radius"]?.replace("px", "") ||
          dimComputedStyle["border-top-right-radius"]?.replace("px", "") ||
          getBrPart(1) ||
          "",
        br:
          dimStyle["border-bottom-right-radius"]?.replace("px", "") ||
          dimComputedStyle["border-bottom-right-radius"]?.replace("px", "") ||
          getBrPart(2) ||
          "",
        bl:
          dimStyle["border-bottom-left-radius"]?.replace("px", "") ||
          dimComputedStyle["border-bottom-left-radius"]?.replace("px", "") ||
          getBrPart(3) ||
          ""
      });

      if (isText(selected) || isButton(selected) || isImage(selected)) {
        const currentFontSize =
          style["font-size"]?.replace("px", "") ||
          computedStyle["font-size"]?.replace("px", "") ||
          "";
        setTextColor(
          rgbToHex(style["color"]) ||
            rgbToHex(computedStyle["color"]) ||
            "#000000"
        );
        setTypography({
          fontFamily:
            style["font-family"]?.replace(/['"]/g, "") ||
            computedStyle["font-family"]?.replace(/['"]/g, "") ||
            "Inter",
          fontWeight:
            style["font-weight"] || computedStyle["font-weight"] || "400",
          fontSize: currentFontSize,
          textAlign:
            style["text-align"] || computedStyle["text-align"] || "left"
        });

        const textDecoration =
          style["text-decoration"] || computedStyle["text-decoration"] || "";
        const content = selected.get("content") || "";
        const hasUl =
          /data-list-type="ul"/i.test(content) || /<ul[\s>]/i.test(content);
        const hasOl =
          /data-list-type="ol"/i.test(content) || /<ol[\s>]/i.test(content);

        setActiveFormats({
          underline: textDecoration.includes("underline"),
          lineThrough: textDecoration.includes("line-through"),
          strikethrough: textDecoration.includes("line-through"),
          italic:
            (style["font-style"] || computedStyle["font-style"] || "") ===
            "italic",
          bold:
            style["font-weight"] === "700" ||
            style["font-weight"] === "bold" ||
            computedStyle["font-weight"] === "700" ||
            computedStyle["font-weight"] === "bold",
          uppercase:
            (style["text-transform"] ||
              computedStyle["text-transform"] ||
              "") === "uppercase",
          superscript:
            (style["vertical-align"] ||
              computedStyle["vertical-align"] ||
              "") === "super",
          subscript:
            (style["vertical-align"] ||
              computedStyle["vertical-align"] ||
              "") === "sub",
          unorderedList: hasUl,
          orderedList: hasOl,
          code: (
            style["font-family"] ||
            computedStyle["font-family"] ||
            ""
          ).includes("monospace"),
          highlight:
            (style["background-color"] ||
              computedStyle["background-color"] ||
              "") === "#ffff00",
          indentLevel: Math.floor(
            parseInt(
              style["padding-left"] || computedStyle["padding-left"] || "0",
              10
            ) / 24
          )
        });

        if (isButton(selected)) {
          setButtonUrl(selected.getAttributes().href || "");
        }
        if (isImage(selected)) {
          let linkUrl = "";
          if (selected.is("mj-image")) {
            linkUrl = selected.getAttributes().href || "";
          } else {
            const parent = selected.parent();
            if (
              parent &&
              (parent.get("tagName") === "a" || parent.get("type") === "link")
            ) {
              linkUrl = parent.getAttributes().href || "";
            }
          }
          setImageLink(linkUrl);
        }
      } else {
        // Sync textAlign for other components (like mj-column or sections)
        setTypography((prev) => ({
          ...prev,
          textAlign:
            style["text-align"] ||
            computedStyle["text-align"] ||
            selected.getAttributes()?.align ||
            "left"
        }));
        setActiveFormats({});
      }

      if (dimTarget.get("type") === "mj-column") {
        // Column: vertical-align is the MJML inline-block equivalent of align-items
        const va =
          dimStyle["vertical-align"] ||
          dimAttrs["vertical-align"] ||
          dimComputedStyle["vertical-align"] ||
          "top";
        setAlignItems(
          va === "middle" || va === "center"
            ? "center"
            : va === "bottom"
              ? "flex-end"
              : "flex-start"
        );
      } else {
        // Section: align-items is stored directly in the model style
        setAlignItems(
          dimStyle["align-items"] ||
            dimComputedStyle["align-items"] ||
            "flex-start"
        );
      }
      setJustifyContent(
        dimStyle["justify-content"] ||
          dimComputedStyle["justify-content"] ||
          "flex-start"
      );

      const rawPadding =
        style["padding"] ||
        selected.getAttributes?.()["padding"] ||
        computedStyle["padding"] ||
        "";
      const getPaddingValue = (side) => {
        const specific =
          style[`padding-${side}`] ||
          selected.getAttributes?.()[`padding-${side}`] ||
          computedStyle?.[`padding-${side}`];
        if (specific) return specific.replace("px", "") || "";

        if (!rawPadding) return "";
        const parts = rawPadding.trim().replace(/\s+/g, " ").split(" ");
        if (parts.length === 1) {
          return parts[0].replace("px", "") || "";
        }
        if (parts.length === 2) {
          if (side === "top" || side === "bottom")
            return parts[0].replace("px", "") || "";
          if (side === "left" || side === "right")
            return parts[1].replace("px", "") || "";
        }
        if (parts.length === 3) {
          if (side === "top") return parts[0].replace("px", "") || "";
          if (side === "left" || side === "right")
            return parts[1].replace("px", "") || "";
          if (side === "bottom") return parts[2].replace("px", "") || "";
        }
        if (parts.length >= 4) {
          const idxMap = { top: 0, right: 1, bottom: 2, left: 3 };
          return parts[idxMap[side]].replace("px", "") || "";
        }
        return "";
      };

      setPadding({
        top: getPaddingValue("top"),
        right: getPaddingValue("right"),
        bottom: getPaddingValue("bottom"),
        left: getPaddingValue("left")
      });

      setGap({
        gap:
          dimStyle["gap"]?.replace("px", "") ||
          dimStyle["row-gap"]?.replace("px", "") ||
          dimComputedStyle["gap"]?.replace("px", "") ||
          dimComputedStyle["row-gap"]?.replace("px", "") ||
          ""
      });

      const parseValueAndUnit = (val, defaultUnit = "%") => {
        if (!val) return { value: "", unit: defaultUnit };
        if (val === "auto") return { value: "", unit: "auto" };
        const m = val.match(/^(\d+(?:\.\d+)?)(%|px)$/);
        if (m) return { value: m[1], unit: m[2] };
        return {
          value: val.replace(/[^\d.]/g, ""),
          unit: val.replace(/[\d.]/g, "") || defaultUnit
        };
      };

      const { value: wVal, unit: wUnit } = parseValueAndUnit(
        dimAttrs["width"] ||
          dimStyle["width"] ||
          dimComputedStyle["width"] ||
          ""
      );
      const { value: hVal, unit: hUnit } = parseValueAndUnit(
        dimAttrs["height"] ||
          dimStyle["height"] ||
          dimComputedStyle["height"] ||
          "",
        "auto"
      );

      if (wVal) {
        setWidth(wVal);
        setWidthUnit(wUnit);
      } else {
        setWidth("0");
        setWidthUnit("%");
      }

      // Force height to auto for components that only support Auto height in the UI
      // (mj-image, mj-column, mj-section, mj-hero, etc.)
      const needsAutoHeight =
        isImage(selected) ||
        selected.is("mj-column") ||
        selected.is("mj-section") ||
        selected.is("mj-hero");

      if (needsAutoHeight && hUnit !== "auto") {
        setHeight("");
        setHeightUnit("auto");
        // Update both the selected component and the dimTarget (which might be the parent column)
        selected.addAttributes({ height: "auto" });
        selected.addStyle({ height: "auto" });
        if (dimTarget && dimTarget !== selected) {
          dimTarget.addAttributes({ height: "auto" });
          dimTarget.addStyle({ height: "auto" });
        }
        editor.trigger("component:update", selected);
      } else if (hVal || hUnit === "auto") {
        setHeight(hVal);
        setHeightUnit(hUnit);
      } else {
        setHeight("");
        setHeightUnit("auto");
      }

      // ─── Sync Parent Column Dimensions (for layout rebalancing) ───
      let parentCol = null;
      if (
        ["mj-text", "mj-divider", "mj-raw", "mj-image"].includes(
          selected.get("type")
        )
      ) {
        const p = selected.parent();
        if (p && p.get("type") === "mj-column") {
          const isInsideRowFrame =
            p.getAttributes?.()?.["data-type"] === "row-frame-column";
          if (!isInsideRowFrame || selected.get("type") === "mj-image") {
            parentCol = p;
          }
        }
      }
      setColTarget(parentCol);
      if (parentCol) {
        const cAttrs = parentCol.getAttributes() || {};
        const { value: cw, unit: cu } = parseValueAndUnit(
          cAttrs["width"] || ""
        );
        const { value: ch, unit: chu } = parseValueAndUnit(
          cAttrs["height"] || ""
        );
        setColWidth(cw || "");
        setColWidthUnit(cu || "%");
        setColHeight(ch || "");
        setColHeightUnit(chu || "auto");
      }

      // ─── Sync layout to canvas DOM ───
      // MJML doesn't support gap/align-items on sections natively.
      // We re-apply our flex hack every time the component updates.
      // We always target the parent section's TD regardless of which child is selected.
      const parentSection = getParentSection(selected);
      if (parentSection) {
        const psStyle = parentSection.getStyle() || {};

        const psAi = psStyle["align-items"] || "flex-start";
        const psJc = psStyle["justify-content"] || "flex-start";
        const psGap = {
          gap:
            psStyle["gap"]?.replace("px", "") ||
            psStyle["row-gap"]?.replace("px", "") ||
            "0"
        };

        const psEl = parentSection.getView?.()?.el;
        setTimeout(() => {
          const td = getColumnContainerTd(psEl);
          if (td) syncFlexToTd(td, psAi, psJc, psGap);
        }, 0);
      }
    };

    editor.on("component:selected", updateState);
    editor.on("component:update:style", updateState);
    editor.on("component:update:attributes", updateState);
    editor.on("component:update", updateState);
    return () => {
      editor.off("component:selected", updateState);
      editor.off("component:update:style", updateState);
      editor.off("component:update:attributes", updateState);
      editor.off("component:update", updateState);
    };
  }, [editorRef]);

  // ─── Layout ────────────────────────────────────────────────────────────────

  // Helper to fetch the proper target (mj-column usually, unless section is explicitly targeted)
  const getStyleTarget = () => {
    if (!selectedComp) return null;
    let target = selectedComp;
    if (
      ["mj-text", "mj-divider", "mj-raw"].includes(selectedComp.get("type"))
    ) {
      const parent = selectedComp.parent();
      if (parent && parent.get("type") === "mj-column") {
        const isInsideRowFrame =
          parent.getAttributes?.()?.["data-type"] === "row-frame-column";
        if (!isInsideRowFrame) {
          target = parent;
        }
      }
    }
    return target;
  };

  // ─── Background ────────────────────────────────────────────────────────────
  const handleBgColorChange = (c) => {
    setBgColor(c);
    const target = getStyleTarget();
    if (target) {
      target.addStyle({ "background-color": c });
      // For MJML leaf components (mj-text, mj-image, etc.) the per-cell
      // background is controlled by the container-background-color attribute.
      if (
        ["mj-text", "mj-image", "mj-divider", "mj-raw"].includes(
          target.get("type")
        )
      ) {
        target.addAttributes({ "container-background-color": c });
      }
      editorRef.current?.getEditor()?.trigger("component:update", target);
    }
  };
  const removeBgImage = () => {
    setBgImage("");
    const target = getStyleTarget();
    if (target) {
      target.addStyle({ "background-image": "none" });
      if (
        ["mj-text", "mj-image", "mj-divider", "mj-raw"].includes(
          target.get("type")
        )
      ) {
        target.addAttributes({ "container-background-color": "" });
      }
      editorRef.current?.getEditor()?.trigger("component:update", target);
    }
  };
  const handleBgRepeatChange = (r) => {
    setBgRepeat(r);
    const target = getStyleTarget();
    if (target) {
      target.addStyle({ "background-repeat": r });
      editorRef.current?.getEditor()?.trigger("component:update", target);
    }
  };
  const handleBgSizeChange = (s) => {
    setBgSize(s);
    const target = getStyleTarget();
    if (target) {
      if (target.get("type") === "mj-image") {
        target.addStyle({ "object-fit": s });
        // Use the unified helper to ensure model, attributes, and styles are in sync
        updateDimensionOnTarget(target, "width", "100%");

        // For mj-image, height: 100% often causes the image to collapse if parent height is auto.
        // We set it to auto to ensure it stays visible and responsive.
        target.addAttributes({ height: "auto" });
        target.addStyle({ height: "auto", "min-height": "auto" });
      } else {
        target.addStyle({ "background-size": s === "fill" ? "100% 100%" : s });
      }
      editorRef.current?.getEditor()?.trigger("component:update", target);
    }
  };
  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    const target = getStyleTarget();
    if (!file || !target) return;

    try {
      const url = await uploadImageToServer(file);
      if (!url) return;

      setBgImage(url);
      target.addStyle({
        "background-image": `url(${url})`,
        "background-repeat": "no-repeat",
        "background-size": "contain",
        "background-position": "center"
      });
      editorRef.current?.getEditor()?.trigger("component:update", target);
      e.target.value = "";
    } catch (err) {
      console.error("Error uploading background image:", err);
      toast.error(
        "Upload Failed",
        "Could not upload image to hosting service."
      );
    }
  };

  // ─── Dimensions ────────────────────────────────────────────────────────────
  const updateDimensionOnTarget = (target, dim, fullValue) => {
    if (fullValue === "%" || fullValue === "px" || fullValue === "") {
      target.removeAttributes(dim);
      target.addStyle({ [dim]: "" }); // GrapesJS addStyle with empty string removes it
    } else {
      target.set(dim, fullValue);
      target.addAttributes({ [dim]: fullValue });
      target.addStyle({ [dim]: fullValue });

      // For text-based components, sync max-width with width to ensure
      // the canvas respects the constraint correctly.
      if (
        dim === "width" &&
        ["mj-text", "mj-divider", "mj-raw"].includes(target.get("type"))
      ) {
        target.addStyle({ "max-width": fullValue });
      }
    }
    editorRef.current?.getEditor()?.trigger("component:update", target);

    // In MJML, a column's width determines the sibling/parent table layout.
    // If the target is an inner column, we must re-render its parent mj-section.
    if (
      target.get("type") === "mj-column" &&
      target.parent()?.get("type") === "mj-section"
    ) {
      const parent = target.parent();
      if (parent.getView) {
        setTimeout(() => {
          parent.getView()?.render();
          editorRef.current?.getEditor()?.trigger("component:update", parent);
        }, 50);
      }
    }
  };

  const handleWidthChange = (val, unit = widthUnit) => {
    const full = `${val}${unit}`;
    setWidth(val);
    setWidthUnit(unit);
    if (selectedComp) {
      const target = getStyleTarget();
      updateDimensionOnTarget(target, "width", full);

      // ─── Dynamic Column Rebalancing (v2: Selective) ───
      // Mark the edited column as "manual" and only rebalance the "auto" ones.
      if (
        target.get("type") === "mj-column" &&
        unit === "%" &&
        target.parent()?.getAttributes()["data-type"] === "column-frame-section"
      ) {
        const parent = target.parent();
        target.addAttributes({ "data-manual-width": "true" });

        const allCols = parent
          .components()
          .filter((c) => c.get("type") === "mj-column");

        const manualCols = allCols.filter(
          (c) => c.getAttributes()["data-manual-width"] === "true"
        );
        const autoCols = allCols.filter(
          (c) => c.getAttributes()["data-manual-width"] !== "true"
        );

        if (autoCols.length > 0) {
          // Calculate sum of manual widths
          let manualSum = 0;
          manualCols.forEach((mc) => {
            const wAttr = mc.getAttributes()["width"] || "0%";
            manualSum += parseFloat(wAttr);
          });

          const remaining = Math.max(0, 100 - manualSum);
          const sharedWidth = `${(remaining / autoCols.length).toFixed(4)}%`;

          autoCols.forEach((ac) => {
            ac.addAttributes({ width: sharedWidth });
            ac.addStyle({ width: sharedWidth });
            ac.set("width", sharedWidth);
          });
        }

        // Pulse parent to update canvas
        editorRef.current?.getEditor()?.trigger("component:update", parent);
      }
    }
  };

  const handleHeightChange = (val, unit = heightUnit) => {
    const selected = editorRef.current?.getEditor()?.getSelected();
    const needsAuto =
      selected &&
      (isImage(selected) ||
        selected.is("mj-column") ||
        selected.is("mj-section") ||
        selected.is("mj-hero"));

    let full;
    if (unit === "auto" || needsAuto) {
      full = "auto";
      setHeight("");
      setHeightUnit("auto");
    } else {
      full = val ? `${val}${unit}` : unit;
      setHeight(val);
    }
    setHeightUnit(unit);
    if (selectedComp) {
      const target = getStyleTarget();
      updateDimensionOnTarget(target, "height", full);
    }
  };

  const handleColWidthChange = (val, unit = colWidthUnit) => {
    const full = `${val}${unit}`;
    setColWidth(val);
    setColWidthUnit(unit);
    if (colTarget) {
      updateDimensionOnTarget(colTarget, "width", full);

      // ─── Dynamic Column Rebalancing (Selective) ───
      if (
        unit === "%" &&
        colTarget.parent()?.getAttributes()["data-type"] ===
          "column-frame-section"
      ) {
        const parent = colTarget.parent();
        colTarget.addAttributes({ "data-manual-width": "true" });

        const allCols = parent
          .components()
          .filter((c) => c.get("type") === "mj-column");

        const manualCols = allCols.filter(
          (c) => c.getAttributes()["data-manual-width"] === "true"
        );
        const autoCols = allCols.filter(
          (c) => c.getAttributes()["data-manual-width"] !== "true"
        );

        if (autoCols.length > 0) {
          let manualSum = 0;
          manualCols.forEach((mc) => {
            const wAttr = mc.getAttributes()["width"] || "0%";
            manualSum += parseFloat(wAttr);
          });

          const remaining = Math.max(0, 100 - manualSum);
          const sharedWidth = `${(remaining / autoCols.length).toFixed(4)}%`;

          autoCols.forEach((ac) => {
            ac.addAttributes({ width: sharedWidth });
            ac.addStyle({ width: sharedWidth });
            ac.set("width", sharedWidth);
          });
        }
        editorRef.current?.getEditor()?.trigger("component:update", parent);
      }
    }
  };

  const handleColHeightChange = (val, unit = colHeightUnit) => {
    let full;
    if (unit === "auto") {
      full = "auto";
      setColHeight("");
    } else {
      full = val ? `${val}${unit}` : unit;
      setColHeight(val);
    }
    setColHeightUnit(unit);
    if (colTarget) {
      updateDimensionOnTarget(colTarget, "height", full);
    }
  };

  // ─── Border ────────────────────────────────────────────────────────────────
  const handleBorderChange = (key, value) => {
    let nW = borderWidth,
      nS = borderStyle,
      nC = borderColor;
    if (key === "width") {
      nW = value;
      setBorderWidth(value);
    }
    if (key === "style") {
      nS = value;
      setBorderStyle(value);
    }
    if (key === "color") {
      nC = value;
      setBorderColor(value);
    }
    const target = getStyleTarget();
    if (target) {
      const borderValue = `${nW || 0}px ${nS} ${nC}`;
      target.addStyle({ border: borderValue });
      // Set as MJML attribute so it compiles into preview/inbox HTML
      target.addAttributes({ border: borderValue });
      editorRef.current?.getEditor()?.trigger("component:update", target);
    }
  };
  const handleBorderRadiusChange = (corner, value) => {
    const newBorderRadius = { ...borderRadius, [corner]: value };
    setBorderRadius(newBorderRadius);
    const target = getStyleTarget();
    if (target) {
      const cornerMap = {
        tl: "border-top-left-radius",
        tr: "border-top-right-radius",
        br: "border-bottom-right-radius",
        bl: "border-bottom-left-radius"
      };
      // Apply individual corner as CSS style for canvas display
      target.addStyle({ [cornerMap[corner]]: `${value}px` });
      // Also set combined border-radius as MJML attribute so it compiles into preview/inbox HTML
      const { tl, tr, br, bl } = newBorderRadius;
      const radiusShorthand = `${tl || 0}px ${tr || 0}px ${br || 0}px ${bl || 0}px`;
      target.addAttributes({ "border-radius": radiusShorthand });
      editorRef.current?.getEditor()?.trigger("component:update", target);
    }
  };

  // ─── Typography ────────────────────────────────────────────────────────────
  const handleTextColorChange = (c) => {
    setTextColor(c);
    if (selectedComp && (isText(selectedComp) || isButton(selectedComp))) {
      const editor = editorRef.current?.getEditor();
      const sel = editor ? getCanvasSelection(editor) : null;

      // If user has text selected inside the editor, apply color only to that selection
      if (hasSelection(sel)) {
        execInCanvas(editor, "foreColor", c);
        syncContentToModel(editor);
        return;
      }

      // No selection — apply color to the whole component.
      // Sync live canvas content first so the rerender that addStyle() triggers
      // doesn't erase any placeholders inserted via execCommand.
      syncLiveContentToModel(selectedComp);
      selectedComp.addStyle({ color: c });
      const content = selectedComp.get("content") || "";
      const canvasDoc = getCanvasDoc(editor);
      const cleaned = clearInternalStyles(content, canvasDoc, ["color"]);

      if (cleaned !== content) {
        selectedComp.set("content", cleaned);
        editorRef.current
          ?.getEditor()
          ?.trigger("component:update", selectedComp);
      }
    }
  };

  const handleTypographyChange = (key, value) => {
    setTypography((prev) => ({ ...prev, [key]: value }));
    if (!selectedComp) return;

    const cssKey =
      key === "fontFamily"
        ? "font-family"
        : key === "fontWeight"
          ? "font-weight"
          : key === "fontSize"
            ? "font-size"
            : "text-align";
    const cssValue = key === "fontSize" ? `${value}px` : value;

    if (key === "textAlign") {
      const applyTextAlignRecursive = (comp, align) => {
        const type = comp.get("type");
        // Update components that support alignment
        if (
          isText(comp) ||
          isButton(comp) ||
          isImage(comp) ||
          comp.is("mj-column") ||
          type === "mj-column"
        ) {
          comp.addAttributes({ align: align });
          comp.addStyle({ "text-align": align });
        }
        comp
          .components()
          .each((child) => applyTextAlignRecursive(child, align));
      };

      // Apply recursively starting from the selected component
      applyTextAlignRecursive(selectedComp, value);
      editorRef.current?.getEditor()?.trigger("component:update", selectedComp);
      return;
    }

    if (isText(selectedComp) || isButton(selectedComp)) {
      // For inline properties, apply to selected text only if there's an active selection
      const editor = editorRef.current?.getEditor();
      const sel = editor ? getCanvasSelection(editor) : null;
      if (hasSelection(sel)) {
        const doc = getCanvasDoc(editor);
        if (doc) {
          const range = sel.getRangeAt(0);
          const span = doc.createElement("span");
          span.style[key] = cssValue; // key is already camelCase (fontFamily, fontWeight, fontSize)
          try {
            range.surroundContents(span);
            syncContentToModel(editor);
            return;
          } catch {
            // Range spans multiple elements — fall through to whole-component
          }
        }
      }

      // Sync live canvas content before addStyle() triggers a rerender,
      // otherwise any placeholders inserted via execCommand are erased.
      syncLiveContentToModel(selectedComp);
      selectedComp.addStyle({ [cssKey]: cssValue });

      // Clean up internal overrides if no selection
      if (!hasSelection(sel)) {
        const content = selectedComp.get("content") || "";
        const canvasDoc = getCanvasDoc(editor);
        const cleaned = clearInternalStyles(content, canvasDoc, [cssKey]);

        if (cleaned !== content) {
          selectedComp.set("content", cleaned);
          editor.trigger("component:update", selectedComp);
        }
      }
    }
  };

  const handlePaddingChange = (side, value) => {
    const newPadding = { ...padding, [side]: value };
    setPadding(newPadding);
    if (selectedComp) {
      const style = selectedComp.getStyle() || {};
      const attrs = selectedComp.getAttributes() || {};

      const hasShorthandStyle =
        style["padding"] !== undefined && style["padding"] !== "";
      const hasShorthandAttr =
        attrs["padding"] !== undefined && attrs["padding"] !== "";

      if (hasShorthandStyle || hasShorthandAttr) {
        selectedComp.addStyle({ padding: "" });
        if (typeof selectedComp.removeAttributes === "function") {
          selectedComp.removeAttributes("padding");
        }
      }

      const sides = ["top", "right", "bottom", "left"];
      sides.forEach((s) => {
        const sVal = newPadding[s];
        const valStr = sVal === "" ? "" : `${sVal}px`;
        selectedComp.addStyle({ [`padding-${s}`]: valStr });
        if (typeof selectedComp.addAttributes === "function") {
          selectedComp.addAttributes({ [`padding-${s}`]: valStr });
        }
      });

      editorRef.current?.getEditor()?.trigger("component:update", selectedComp);
    }
  };

  const handleGapChange = (axis, value) => {
    const newGap = { ...gap, [axis]: value };
    setGap(newGap);
    const target = getStyleTarget();
    if (!target) return;

    const type = target.get("type");
    const isMjml = type && type.startsWith("mj-");
    const styleUpdates = { gap: `${value}px` };

    if (!isMjml) {
      const tagName = target.get?.("tagName")?.toLowerCase?.();
      const currentStyle = target.getStyle?.() || {};
      styleUpdates.display = "flex";
      if (!currentStyle["flex-direction"]) {
        styleUpdates["flex-direction"] = tagName === "tr" ? "row" : "column";
      }
    }

    target.addStyle(styleUpdates);

    const el = target.getView?.()?.el;
    const td = getColumnContainerTd(el);
    if (td) {
      syncFlexToTd(td, alignItems, justifyContent, newGap);
    }

    editorRef.current?.getEditor()?.trigger("component:update", target);
  };

  const handleAlignItemsChange = (value) => {
    setAlignItems(value);
    const target = getStyleTarget();
    if (!target) return;

    const el = target.getView?.()?.el;
    const type = target.get("type");

    if (type === "mj-column") {
      // mj-column is display:inline-block — vertical-align positions it within the line box
      const va =
        value === "center" ? "middle" : value === "flex-end" ? "bottom" : "top";
      target.addAttributes({ "vertical-align": va });
      if (el) el.style.verticalAlign = va;
    } else {
      // Section: flexbox lives on the inner <td> that holds all columns.
      // Store in model for state read-back on re-selection.
      const isMjml = type && type.startsWith("mj-");
      const styleUpdates = { "align-items": value };

      if (!isMjml) {
        const tagName = target.get?.("tagName")?.toLowerCase?.();
        const currentStyle = target.getStyle?.() || {};
        styleUpdates.display = "flex";
        if (!currentStyle["flex-direction"]) {
          styleUpdates["flex-direction"] = tagName === "tr" ? "row" : "column";
        }
      }

      target.addStyle(styleUpdates);
      const td = getColumnContainerTd(el);
      if (td) {
        syncFlexToTd(td, value, justifyContent, gap);
      }
    }
  };

  const handleJustifyContentChange = (value) => {
    setJustifyContent(value);
    const target = getStyleTarget();
    if (!target) return;

    // Store in model for state read-back on re-selection
    const type = target.get("type");
    const isMjml = type && type.startsWith("mj-");
    const styleUpdates = { "justify-content": value };

    if (!isMjml) {
      const tagName = target.get?.("tagName")?.toLowerCase?.();
      const currentStyle = target.getStyle?.() || {};
      styleUpdates.display = "flex";
      if (!currentStyle["flex-direction"]) {
        styleUpdates["flex-direction"] = tagName === "tr" ? "row" : "column";
      }
    }

    target.addStyle(styleUpdates);

    const el = target.getView?.()?.el;
    const td = getColumnContainerTd(el);
    if (td) {
      syncFlexToTd(td, alignItems, value, gap);
    }
  };

  // ─── Format toggle ─────────────────────────────────────────────────────────
  const handleFormatToggle = useCallback(
    (action) => {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;

      syncContentToModel(editor);

      const selectedAll = editor.getSelectedAll();
      if (!selectedAll || selectedAll.length === 0) return;

      const targetComps = selectedAll.filter((c) => isText(c) || isButton(c));
      if (targetComps.length === 0) return;

      const sel = getCanvasSelection(editor);
      const selectionActive = hasSelection(sel);

      const applyAction = (component) => {
        const s = component.getStyle();

        const toggleProp = (prop, onValue, offValue = "") => {
          const isOn = s[prop] === onValue;
          component.addStyle({ [prop]: isOn ? offValue : onValue });
          if (component === selectedComp) {
            setActiveFormats((prev) => ({ ...prev, [action]: !isOn }));
          }
        };

        const toggleDecoration = (decoration) => {
          const current = s["text-decoration"] || "";
          const has = current.includes(decoration);
          const next = has
            ? current.replace(decoration, "").trim().replace(/\s+/g, " ") ||
              "none"
            : current === "none" || current === ""
              ? decoration
              : `${current} ${decoration}`;
          component.addStyle({ "text-decoration": next });
          if (component === selectedComp) {
            setActiveFormats((prev) => ({ ...prev, [action]: !has }));
          }
        };

        const convertToListRecursive = (tag) => {
          const view = component.getView?.();
          const el = view?.el;
          if (!el) return;
          const editable = el.querySelector("[contenteditable]") || el;
          const currentHtml =
            editable.innerHTML || component.get("content") || "";

          const canvasDoc = getCanvasDoc(editor);
          const lines = extractLinesFromContent(currentHtml, canvasDoc);

          const currentTextColor = s["color"] || textColor || "#000000";
          const currentFontSize = s["font-size"] || `${typography.fontSize}px`;
          const currentFontFamily = s["font-family"] || typography.fontFamily;

          const html = buildListHtml({
            tag,
            lines,
            color: currentTextColor,
            fontSize: currentFontSize,
            fontFamily: currentFontFamily
          });

          editable.innerHTML = html;

          // Chrome's contenteditable engine sometimes injects a leading <br>
          // before text in block children. Strip it from every content cell
          // that still has actual text so it doesn't persist in the model.
          editable.querySelectorAll(".list-content-cell").forEach((cell) => {
            while (
              cell.firstChild?.nodeName === "BR" &&
              cell.childNodes.length > 1
            ) {
              cell.removeChild(cell.firstChild);
            }
          });

          component.set("content", editable.innerHTML, { silent: true });
          focusFirstListCell(editor);

          if (component === selectedComp) {
            setActiveFormats((prev) => ({
              ...prev,
              unorderedList: tag === "ul",
              orderedList: tag === "ol"
            }));
          }
        };

        const clearListRecursive = () => {
          const view = component.getView?.();
          const el = view?.el;
          if (!el) return;
          const editable = el.querySelector("[contenteditable]") || el;
          const currentHtml =
            editable.innerHTML || component.get("content") || "";

          const canvasDoc = getCanvasDoc(editor);
          const lines = extractLinesFromContent(currentHtml, canvasDoc);
          const plainText = lines.join("<br>");

          editable.innerHTML = plainText || "";
          component.set("content", plainText || "", { silent: true });

          if (component === selectedComp) {
            setActiveFormats((prev) => ({
              ...prev,
              unorderedList: false,
              orderedList: false
            }));
          }
        };

        // Toggle only the list (or text block) where the cursor currently sits.
        const toggleListAtCursor = (tag) => {
          const canvasDoc = getCanvasDoc(editor);
          const view = component.getView?.();
          const el = view?.el;
          if (!el) return;
          const editable = el.querySelector("[contenteditable]") || el;

          const s2 = component.getStyle();
          const currentTextColor = s2["color"] || textColor || "#000000";
          const currentFontSize = s2["font-size"] || `${typography.fontSize}px`;
          const currentFontFamily = s2["font-family"] || typography.fontFamily;

          // Use the node recorded on the last mouseup/keyup inside the canvas
          // (the live selection is gone by the time a panel button is clicked).
          let cursorNode = lastCursorNodeRef.current;

          // Verify the tracked node is still in the DOM and inside this editable
          if (cursorNode) {
            let inEditable = false;
            let c = cursorNode;
            while (c) {
              if (c === editable) {
                inEditable = true;
                break;
              }
              c = c.parentNode;
            }
            if (!inEditable) cursorNode = null;
          }

          if (cursorNode) {
            let listContainer = null;
            let directChild = null;
            let walk = cursorNode;

            while (walk && walk !== editable) {
              if (walk.nodeType === 1) {
                if (
                  walk.getAttribute?.("data-list-type") ||
                  walk.nodeName === "UL" ||
                  walk.nodeName === "OL"
                ) {
                  listContainer = walk;
                  break;
                }
                if (walk.parentNode === editable) {
                  directChild = walk;
                }
              }
              walk = walk.parentNode;
            }

            if (listContainer) {
              const currentType =
                listContainer.getAttribute("data-list-type") ||
                (listContainer.nodeName === "UL" ? "ul" : "ol");

              if (currentType === tag) {
                // Toggle OFF: replace this list with plain text
                const lines = extractLinesFromContent(
                  listContainer.outerHTML,
                  canvasDoc
                );
                const p = canvasDoc.createElement("p");
                p.innerHTML = lines.join("<br>") || "<br>";
                listContainer.parentNode.insertBefore(p, listContainer);
                listContainer.remove();
                component.set("content", editable.innerHTML, { silent: true });
                if (component === selectedComp) {
                  setActiveFormats((prev) => ({
                    ...prev,
                    unorderedList: false,
                    orderedList: false
                  }));
                }
              } else {
                // Convert to the other list type
                const lines = extractLinesFromContent(
                  listContainer.outerHTML,
                  canvasDoc
                );
                const newHtml = buildListHtml({
                  tag,
                  lines,
                  color: currentTextColor,
                  fontSize: currentFontSize,
                  fontFamily: currentFontFamily
                });
                const tmp = canvasDoc.createElement("div");
                tmp.innerHTML = newHtml;
                const newList = tmp.firstChild;
                if (newList)
                  listContainer.parentNode.replaceChild(newList, listContainer);
                component.set("content", editable.innerHTML, { silent: true });
                focusFirstListCell(editor);
                if (component === selectedComp) {
                  setActiveFormats((prev) => ({
                    ...prev,
                    unorderedList: tag === "ul",
                    orderedList: tag === "ol"
                  }));
                }
              }
              return;
            }

            if (directChild) {
              // Convert only the block under the cursor to a list
              const lines = extractLinesFromContent(
                directChild.outerHTML,
                canvasDoc
              );
              const newHtml = buildListHtml({
                tag,
                lines,
                color: currentTextColor,
                fontSize: currentFontSize,
                fontFamily: currentFontFamily
              });
              const tmp = canvasDoc.createElement("div");
              tmp.innerHTML = newHtml;
              const newList = tmp.firstChild;
              if (newList)
                directChild.parentNode.replaceChild(newList, directChild);
              component.set("content", editable.innerHTML, { silent: true });
              focusFirstListCell(editor);
              if (component === selectedComp) {
                setActiveFormats((prev) => ({
                  ...prev,
                  unorderedList: tag === "ul",
                  orderedList: tag === "ol"
                }));
              }
              return;
            }
          }

          // Fallback: no usable cursor — toggle whole component content
          const content = component.get("content") || "";
          const isAlreadySameType =
            tag === "ul"
              ? /data-list-type="ul"/i.test(content) ||
                /<ul[\s>]/i.test(content)
              : /data-list-type="ol"/i.test(content) ||
                /<ol[\s>]/i.test(content);

          if (isAlreadySameType) {
            clearListRecursive();
          } else {
            convertToListRecursive(tag);
          }
        };

        switch (action) {
          case "underline":
            if (selectionActive && component === selectedComp) {
              execInCanvas(editor, "underline");
              setActiveFormats((prev) => ({
                ...prev,
                underline: !prev.underline
              }));
            } else {
              toggleDecoration("underline");
            }
            break;

          case "italic":
            if (selectionActive && component === selectedComp) {
              execInCanvas(editor, "italic");
              setActiveFormats((prev) => ({
                ...prev,
                italic: !prev.italic
              }));
            } else {
              toggleProp("font-style", "italic", "normal");
            }
            break;

          case "bold":
            if (selectionActive && component === selectedComp) {
              execInCanvas(editor, "bold");
              setActiveFormats((prev) => ({ ...prev, bold: !prev.bold }));
            } else {
              const isBold =
                s["font-weight"] === "700" || s["font-weight"] === "bold";
              component.addStyle({
                "font-weight": isBold ? "400" : "700"
              });
              if (component === selectedComp) {
                setTypography((prev) => ({
                  ...prev,
                  fontWeight: isBold ? "400" : "700"
                }));
                setActiveFormats((prev) => ({ ...prev, bold: !isBold }));
              }
            }
            break;

          case "strikethrough":
          case "lineThrough":
            if (selectionActive && component === selectedComp) {
              execInCanvas(editor, "strikeThrough");
              setActiveFormats((prev) => ({
                ...prev,
                strikethrough: !prev.strikethrough,
                lineThrough: !prev.lineThrough
              }));
            } else {
              toggleDecoration("line-through");
            }
            break;

          case "uppercase":
            if (selectionActive && component === selectedComp) {
              const isOn = activeFormats["uppercase"];
              if (isOn) {
                execInCanvas(editor, "removeFormat");
              } else {
                const doc = getCanvasDoc(editor);
                if (doc && sel) {
                  const range = sel.getRangeAt(0);
                  const span = doc.createElement("span");
                  span.style.textTransform = "uppercase";
                  try {
                    range.surroundContents(span);
                    syncContentToModel(editor);
                  } catch {
                    toggleProp("text-transform", "uppercase", "none");
                  }
                }
              }
              setActiveFormats((prev) => ({
                ...prev,
                uppercase: !activeFormats["uppercase"]
              }));
            } else {
              toggleProp("text-transform", "uppercase", "none");
            }
            break;

          case "unorderedList": {
            toggleListAtCursor("ul");
            break;
          }

          case "orderedList": {
            toggleListAtCursor("ol");
            break;
          }

          case "indentIncrease": {
            const cur = parseInt(s["padding-left"] || "0", 10);
            const next = cur + 24;
            component.addStyle({ "padding-left": `${next}px` });
            if (component === selectedComp) {
              setActiveFormats((prev) => ({
                ...prev,
                indentLevel: Math.floor(next / 24)
              }));
            }
            break;
          }
          case "indentDecrease": {
            const cur = parseInt(s["padding-left"] || "0", 10);
            const next = Math.max(0, cur - 24);
            component.addStyle({ "padding-left": `${next}px` });
            if (component === selectedComp) {
              setActiveFormats((prev) => ({
                ...prev,
                indentLevel: Math.floor(next / 24)
              }));
            }
            break;
          }
          case "superscript": {
            const isOn = s["vertical-align"] === "super";
            component.addStyle({
              "vertical-align": isOn ? "baseline" : "super",
              "font-size": isOn ? `${typography.fontSize}px` : "75%"
            });
            if (component === selectedComp) {
              setActiveFormats((prev) => ({
                ...prev,
                superscript: !isOn,
                subscript: false
              }));
            }
            break;
          }
          case "subscript": {
            const isOn = s["vertical-align"] === "sub";
            component.addStyle({
              "vertical-align": isOn ? "baseline" : "sub",
              "font-size": isOn ? `${typography.fontSize}px` : "75%"
            });
            if (component === selectedComp) {
              setActiveFormats((prev) => ({
                ...prev,
                subscript: !isOn,
                superscript: false
              }));
            }
            break;
          }
          case "code": {
            const isOn = (s["font-family"] || "").includes("monospace");
            component.addStyle({
              "font-family": isOn ? typography.fontFamily : "monospace",
              "background-color": isOn ? bgColor || "transparent" : "#f4f4f4"
            });
            if (component === selectedComp) {
              setActiveFormats((prev) => ({ ...prev, code: !isOn }));
            }
            break;
          }
          case "highlight": {
            const isOn = s["background-color"] === "#ffff00";
            component.addStyle({
              "background-color": isOn ? bgColor || "transparent" : "#ffff00"
            });
            if (component === selectedComp) {
              setActiveFormats((prev) => ({ ...prev, highlight: !isOn }));
            }
            break;
          }
          default:
            break;
        }
      };

      targetComps.forEach(applyAction);
    },
    [selectedComp, activeFormats, typography, bgColor, textColor, editorRef]
  );

  // ─── Send test mail ────────────────────────────────────────────────────────
  const handleSendTestMail = async () => {
    if (!testEmail) {
      toast.error(
        "Invalid Email",
        "Please enter a valid email address to send the test mail."
      );
      return;
    }
    try {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;
      let html = editorRef.current?.getCompiledHtml?.() || "";
      if (!html) {
        const raw = editor.getHtml();
        if (raw && !raw.includes("<mj-") && !raw.includes("<mjml")) html = raw;
      }
      if (!html) {
        toast.error("Compile Error", "Could not compile MJML to HTML.");
        return;
      }

      const serviceId = "service_ajst25q";
      const templateId = "template_5x27f1d";
      const publicKey = "tX62HCCPekA42gNY0";

      // ── Step 1: Strip GrapesJS canvas artifacts + minify ────────────────────
      // This removes editor-only <style> blocks (.gjs-*, pointer-events, etc.)
      // and <script> tags that inflate the canvas iframe HTML by 20-40 KB but
      // are not part of the real email.
      let minifiedHtml = prepareHtmlForEmail(html);
      let payloadSizeKB = new Blob([minifiedHtml]).size / 1024;

      console.log(
        `[EmailJS] Size after stripping editor artifacts: ${payloadSizeKB.toFixed(2)} KB`
      );

      // ── Step 2: If still over limit, try hosting base64 images via Cloudinary ─
      if (payloadSizeKB > 50) {
        const base64SrcMatches = [
          ...minifiedHtml.matchAll(/src="(data:image\/[^"]+)"/g)
        ];
        const base64BgMatches = [
          ...minifiedHtml.matchAll(/url\(["']?(data:image\/[^)"']+)["']?\)/g)
        ];
        const hasBase64 =
          base64SrcMatches.length > 0 || base64BgMatches.length > 0;

        if (hasBase64) {
          let processedHtml = minifiedHtml;
          let idx = 0;

          for (const [fullMatch, base64Url] of base64SrcMatches) {
            const hostedUrl = await uploadBase64ToServer(
              base64Url,
              `email_img_${++idx}.jpg`
            );
            if (hostedUrl) {
              processedHtml = processedHtml.replace(
                fullMatch,
                `src="${hostedUrl}"`
              );
            }
          }

          for (const [fullMatch, base64Url] of base64BgMatches) {
            const hostedUrl = await uploadBase64ToServer(
              base64Url,
              `email_bg_${++idx}.jpg`
            );
            if (hostedUrl) {
              processedHtml = processedHtml.replace(
                fullMatch,
                `url(${hostedUrl})`
              );
            }
          }

          minifiedHtml = processedHtml;
          payloadSizeKB = new Blob([minifiedHtml]).size / 1024;
        }

        // Final size check after all optimisations
        if (payloadSizeKB > 50) {
          toast.error(
            "Email Too Large",
            `The email (${payloadSizeKB.toFixed(2)} KB) exceeds EmailJS's 50 KB limit. Try reducing the number of sections or simplifying the content.`
          );
          return;
        }
      }

      const templateParams = {
        to_email: testEmail,
        subject: testSubject || "Test Broadcast Email",
        html_content: minifiedHtml,
        name: "Admin",
        email: "admin@example.com"
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      toast.success(
        "Test Email Sent",
        `A test email has been sent to ${testEmail} successfully!`
      );

      // Clear state and close modal
      setShowSendTestMail(false);
      setTestEmail("");
      setTestSubject("");
    } catch (err) {
      console.error("Error sending test email:", err);
      toast.error(
        "Failed to Send Email",
        "An error occurred while sending the test email. Please check your EmailJS configuration."
      );
    }
  };

  // ─── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = () => {
    try {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;

      // UNSELECT before capturing HTML to avoid capturing selection borders/overlays
      const selected = editor.getSelected();
      if (selected) editor.select(null);

      let html = editorRef.current?.getCompiledHtml?.() || "";
      if (!html) {
        const raw = editor.getHtml();
        if (raw && !raw.includes("<mj-") && !raw.includes("<mjml")) html = raw;
      }

      // RESTORE selection
      if (selected) editor.select(selected);

      if (!html) {
        alert("Could not compile MJML to HTML.");
        return;
      }
      setPreviewHtml(prepareHtmlForEmail(normalizeHtmlForPreview(html)));
      setShowPreview(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageLinkChange = (val) => {
    let finalUrl = val;
    if (
      finalUrl &&
      !finalUrl.startsWith("http://") &&
      !finalUrl.startsWith("https://") &&
      !finalUrl.startsWith("mailto:") &&
      !finalUrl.startsWith("tel:") &&
      !finalUrl.startsWith("#")
    ) {
      finalUrl = "https://" + finalUrl;
    }
    const previousLink = imageLink;
    setImageLink(finalUrl);
    if (selectedComp && isImage(selectedComp)) {
      if (selectedComp.is("mj-image")) {
        selectedComp.addAttributes({ href: finalUrl, target: "_blank" });
      } else {
        const parent = selectedComp.parent();
        const isParentLink =
          parent &&
          (parent.get("tagName") === "a" || parent.get("type") === "link");
        if (finalUrl) {
          if (isParentLink) {
            parent.addAttributes({ href: finalUrl, target: "_blank" });
          } else {
            const imgJson = selectedComp.toJSON();
            const imgStyle = selectedComp.getStyle() || {};
            const wrapperStyle = {
              display: imgStyle.display || "inline-block",
              width: imgStyle.width || "100%"
            };
            if (imgStyle["max-width"])
              wrapperStyle["max-width"] = imgStyle["max-width"];
            if (imgStyle.margin) wrapperStyle.margin = imgStyle.margin;
            if (imgStyle["margin-left"])
              wrapperStyle["margin-left"] = imgStyle["margin-left"];
            if (imgStyle["margin-right"])
              wrapperStyle["margin-right"] = imgStyle["margin-right"];
            if (imgStyle["margin-top"])
              wrapperStyle["margin-top"] = imgStyle["margin-top"];
            if (imgStyle["margin-bottom"])
              wrapperStyle["margin-bottom"] = imgStyle["margin-bottom"];
            if (imgStyle.float) wrapperStyle.float = imgStyle.float;

            const wrapped = selectedComp.replaceWith({
              type: "link",
              tagName: "a",
              attributes: { href: finalUrl, target: "_blank" },
              style: wrapperStyle,
              components: [imgJson]
            });
            if (wrapped && editorRef.current?.getEditor()) {
              const newImg = wrapped.components().at(0);
              if (newImg) {
                editorRef.current.getEditor().select(newImg);
              }
            }
          }
        } else {
          if (isParentLink) {
            const imgJson = selectedComp.toJSON();
            const unwrapped = parent.replaceWith(imgJson);
            if (unwrapped && editorRef.current?.getEditor()) {
              editorRef.current.getEditor().select(unwrapped);
            }
          }
        }
      }

      if (finalUrl && !previousLink) {
        toast.success("Link Added", "Image link added successfully.");
      } else if (finalUrl && previousLink && finalUrl !== previousLink) {
        toast.success("Link Updated", "Image link updated successfully.");
      } else if (!finalUrl && previousLink) {
        toast.success("Link Removed", "Image link removed successfully.");
      }
      editorRef.current?.getEditor()?.trigger("component:update", selectedComp);
    }
  };

  const handleButtonUrlChange = (val) => {
    let finalUrl = val;
    if (
      finalUrl &&
      !finalUrl.startsWith("http://") &&
      !finalUrl.startsWith("https://") &&
      !finalUrl.startsWith("mailto:") &&
      !finalUrl.startsWith("tel:") &&
      !finalUrl.startsWith("#")
    ) {
      finalUrl = "https://" + finalUrl;
    }
    const previousUrl = buttonUrl;
    setButtonUrl(finalUrl);
    const selected = selectedComp;
    if (selected && isButton(selected)) {
      selected.addAttributes({ href: finalUrl, target: "_blank" });
      if (finalUrl && !previousUrl) {
        toast.success("Link Added", "Button link added successfully.");
      } else if (finalUrl && previousUrl && finalUrl !== previousUrl) {
        toast.success("Link Updated", "Button link updated successfully.");
      } else if (!finalUrl && previousUrl) {
        toast.success("Link Removed", "Button link removed successfully.");
      }
      editorRef.current?.getEditor()?.trigger("component:update", selected);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const dataType = selectedComp?.getAttributes?.()["data-type"];
  const tagName = selectedComp?.get?.("tagName")?.toLowerCase?.();
  const compType = selectedComp?.get?.("type");
  const compStyle = selectedComp?.getStyle?.() || {};

  let isFrame =
    dataType === "column-frame-section" ||
    dataType === "row-frame-column" ||
    compStyle.display === "flex" ||
    ["table", "tr", "td", "div", "section"].includes(tagName) ||
    ["mj-section", "mj-column", "mj-hero", "section", "row", "column"].includes(
      compType
    );

  // Also check if it's a section that contains a row-frame-column (typical for Row block)
  if (!isFrame && selectedComp?.get("type") === "mj-section") {
    selectedComp.components().each((c) => {
      if (c.getAttributes?.()["data-type"] === "row-frame-column") {
        isFrame = true;
      }
    });
  }

  return (
    <div className="rightPanel">
      <DeviceSwitcher
        handlePreview={handlePreview}
        isEditorEmpty={isEditorEmpty}
        editorRef={editorRef}
      />

      <div className="panelSections">
        <SignatureSection editorRef={editorRef} isEditorEmpty={isEditorEmpty} />
        {/* <LayoutContainer handleAddLayout={handleAddLayout} /> */}

        {selectedComp && isButton(selectedComp) && (
          <ButtonSection
            buttonUrl={buttonUrl}
            onUrlChange={handleButtonUrlChange}
          />
        )}

        {selectedComp && (isText(selectedComp) || isButton(selectedComp)) && (
          <TextStyleContainer
            typography={typography}
            handleTypographyChange={handleTypographyChange}
            textColor={textColor}
            handleTextColorChange={handleTextColorChange}
            activeFormats={activeFormats}
            onFormatToggle={handleFormatToggle}
          />
        )}

        {!isEditorEmpty && (
          <>
            {selectedComp && isImage(selectedComp) && (
              <ImageSection
                imageLink={imageLink}
                onLinkChange={handleImageLinkChange}
                width={width}
                widthUnit={widthUnit}
                handleWidthChange={handleWidthChange}
                height={height}
                heightUnit={heightUnit}
                handleHeightChange={handleHeightChange}
              />
            )}
            <PaddingContainer
              selectedComp={selectedComp}
              padding={padding}
              handlePaddingChange={handlePaddingChange}
              gap={gap}
              handleGapChange={handleGapChange}
              alignItems={alignItems}
              handleAlignItemsChange={handleAlignItemsChange}
              justifyContent={justifyContent}
              handleJustifyContentChange={handleJustifyContentChange}
              textAlign={typography.textAlign}
              handleTextAlignChange={(val) =>
                handleTypographyChange("textAlign", val)
              }
              isFrame={isFrame}
            />

            {selectedComp &&
              (selectedComp.is("mj-column") ||
                selectedComp.is("mj-section") ||
                selectedComp.is("mj-hero") ||
                colTarget ||
                isText(selectedComp) ||
                isButton(selectedComp) ||
                isImage(selectedComp) ||
                isFrame ||
                dataType === "attachment-filled" ||
                dataType === "attachment-placeholder" ||
                [
                  "mj-text",
                  "mj-button",
                  "mj-divider",
                  "mj-image",
                  "mj-raw",
                  "mj-spacer",
                  "mj-social",
                  "mj-table",
                  "mj-accordion",
                  "text",
                  "link",
                  "image"
                ].includes(selectedComp.get("type"))) && (
                <DimensionContainer
                  title={colTarget ? "Layout (Column)" : "Dimensions"}
                  width={colTarget ? colWidth : width}
                  widthUnit={colTarget ? colWidthUnit : widthUnit}
                  handleWidthChange={
                    colTarget ? handleColWidthChange : handleWidthChange
                  }
                  height={colTarget ? colHeight : height}
                  heightUnit={colTarget ? colHeightUnit : heightUnit}
                  handleHeightChange={
                    colTarget ? handleColHeightChange : handleHeightChange
                  }
                />
              )}

            <BackgroundContainer
              bgColor={bgColor}
              handleBgColorChange={handleBgColorChange}
              bgImage={bgImage}
              removeBgImage={removeBgImage}
              bgImageInputRef={bgImageInputRef}
              handleBgImageUpload={handleBgImageUpload}
              colorInputRef={colorInputRef}
              bgRepeat={bgRepeat}
              handleBgRepeatChange={handleBgRepeatChange}
              bgSize={bgSize}
              handleBgSizeChange={handleBgSizeChange}
              onResetColor={() => handleBgColorChange("transparent")}
            />

            {isFrame && (
              <BorderContainer
                borderWidth={borderWidth}
                borderStyle={borderStyle}
                borderColor={borderColor}
                borderRadius={borderRadius}
                handleBorderChange={handleBorderChange}
                handleBorderRadiusChange={handleBorderRadiusChange}
              />
            )}
          </>
        )}
      </div>

      <div className="actionFooter">
        <button
          className="sendTestBtn"
          onClick={() => setShowSendTestMail(true)}
          disabled={isEditorEmpty}
          style={{
            cursor: isEditorEmpty ? "not-allowed" : "pointer",
            opacity: isEditorEmpty ? 0.5 : 1
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M8.33315 11.6667L17.4998 2.5M8.33315 11.6667L11.2498 17.5C11.2864 17.5798 11.3451 17.6474 11.4189 17.6948C11.4928 17.7422 11.5787 17.7674 11.6665 17.7674C11.7542 17.7674 11.8402 17.7422 11.914 17.6948C11.9879 17.6474 12.0466 17.5798 12.0831 17.5L17.4998 2.5M8.33315 11.6667L2.49981 8.75C2.42003 8.71344 2.35242 8.65474 2.30502 8.58088C2.25762 8.50701 2.23242 8.4211 2.23242 8.33333C2.23242 8.24557 2.25762 8.15965 2.30502 8.08579C2.35242 8.01193 2.42003 7.95323 2.49981 7.91667L17.4998 2.5"
              stroke="white"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>Send Test Mail</p>
        </button>
      </div>

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        html={previewHtml}
      />

      <ReusableModal
        isOpen={showSendTestMail}
        onClose={() => setShowSendTestMail(false)}
        title="Send Test Mail"
        confirmText="Send"
        cancelText="Cancel"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        confirmBtnDisabled={isEditorEmpty || !testEmail}
        onConfirm={handleSendTestMail}
        onCancel={() => setShowSendTestMail(false)}
      >
        <div className="sendTestMailContainer">
          <div className="emailInputContainer">
            <label htmlFor="email" className="emailLabel">
              Email
            </label>
            <p className="required">*</p>
          </div>
          <div className="emailInputWrapper">
            <input
              type="email"
              placeholder="Enter email"
              className="emailInput"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          {/* <div className="emailInputContainer" style={{ marginTop: "16px" }}>
            <label htmlFor="subject" className="emailLabel">
              Subject
            </label>
          </div>
          <div className="emailInputWrapper">
            <input
              type="text"
              placeholder="Enter subject (optional)"
              className="emailInput"
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
            />
          </div> */}
        </div>
      </ReusableModal>
    </div>
  );
}
