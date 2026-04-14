/**
 * htmlToMjml.js — HTML email → MJML converter (browser-side)
 *
 * Strategy (flat-first, always-produces-output):
 *   1.  Find the "main content table" by unwrapping single-cell wrapper tables.
 *   2.  Each <tr> in the main table  →  one mj-section.
 *   3.  Each <td>/<th> in a row      →  one mj-column.
 *   4.  Cell contents                →  mj-image / mj-button / mj-divider / mj-text
 *       Nested tables are serialised as raw HTML inside mj-text
 *       (we can NEVER nest mj-section inside mj-column — that breaks GrapesJS).
 *   5.  If no table is found, each top-level block becomes a section.
 *   6.  Absolute fallback: the whole body is one mj-text section.
 *
 * NOTE: The signature-section placeholder is intentionally NOT appended here.
 *       The editor's own reconciler adds it automatically after load.
 */

// ─── Style helpers ────────────────────────────────────────────────────────────

function inlineStyles(el) {
  const m = {};
  if (!el?.style) return m;
  const s = el.style;
  const p = (css, js) => {
    const v = s[js] || s.getPropertyValue?.(css);
    if (v) m[css] = v;
  };
  p("background-color", "backgroundColor");
  p("color", "color");
  p("font-size", "fontSize");
  p("font-family", "fontFamily");
  p("font-weight", "fontWeight");
  p("text-align", "textAlign");
  p("padding", "padding");
  p("width", "width");
  p("line-height", "lineHeight");
  return m;
}

function bgOf(el) {
  return (
    inlineStyles(el)["background-color"] || el?.getAttribute?.("bgcolor") || ""
  );
}

function toAttrs(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
}

function normW(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  return /^\d+$/.test(s) ? `${s}px` : s;
}

// ─── Leaf converters ──────────────────────────────────────────────────────────

function toMjImage(el) {
  const a = {
    src: el.getAttribute("src") || "",
    alt: el.getAttribute("alt") || "",
    padding: "0px",
    margin: "0px",
    align: "center"
  };
  const w = normW(el.getAttribute("width") || el.style.width);
  const h = normW(el.getAttribute("height") || el.style.height);
  if (w) a.width = w;
  if (h) a.height = h;
  return `<mj-image ${toAttrs(a)} />`;
}

function isButton(el) {
  if (!el || el.tagName !== "A") return false;
  const s = el.style;
  const cls = el.getAttribute("class") || "";
  return !!(
    s.backgroundColor ||
    s.background ||
    el.getAttribute("bgcolor") ||
    s.display === "block" ||
    s.display === "inline-block" ||
    cls.includes("btn") ||
    cls.includes("button")
  );
}

function toMjButton(el) {
  const s = inlineStyles(el);
  const a = {
    href: el.getAttribute("href") || "#",
    "background-color":
      s["background-color"] ||
      el.style.background ||
      el.getAttribute("bgcolor") ||
      "#295E3F",
    color: s.color || "#ffffff",
    "border-radius": "8px",
    padding: "0px",
    margin: "0px",
    "font-family": "Inter, Arial, sans-serif",
    "font-size": s["font-size"] || "14px",
    "font-weight": s["font-weight"] || "500",
    align: "center"
  };
  return `<mj-button ${toAttrs(a)}>${el.textContent.trim()}</mj-button>`;
}

function toMjDivider(el) {
  const color =
    inlineStyles(el)["border-color"] ||
    el.style.borderColor ||
    el.getAttribute("color") ||
    "#dddddd";
  return `<mj-divider border-color="${color}" border-width="1px" padding="0px" margin="0px" />`;
}

// ─── Cell content → array of mj-leaf strings ─────────────────────────────────
// CRITICAL RULE: never produce mj-section here.

