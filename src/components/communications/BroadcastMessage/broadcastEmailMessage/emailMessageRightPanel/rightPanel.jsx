import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../../../../../hooks/useToast";

import "./style.scss";
import PreviewModal from "../emailMessagePreviewModal/previewModal";
import SignatureSection from "./signatureSection/SignatureSection";
import LayoutContainer from "./layoutContainer/layoutContainer";
import { DeviceSwitcher } from "./deviceSwitch/DeviceSwitcher";
import { BackgroundContainer } from "./backgroundContainer/backgroundContainer";
import { TextStyleContainer } from "./textStyleContainer/textStyleContainer";
import BorderContainer from "./borderContainer";
import { PaddingContainer } from "./paddingContainer";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";

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
      range.selectNodeContents(cell);
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
        ? `<span class="list-marker-cell" style="flex-shrink:0;width:20px;color:${color};font-size:${fontSize};font-family:${fontFamily};white-space:nowrap;line-height:1.5;">${i + 1}.&nbsp;</span>`
        : `<span class="list-marker-cell" style="flex-shrink:0;width:20px;color:${color};font-size:${fontSize};font-family:${fontFamily};white-space:nowrap;line-height:1.5;">&bull;&nbsp;</span>`;

      return `<div class="list-item-row" style="display:flex;align-items:center;width:100%;padding:0px 0;">
        ${marker}
        <span class="list-content-cell" style="flex:1;color:${color};font-size:${fontSize};font-family:${fontFamily};line-height:1.5;">${line}</span>
      </div>`;
    })
    .join("\n");

  return `<div data-list-type="${tag}" style="width:100%; display: flex; flex-direction: column;  align-items: center; justify-content: center;">${rows}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// extractLinesFromContent
// ─────────────────────────────────────────────────────────────────────────────
function extractLinesFromContent(html, doc) {
  const d = doc || window.document;
  const tmp = d.createElement("div");

  try {
    tmp.innerHTML = html;
  } catch {
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text ? [text] : ["List item"];
  }

  // 1. Our div-based list format
  const listRows = tmp.querySelectorAll(
    "div.list-item-row, div[data-list-type] div.list-item-row"
  );
  if (listRows.length > 0) {
    const lines = [];
    listRows.forEach((row) => {
      const cell = row.querySelector(".list-content-cell");
      if (cell) lines.push(cell.innerHTML.trim());
    });
    const filtered = lines.filter(Boolean);
    if (filtered.length > 0) return filtered;
  }

  // 2. Native <ul> / <ol>
  const lis = tmp.querySelectorAll("li");
  if (lis.length > 0) {
    return Array.from(lis)
      .map((li) => li.innerHTML.trim())
      .filter(Boolean);
  }

  // 3. Headings and Paragraphs
  const blocks = tmp.querySelectorAll("h1, h2, h3, h4, h5, h6, p, div");
  if (blocks.length > 0) {
    const lines = Array.from(blocks)
      .map((b) => b.innerHTML.trim())
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

        // Walk up to contenteditable root
        let editableRoot = contentCell.parentNode;
        while (editableRoot && !editableRoot.hasAttribute("contenteditable")) {
          editableRoot = editableRoot.parentNode;
        }

        const afterRange = doc.createRange();
        afterRange.setStart(range.startContainer, range.startOffset);
        if (contentCell.lastChild)
          afterRange.setEndAfter(contentCell.lastChild);
        else afterRange.setEnd(contentCell, 0);

        let fragment;
        if (contentCell.contains(range.startContainer))
          fragment = afterRange.extractContents();
        else fragment = doc.createDocumentFragment();

        // Clone the row and clear its content cell
        const newRow = divRow.cloneNode(true);
        const newContentCell = newRow.querySelector(".list-content-cell");
        newContentCell.innerHTML = "";
        if (fragment && fragment.childNodes.length > 0)
          newContentCell.appendChild(fragment);
        if (
          !newContentCell.textContent.trim() &&
          !newContentCell.querySelector("br")
        )
          newContentCell.innerHTML = "<br>";

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
  const [selectedComp, setSelectedComp] = useState(null);

  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bgImage, setBgImage] = useState("");
  const [bgRepeat, setBgRepeat] = useState("no-repeat");
  const [bgSize, setBgSize] = useState("contain");

  const [borderWidth, setBorderWidth] = useState("0");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderRadius, setBorderRadius] = useState("0");

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
  const [padding, setPadding] = useState({
    top: "0",
    right: "0",
    bottom: "0",
    left: "0"
  });
  const [margin, setMargin] = useState({
    top: "0",
    right: "0",
    bottom: "0",
    left: "0"
  });

  const colorInputRef = useRef(null);
  const textColorInputRef = useRef(null);
  const bgImageInputRef = useRef(null);
  const borderColorInputRef = useRef(null);
  const cleanupRef = useRef(null);

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

  // ─── Sync panel from selected component ────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    const updateState = () => {
      const selected = editor.getSelected();
      setSelectedComp(selected);
      if (!selected) return;

      const style = selected.getStyle();

      setBgColor(style["background-color"] || "#FFFFFF");
      setBgImage(
        style["background-image"]?.match(/url\((['"]?)(.*?)\1\)/)?.[2] || ""
      );
      setBgRepeat(style["background-repeat"] || "no-repeat");
      const rawSize = style["background-size"] || "contain";
      setBgSize(rawSize === "100% 100%" ? "fill" : rawSize);

      const border = style["border"] || "0px solid #000000";
      const bp = border.split(" ");
      if (bp.length >= 3) {
        setBorderWidth(bp[0].replace("px", ""));
        setBorderStyle(bp[1]);
        setBorderColor(bp[2]);
      }
      setBorderRadius(style["border-radius"]?.replace("px", "") || "0");

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
      } else {
        setActiveFormats({});
      }

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
      setMargin({
        top:
          style["margin-top"]?.replace("px", "") ||
          style["margin"]?.split(" ")[0]?.replace("px", "") ||
          "0",
        right:
          style["margin-right"]?.replace("px", "") ||
          style["margin"]?.split(" ")[1]?.replace("px", "") ||
          "0",
        bottom:
          style["margin-bottom"]?.replace("px", "") ||
          style["margin"]?.split(" ")[2]?.replace("px", "") ||
          "0",
        left:
          style["margin-left"]?.replace("px", "") ||
          style["margin"]?.split(" ")[3]?.replace("px", "") ||
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
      const attrs = selected.getAttributes();
      const { value: wVal, unit: wUnit } = parseValueAndUnit(
        attrs["width"] || style["width"] || ""
      );
      const { value: hVal, unit: hUnit } = parseValueAndUnit(
        attrs["height"] || style["height"] || ""
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
    return () => {
      editor.off("component:selected", updateState);
      editor.off("component:update:style", updateState);
    };
  }, [editorRef]);

  // ─── Layout ────────────────────────────────────────────────────────────────
  const handleAddLayout = (layoutType) => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;
    const map = {
      "1-col": `<mj-section full-width="full-width"><mj-column padding="20px" background-color="#ffffff"></mj-column></mj-section>`,
      "2-col": `<mj-section full-width="full-width"><mj-column width="50%" padding="20px"></mj-column><mj-column width="50%" padding="20px"></mj-column></mj-section>`,
      "3-col": `<mj-section full-width="full-width"><mj-column width="33.33%" padding="10px"></mj-column><mj-column width="33.33%" padding="10px"></mj-column><mj-column width="33.33%" padding="10px"></mj-column></mj-section>`,
      "30-70": `<mj-section full-width="full-width"><mj-column width="30%" padding="10px"></mj-column><mj-column width="70%" padding="10px"></mj-column></mj-section>`,
      "70-30": `<mj-section full-width="full-width"><mj-column width="70%" padding="10px"></mj-column><mj-column width="30%" padding="10px"></mj-column></mj-section>`,
      "2-row": `<mj-section full-width="full-width" padding="0"><mj-column padding="10px"></mj-column></mj-section><mj-section full-width="full-width" padding="0"><mj-column padding="10px"></mj-column></mj-section>`
    };
    const content = map[layoutType];
    if (!content) return;
    const selected = editor.getSelected();
    if (selected) {
      selected.parent()?.append(content, {
        at: selected.parent().components().indexOf(selected) + 1
      });
    } else {
      editor.addComponents(content);
    }
  };

  // ─── Background ────────────────────────────────────────────────────────────
  const handleBgColorChange = (c) => {
    setBgColor(c);
    selectedComp?.addStyle({ "background-color": c });
  };
  const removeBgImage = () => {
    setBgImage("");
    selectedComp?.addStyle({ "background-image": "none" });
  };
  const handleBgRepeatChange = (r) => {
    setBgRepeat(r);
    selectedComp?.addStyle({ "background-repeat": r });
  };
  const handleBgSizeChange = (s) => {
    setBgSize(s);
    selectedComp?.addStyle({
      "background-size": s === "fill" ? "100% 100%" : s
    });
  };
  const handleBgImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedComp) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setBgImage(url);
      selectedComp.addStyle({
        "background-image": `url(${url})`,
        "background-repeat": "no-repeat",
        "background-size": "contain",
        "background-position": "center"
      });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  // ─── Dimensions ────────────────────────────────────────────────────────────
  const handleWidthChange = (val, unit = widthUnit) => {
    const full = `${val}${unit}`;
    setWidth(val);
    setWidthUnit(unit);
    if (selectedComp) {
      selectedComp.set("width", full);
      selectedComp.addAttributes({ width: full });
      selectedComp.addStyle({ width: full });
      editorRef.current?.getEditor()?.trigger("component:update", selectedComp);
    }
  };
  const handleHeightChange = (val, unit = heightUnit) => {
    const full = `${val}${unit}`;
    setHeight(val);
    setHeightUnit(unit);
    if (selectedComp) {
      selectedComp.set("height", full);
      selectedComp.addAttributes({ height: full });
      selectedComp.addStyle({ height: full });
      editorRef.current?.getEditor()?.trigger("component:update", selectedComp);
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
    selectedComp?.addStyle({ border: `${nW}px ${nS} ${nC}` });
  };
  const handleBorderRadiusChange = (r) => {
    setBorderRadius(r);
    selectedComp?.addStyle({ "border-radius": `${r}px` });
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
    if (
      selectedComp &&
      (selectedComp.is("mj-text") || selectedComp.is("mj-button"))
    ) {
      const cssKey =
        key === "fontFamily"
          ? "font-family"
          : key === "fontWeight"
            ? "font-weight"
            : key === "fontSize"
              ? "font-size"
              : "text-align";
      const cssValue = key === "fontSize" ? `${value}px` : value;

      // For inline properties, apply to selected text only if there's an active selection
      if (key !== "textAlign") {
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
      }

      selectedComp.addStyle({ [cssKey]: cssValue });

      // Clean up internal overrides if no selection
      const editor = editorRef.current?.getEditor();
      const sel = editor ? getCanvasSelection(editor) : null;
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
  const handleMarginChange = (side, value) => {
    setMargin((prev) => ({ ...prev, [side]: value }));
    selectedComp?.addStyle({ [`margin-${side}`]: `${value}px` });
  };

  // ─── Format toggle ─────────────────────────────────────────────────────────
  const handleFormatToggle = useCallback(
    (action) => {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;

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
          component.set("content", html, { silent: true });
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
            const content = component.get("content") || "";
            const isOn = /data-list-type="ul"/i.test(content);
            if (isOn) clearListRecursive();
            else convertToListRecursive("ul");
            break;
          }

          case "orderedList": {
            const content = component.get("content") || "";
            const isOn = /data-list-type="ol"/i.test(content);
            if (isOn) clearListRecursive();
            else convertToListRecursive("ol");
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
  const handleSendTestMail = () => {
    if (!testEmail) {
      toast.error(
        "Failed to Save Template",
        "An error occurred while saving your template. Please try again."
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
      console.log(`Sending test email to: ${testEmail}`, html);
      toast.success("Template Saved Successfully", `Sent to ${testEmail}!`);
      setShowSendTestMail(false);
      setTestEmail("");
    } catch (err) {
      console.error(err);
      toast.error(
        "Failed to Save Template",
        "An error occurred. Please try again."
      );
    }
  };

  // ─── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = () => {
    try {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;
      let html = editorRef.current?.getCompiledHtml?.() || "";
      if (!html) {
        const raw = editor.getHtml();
        if (raw && !raw.includes("<mj-") && !raw.includes("<mjml")) html = raw;
      }
      if (!html) {
        alert("Could not compile MJML to HTML.");
        return;
      }
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (e) {
      console.error(e);
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
        <SignatureSection />
        <LayoutContainer handleAddLayout={handleAddLayout} />

        {selectedComp &&
          (selectedComp.is("mj-text") || selectedComp.is("mj-button")) && (
            <TextStyleContainer
              typography={typography}
              handleTypographyChange={handleTypographyChange}
              textColor={textColor}
              handleTextColorChange={handleTextColorChange}
              textColorInputRef={textColorInputRef}
              activeFormats={activeFormats}
              onFormatToggle={handleFormatToggle}
            />
          )}

        <PaddingContainer
          selectedComp={selectedComp}
          padding={padding}
          handlePaddingChange={handlePaddingChange}
          margin={margin}
          handleMarginChange={handleMarginChange}
        />

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
          width={width}
          widthUnit={widthUnit}
          handleWidthChange={handleWidthChange}
          height={height}
          heightUnit={heightUnit}
          handleHeightChange={handleHeightChange}
        />

        <BorderContainer
          borderWidth={borderWidth}
          borderStyle={borderStyle}
          borderColor={borderColor}
          borderRadius={borderRadius}
          handleBorderChange={handleBorderChange}
          handleBorderRadiusChange={handleBorderRadiusChange}
          borderColorInputRef={borderColorInputRef}
        />
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
        </div>
      </ReusableModal>
    </div>
  );
}
