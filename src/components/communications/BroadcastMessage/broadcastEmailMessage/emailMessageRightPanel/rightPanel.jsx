import { useState, useEffect, useRef, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { useToast } from "../../../../../hooks/useToast";
import {
  uploadToCloudinary,
  IS_CLOUDINARY_CONFIGURED,
  uploadBase64ToCloudinary
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
// syncContentToModel
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
    const editable = el.querySelector("[contenteditable]") || el;
    const html = editable.innerHTML;
    if (html !== undefined) {
      selected.set("content", html, { silent: true });
    }
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
// prepareHtmlForEmail
// Strips GrapesJS canvas editor artifacts (style blocks, data-gjs-* attributes,
// scripts) that are injected into the canvas iframe but are NOT part of the
// actual email HTML.  This typically saves 20-40 KB before the EmailJS check.
// ─────────────────────────────────────────────────────────────────────────────
function prepareHtmlForEmail(rawHtml) {
  if (!rawHtml) return "";

  let html = rawHtml;

  // Remove <style> blocks that contain GrapesJS editor-specific selectors
  // but do NOT contain @media queries (those are the real email responsive styles).
  html = html.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (match, content) => {
      const isEditorStyle =
        /\.gjs-|#gjs-|\bsp-container\b|\.CodeMirror|pointer-events\s*:\s*none|\[data-gjs-type\]/.test(
          content
        );
      const hasMediaQuery = /@media\s/i.test(content);
      // Drop pure-editor style blocks; keep anything that has responsive CSS
      if (isEditorStyle && !hasMediaQuery) return "";
      return match;
    }
  );

  // Remove <script> tags – not valid in email bodies
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove GrapesJS component data attributes (data-gjs-*)
  html = html.replace(/\s+data-gjs-[a-zA-Z0-9-]+(?:="[^"]*"|='[^']*')?/g, "");

  // Remove other editor-specific attributes
  html = html.replace(/\s+data-type(?:="[^"]*"|='[^']*')?/g, "");
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

  const [borderWidth, setBorderWidth] = useState("0");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderRadius, setBorderRadius] = useState({
    tl: "0",
    tr: "0",
    br: "0",
    bl: "0"
  });

  const [width, setWidth] = useState("100");
  const [widthUnit, setWidthUnit] = useState("%");
  const [height, setHeight] = useState("100");
  const [heightUnit, setHeightUnit] = useState("%");

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
    top: "0",
    right: "0",
    bottom: "0",
    left: "0"
  });

  const [buttonUrl, setButtonUrl] = useState("");

  const colorInputRef = useRef(null);
  const bgImageInputRef = useRef(null);
  const cleanupRef = useRef(null);
  // Tracks the DOM node where the cursor last was inside the canvas iframe.
  // Read by toggleListAtCursor after the iframe loses focus on button click.
  const lastCursorNodeRef = useRef(null);

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
      const selected = editor.getSelected();
      setSelectedComp(selected);
      if (!selected) return;

      let dimTarget = selected;
      if (
        ["mj-text", "mj-button", "mj-image", "mj-divider", "mj-raw"].includes(
          selected.get("type")
        )
      ) {
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
      const dimStyle = dimTarget.getStyle() || {};
      const dimAttrs = dimTarget.getAttributes() || {};

      setBgColor(dimStyle["background-color"] || "transparent");
      setBgImage(
        dimStyle["background-image"]?.match(/url\((['"]?)(.*?)\1\)/)?.[2] || ""
      );
      setBgRepeat(dimStyle["background-repeat"] || "no-repeat");
      const rawSize = dimStyle["background-size"] || "contain";
      setBgSize(rawSize === "100% 100%" ? "fill" : rawSize);

      const border =
        dimAttrs["border"] || dimStyle["border"] || "0px solid #000000";
      const bp = border.split(" ");
      if (bp.length >= 3) {
        setBorderWidth(bp[0].replace("px", ""));
        setBorderStyle(bp[1]);
        setBorderColor(bp[2]);
      }
      // Read border-radius from MJML attribute first, then fall back to CSS style
      const rawBrAttr =
        dimAttrs["border-radius"] || dimStyle["border-radius"] || "0";
      const brShorthand = rawBrAttr.split(" ");
      const getBrPart = (idx) => {
        if (brShorthand.length === 1) return brShorthand[0].replace("px", "");
        if (brShorthand.length === 2)
          return brShorthand[idx % 2].replace("px", "");
        if (brShorthand.length === 3) {
          if (idx === 0) return brShorthand[0].replace("px", "");
          if (idx === 1 || idx === 3) return brShorthand[1].replace("px", "");
          if (idx === 2) return brShorthand[2].replace("px", "");
        }
        if (brShorthand.length >= 4) return brShorthand[idx].replace("px", "");
        return "0";
      };

      setBorderRadius({
        tl:
          dimStyle["border-top-left-radius"]?.replace("px", "") || getBrPart(0),
        tr:
          dimStyle["border-top-right-radius"]?.replace("px", "") ||
          getBrPart(1),
        br:
          dimStyle["border-bottom-right-radius"]?.replace("px", "") ||
          getBrPart(2),
        bl:
          dimStyle["border-bottom-left-radius"]?.replace("px", "") ||
          getBrPart(3)
      });

      if (selected.is("mj-text") || selected.is("mj-button")) {
        const currentFontSize = style["font-size"]?.replace("px", "") || "14";
        setTextColor(style["color"] || "#000000");
        setTypography({
          fontFamily: style["font-family"]?.replace(/['"]/g, "") || "Inter",
          fontWeight: style["font-weight"] || "400",
          fontSize: currentFontSize,
          textAlign: style["text-align"] || "left"
        });

        const textDecoration = style["text-decoration"] || "";
        const content = selected.get("content") || "";
        const hasUl =
          /data-list-type="ul"/i.test(content) || /<ul[\s>]/i.test(content);
        const hasOl =
          /data-list-type="ol"/i.test(content) || /<ol[\s>]/i.test(content);

        setActiveFormats({
          underline: textDecoration.includes("underline"),
          lineThrough: textDecoration.includes("line-through"),
          strikethrough: textDecoration.includes("line-through"),
          italic: (style["font-style"] || "") === "italic",
          bold:
            style["font-weight"] === "700" || style["font-weight"] === "bold",
          uppercase: (style["text-transform"] || "") === "uppercase",
          superscript: (style["vertical-align"] || "") === "super",
          subscript: (style["vertical-align"] || "") === "sub",
          unorderedList: hasUl,
          orderedList: hasOl,
          code: (style["font-family"] || "").includes("monospace"),
          highlight: (style["background-color"] || "") === "#ffff00",
          indentLevel: Math.floor(
            parseInt(style["padding-left"] || "0", 10) / 24
          )
        });

        if (selected.is("mj-button")) {
          setButtonUrl(selected.getAttributes().href || "");
        }
      } else {
        // Sync textAlign for other components (like mj-column or sections)
        setTypography((prev) => ({
          ...prev,
          textAlign:
            style["text-align"] || selected.getAttributes()?.align || "left"
        }));
        setActiveFormats({});
      }

      if (dimTarget.get("type") === "mj-column") {
        // Column: vertical-align is the MJML inline-block equivalent of align-items
        const va =
          dimStyle["vertical-align"] || dimAttrs["vertical-align"] || "top";
        setAlignItems(
          va === "middle"
            ? "center"
            : va === "bottom"
              ? "flex-end"
              : "flex-start"
        );
      } else {
        // Section: align-items is stored directly in the model style
        setAlignItems(dimStyle["align-items"] || "flex-start");
      }
      setJustifyContent(dimStyle["justify-content"] || "flex-start");

      setPadding({
        top:
          style["padding-top"]?.replace("px", "") ||
          style["padding"]?.split(" ")[0]?.replace("px", "") ||
          "0",
        right:
          style["padding-right"]?.replace("px", "") ||
          style["padding"]?.split(" ")[1]?.replace("px", "") ||
          "0",
        bottom:
          style["padding-bottom"]?.replace("px", "") ||
          style["padding"]?.split(" ")[2]?.replace("px", "") ||
          "0",
        left:
          style["padding-left"]?.replace("px", "") ||
          style["padding"]?.split(" ")[3]?.replace("px", "") ||
          "0"
      });

      const parseValueAndUnit = (val) => {
        if (!val) return { value: "", unit: "%" };
        if (val === "auto") return { value: "auto", unit: "px" };
        const m = val.match(/^(\d+(?:\.\d+)?)(%|px)$/);
        if (m) return { value: m[1], unit: m[2] };
        return {
          value: val.replace(/[^\d.]/g, ""),
          unit: val.replace(/[\d.]/g, "") || "%"
        };
      };

      const { value: wVal, unit: wUnit } = parseValueAndUnit(
        dimAttrs["width"] || dimStyle["width"] || ""
      );
      const { value: hVal, unit: hUnit } = parseValueAndUnit(
        dimAttrs["height"] || dimStyle["height"] || ""
      );

      if (wVal) {
        setWidth(wVal);
        setWidthUnit(wUnit);
      } else {
        setWidth("100");
        setWidthUnit("%");
      }
      if (hVal) {
        setHeight(hVal);
        setHeightUnit(hUnit);
      } else {
        setHeight("100");
        setHeightUnit("%");
      }
    };

    editor.on("component:selected", updateState);
    editor.on("component:update:style", updateState);
    editor.on("component:update:attributes", updateState);
    return () => {
      editor.off("component:selected", updateState);
      editor.off("component:update:style", updateState);
      editor.off("component:update:attributes", updateState);
    };
  }, [editorRef]);

  // ─── Layout ────────────────────────────────────────────────────────────────

  // Helper to fetch the proper target (mj-column usually, unless section is explicitly targeted)
  const getStyleTarget = () => {
    if (!selectedComp) return null;
    let target = selectedComp;
    if (
      ["mj-text", "mj-image", "mj-divider", "mj-raw"].includes(
        selectedComp.get("type")
      )
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
      target.addStyle({ "background-size": s === "fill" ? "100% 100%" : s });
      editorRef.current?.getEditor()?.trigger("component:update", target);
    }
  };
  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    const target = getStyleTarget();
    if (!file || !target) return;

    try {
      const url = await uploadToCloudinary(file);
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
    target.set(dim, fullValue);
    target.addAttributes({ [dim]: fullValue });
    target.addStyle({ [dim]: fullValue });
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
    const full = `${val}${unit}`;
    setHeight(val);
    setHeightUnit(unit);
    if (selectedComp) {
      const target = getStyleTarget();
      updateDimensionOnTarget(target, "height", full);
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
      const borderValue = `${nW}px ${nS} ${nC}`;
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
    if (
      selectedComp &&
      (selectedComp.is("mj-text") || selectedComp.is("mj-button"))
    ) {
      const editor = editorRef.current?.getEditor();
      const sel = editor ? getCanvasSelection(editor) : null;

      // If user has text selected inside the editor, apply color only to that selection
      if (hasSelection(sel)) {
        execInCanvas(editor, "foreColor", c);
        syncContentToModel(editor);
        return;
      }

      // No selection — apply color to the whole component
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
          comp.is("mj-text") ||
          comp.is("mj-button") ||
          comp.is("mj-image") ||
          comp.is("mj-column") ||
          type === "mj-text" ||
          type === "mj-button" ||
          type === "mj-image" ||
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

    if (selectedComp.is("mj-text") || selectedComp.is("mj-button")) {
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

  // ─── Padding / Margin ──────────────────────────────────────────────────────
  const handlePaddingChange = (side, value) => {
    setPadding((prev) => ({ ...prev, [side]: value }));
    selectedComp?.addStyle({ [`padding-${side}`]: `${value}px` });
  };

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
      target.addStyle({ "align-items": value });
      const td = getColumnContainerTd(el);
      if (td) {
        // Ensure the td is a flex row (canvas CSS does this for column-frame-section,
        // but we also need it for regular sections; !important beats canvas CSS rules).
        td.style.setProperty("display", "flex", "important");
        td.style.setProperty("flex-direction", "row", "important");
        td.style.setProperty("flex-wrap", "nowrap", "important");
        td.style.setProperty("align-items", value, "important");
      }
    }
  };

  const handleJustifyContentChange = (value) => {
    setJustifyContent(value);
    const target = getStyleTarget();
    if (!target) return;

    // Store in model for state read-back on re-selection
    target.addStyle({ "justify-content": value });

    const el = target.getView?.()?.el;
    const td = getColumnContainerTd(el);
    if (td) {
      td.style.setProperty("display", "flex", "important");
      td.style.setProperty("flex-direction", "row", "important");
      td.style.setProperty("flex-wrap", "nowrap", "important");
      td.style.setProperty("justify-content", value, "important");
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

      const targetComps = selectedAll.filter(
        (c) => c.is("mj-text") || c.is("mj-button")
      );
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

        if (hasBase64 && IS_CLOUDINARY_CONFIGURED) {
          // Upload each embedded image to Cloudinary and replace the src
          let processedHtml = minifiedHtml;
          let idx = 0;

          for (const [fullMatch, base64Url] of base64SrcMatches) {
            const hostedUrl = await uploadBase64ToCloudinary(
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
            const hostedUrl = await uploadBase64ToCloudinary(
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
          console.log(
            `[EmailJS] Size after Cloudinary upload: ${payloadSizeKB.toFixed(2)} KB`
          );
        }

        // Final size check after all optimisations
        if (payloadSizeKB > 50) {
          const hasBase64Still =
            /src="data:image\//.test(minifiedHtml) ||
            /url\(["']?data:image\//.test(minifiedHtml);

          if (hasBase64Still && !IS_CLOUDINARY_CONFIGURED) {
            toast.error(
              "Image Too Large to Send",
              "One or more images are too large to be embedded in a single email. Please configure Cloudinary in src/utils/uploadUtils.js to host images externally, or use a much smaller image."
            );
          } else {
            toast.error(
              "Email Too Large",
              `The email (${payloadSizeKB.toFixed(2)} KB) exceeds EmailJS's 50 KB limit. Try reducing the number of sections or simplifying the content.`
            );
          }
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
      setPreviewHtml(prepareHtmlForEmail(html));
      setShowPreview(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleButtonUrlChange = (val) => {
    const previousUrl = buttonUrl;
    setButtonUrl(val);
    const selected = selectedComp;
    if (selected && selected.is("mj-button")) {
      selected.addAttributes({ href: val });
      if (val && !previousUrl) {
        toast.success("Link Added", "Button link added successfully.");
      } else if (val && previousUrl && val !== previousUrl) {
        toast.success("Link Updated", "Button link updated successfully.");
      } else if (!val && previousUrl) {
        toast.success("Link Removed", "Button link removed successfully.");
      }
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rightPanel">
      <DeviceSwitcher
        handlePreview={handlePreview}
        isEditorEmpty={isEditorEmpty}
        editorRef={editorRef}
      />

      <div className="panelSections">
        <SignatureSection editorRef={editorRef} />
        {/* <LayoutContainer handleAddLayout={handleAddLayout} /> */}

        {selectedComp && selectedComp.is("mj-button") && (
          <ButtonSection
            buttonUrl={buttonUrl}
            onUrlChange={handleButtonUrlChange}
          />
        )}

        {selectedComp &&
          (selectedComp.is("mj-text") || selectedComp.is("mj-button")) && (
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
            <ImageSection />
            <PaddingContainer
              selectedComp={selectedComp}
              padding={padding}
              handlePaddingChange={handlePaddingChange}
              alignItems={alignItems}
              handleAlignItemsChange={handleAlignItemsChange}
              justifyContent={justifyContent}
              handleJustifyContentChange={handleJustifyContentChange}
              textAlign={typography.textAlign}
              handleTextAlignChange={(val) =>
                handleTypographyChange("textAlign", val)
              }
            />

            {selectedComp &&
              (selectedComp.is("mj-column") ||
                selectedComp.is("mj-section") ||
                selectedComp.is("mj-hero") ||
                ["mj-text", "mj-button", "mj-image", "mj-divider"].includes(
                  selectedComp.get("type")
                )) && (
                <DimensionContainer
                  width={width}
                  widthUnit={widthUnit}
                  handleWidthChange={handleWidthChange}
                  height={height}
                  heightUnit={heightUnit}
                  handleHeightChange={handleHeightChange}
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

            <BorderContainer
              borderWidth={borderWidth}
              borderStyle={borderStyle}
              borderColor={borderColor}
              borderRadius={borderRadius}
              handleBorderChange={handleBorderChange}
              handleBorderRadiusChange={handleBorderRadiusChange}
            />
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

          <div className="emailInputContainer" style={{ marginTop: "16px" }}>
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
          </div>
        </div>
      </ReusableModal>
    </div>
  );
}