function cellContent(td) {
  const parts = [];
  let buf = "";

  const flushBuf = () => {
    const t = buf.trim();
    if (!t) {
      buf = "";
      return;
    }
    const s = inlineStyles(td);
    const a = {
      "font-size": s["font-size"] || "14px",
      color: s.color || "#555555",
      "line-height": s["line-height"] || "1.6",
      "font-family": s["font-family"] || "Inter, Arial, sans-serif",
      padding: "0px",
      margin: "0px"
    };
    if (s["font-weight"]) a["font-weight"] = s["font-weight"];
    if (s["text-align"]) a.align = s["text-align"];
    parts.push(`<mj-text ${toAttrs(a)}>${buf}</mj-text>`);
    buf = "";
  };

  Array.from(td.childNodes).forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      if (n.textContent.trim()) buf += n.textContent;
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const tag = n.tagName.toUpperCase();

    if (tag === "IMG") {
      flushBuf();
      parts.push(toMjImage(n));
      return;
    }
    if (tag === "HR") {
      flushBuf();
      parts.push(toMjDivider(n));
      return;
    }
    if (tag === "A" && isButton(n)) {
      flushBuf();
      parts.push(toMjButton(n));
      return;
    }
    if (tag === "TABLE") {
      // ⚠ Nested table — serialise as raw HTML in mj-text.
      // We MUST NOT produce mj-section here (would be inside mj-column → invalid).
      flushBuf();
      const s = inlineStyles(td);
      const a = {
        "font-size": s["font-size"] || "14px",
        color: s.color || "#555555",
        padding: "0px",
        margin: "0px",
        "font-family": "Inter, Arial, sans-serif"
      };
      parts.push(`<mj-text ${toAttrs(a)}>${n.outerHTML}</mj-text>`);
      return;
    }
    // DIV/SPAN wrapping only images
    if (tag === "DIV" || tag === "SPAN") {
      const imgs = Array.from(n.querySelectorAll(":scope > img"));
      if (
        imgs.length > 0 &&
        Array.from(n.childNodes).every(
          (c) =>
            (c.nodeType === Node.TEXT_NODE && !c.textContent.trim()) ||
            c.tagName === "IMG"
        )
      ) {
        flushBuf();
        imgs.forEach((img) => parts.push(toMjImage(img)));
        return;
      }
    }
    // Everything else: accumulate as HTML text
    buf += n.outerHTML;
  });

  flushBuf();

  // Fallback: wrap entire innerHTML
  if (parts.length === 0 && td.innerHTML.trim()) {
    const s = inlineStyles(td);
    const a = {
      "font-size": s["font-size"] || "14px",
      color: s.color || "#555555",
      "line-height": "1.6",
      "font-family": "Inter, Arial, sans-serif",
      padding: "0px",
      margin: "0px"
    };
    parts.push(`<mj-text ${toAttrs(a)}>${td.innerHTML}</mj-text>`);
  }

  return parts;
}

// ─── Get direct <tr> rows (ignoring nested tables) ───────────────────────────

function directRows(table) {
  const rows = [];
  const walk = (el) => {
    Array.from(el.children).forEach((c) => {
      const t = c.tagName.toUpperCase();
      if (t === "TR") rows.push(c);
      else if (["THEAD", "TBODY", "TFOOT"].includes(t)) walk(c);
      // stop at nested TABLE
    });
  };
  walk(table);
  return rows;
}

// ─── Unwrap single-cell wrapper tables ────────────────────────────────────────
// A "wrapper table" = 1 row × 1 cell whose only element child is another table.

function unwrap(table) {
  for (;;) {
    const rows = directRows(table);
    if (rows.length !== 1) break;

    const cells = Array.from(
      rows[0].querySelectorAll(":scope > td, :scope > th")
    );
    if (cells.length !== 1) break;

    const elementKids = Array.from(cells[0].children);
    const innerTables = elementKids.filter(
      (c) => c.tagName.toUpperCase() === "TABLE"
    );
    if (innerTables.length !== 1 || elementKids.length !== 1) break;

    table = innerTables[0]; // descend
  }
  return table;
}

// ─── Table → array of mj-section strings ─────────────────────────────────────

function tableToSections(rawTable) {
  const table = unwrap(rawTable);
  const tableBg = bgOf(table);
  const rows = directRows(table);
  if (rows.length === 0) return [];

  return rows
    .map((tr) => {
      const cells = Array.from(tr.querySelectorAll(":scope > td, :scope > th"));
      if (cells.length === 0) return null;

      const rowBg = bgOf(tr) || tableBg;
      const secA = {
        "full-width": "full-width",
        padding: "0px",
        margin: "0px",
        width: "100%"
      };
      if (rowBg) secA["background-color"] = rowBg;

      const n = cells.length;
      const equalW = `${(100 / n).toFixed(2)}%`;

      const cols = cells.map((td) => {
        const tdBg = bgOf(td);
        const rawW = td.getAttribute("width") || inlineStyles(td).width;
        const colW = normW(rawW) || equalW;
        const colA = { padding: "0px", margin: "0px", width: colW };
        if (tdBg) colA["background-color"] = tdBg;

        const content = cellContent(td).join("\n");
        return `<mj-column ${toAttrs(colA)}>\n${content}\n</mj-column>`;
      });

      return `<mj-section ${toAttrs(secA)}>\n${cols.join("\n")}\n</mj-section>`;
    })
    .filter(Boolean)
    .join("\n");
}

// ─── Body fallback: wrap each block as a section ─────────────────────────────

const H_SIZE = {
  H1: "28px",
  H2: "24px",
  H3: "20px",
  H4: "18px",
  H5: "16px",
  H6: "14px"
};

function blockToSection(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent.trim();
    if (!t) return null;
    return wrapHtml(t);
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toUpperCase();

  if (tag === "TABLE") {
    const secs = tableToSections(node);
    return secs || null;
  }
  if (tag === "IMG") {
    return `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%">
  <mj-column padding="0px" margin="0px" width="100%">
    ${toMjImage(node)}
  </mj-column>
</mj-section>`;
  }
  if (tag === "HR") {
    return `<mj-section full-width="full-width" padding="4px 0px" margin="0px" width="100%">
  <mj-column padding="0px" margin="0px" width="100%">
    ${toMjDivider(node)}
  </mj-column>
</mj-section>`;
  }
  if (H_SIZE[tag]) {
    const s = inlineStyles(node);
    const a = {
      "font-size": s["font-size"] || H_SIZE[tag],
      "font-weight": s["font-weight"] || "bold",
      color: s.color || "#181D25",
      "line-height": "1.4",
      padding: "8px 16px",
      margin: "0px",
      "font-family": "Inter, Arial, sans-serif"
    };
    return `<mj-section full-width="full-width" padding="0px" margin="0px" width="100%">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text ${toAttrs(a)}>${node.innerHTML}</mj-text>
  </mj-column>
</mj-section>`;
  }
  if (["DIV", "CENTER", "SECTION", "ARTICLE", "MAIN", "P"].includes(tag)) {
    const bg = bgOf(node);
    // Dive into children first
    const childResults = Array.from(node.childNodes)
      .map(blockToSection)
      .filter(Boolean)
      .join("\n");
    if (childResults) return childResults;
    // Leaf fallback
    const html = node.innerHTML.trim();
    if (!html) return null;
    return wrapHtml(html, bg);
  }
  return null;
}

function wrapHtml(html, bg = "") {
  const secA = {
    "full-width": "full-width",
    padding: "0px 16px",
    margin: "0px",
    width: "100%"
  };
  if (bg) secA["background-color"] = bg;
  return `<mj-section ${toAttrs(secA)}>
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text font-size="14px" color="#555555" line-height="1.6" font-family="Inter, Arial, sans-serif" padding="0px" margin="0px">${html}</mj-text>
  </mj-column>
</mj-section>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isMjml(content) {
  if (!content) return false;
  const t = content.trim();
  return (
    t.startsWith("<mjml") ||
    t.startsWith("<mj-body") ||
    (t.includes("<mj-section") && t.includes("<mj-column"))
  );
}

/**
 * Convert an HTML email string to a MJML document.
 * Does NOT include a signature-section — the editor reconciler adds it.
 *
 * @param {string} html  Raw file content
 * @returns {string}     MJML document string ready for editor.setComponents()
 */
export function htmlToMjml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  if (!body) throw new Error("No <body> element found.");

  const bodyBg = bgOf(body) || "#ffffff";

  // ── Try table-first conversion ────────────────────────────────────────────
  let sections = "";

  // Look for a top-level TABLE (possibly wrapped in div/center)
  const findTable = (el) => {
    for (const child of Array.from(el.children)) {
      const t = child.tagName.toUpperCase();
      if (t === "TABLE") return child;
      if (["DIV", "CENTER", "SECTION", "ARTICLE", "MAIN"].includes(t)) {
        const inner = findTable(child);
        if (inner) return inner;
      }
    }
    return null;
  };

  const mainTable = findTable(body);

  if (mainTable) {
    sections = tableToSections(mainTable);
  }

  // ── Fallback: walk every body child ──────────────────────────────────────
  if (!sections.trim()) {
    sections = Array.from(body.childNodes)
      .map(blockToSection)
      .filter(Boolean)
      .join("\n");
  }

  // ── Last resort: entire body as one mj-text block ─────────────────────────
  if (!sections.trim()) {
    const raw = body.innerHTML.trim();
    sections = raw
      ? wrapHtml(raw)
      : wrapHtml(
          "<p style='color:#555;font-family:Inter,sans-serif;'>Empty template</p>"
        );
  }

  const mjml = `<mjml>
  <mj-body width="600px" background-color="${bodyBg}" padding="0px" margin="0px">
${sections}
  </mj-body>
</mjml>`;

  console.log("[htmlToMjml] generated MJML:\n", mjml);
  return mjml;
}
