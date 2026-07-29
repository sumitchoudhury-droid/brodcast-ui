// Collapse whitespace and strip HTML comments (including MSO conditionals).
export function minifyHTML(html) {
  if (!html) return "";
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

// Strip canvas-only flex layout styles from a `<td>` inline style attribute.
// The canvas iframe applies `display:flex` on column-frame section td cells for
// preview, and grapesjs-mjml inlines these onto the compiled td. Email clients
// vary in flex support, so removing them lets MJML's default inline-block
// column divs lay out via Outlook's MSO tables + inline-block in others.
function stripFlexFromStyle(styleAttr) {
  if (!styleAttr) return styleAttr;
  return styleAttr
    .replace(/display\s*:\s*flex\s*!important\s*;?/gi, "")
    .replace(/flex-flow\s*:[^;]+!important\s*;?/gi, "")
    .replace(/flex-direction\s*:[^;]+!important\s*;?/gi, "")
    .replace(/flex-wrap\s*:[^;]+!important\s*;?/gi, "")
    .replace(/align-items\s*:[^;]+!important\s*;?/gi, "")
    .replace(/justify-content\s*:[^;]+!important\s*;?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// prepareHtmlForEmail
// Strips GrapesJS canvas editor artifacts (style blocks, data-gjs-* attributes,
// scripts, canvas-only flex overrides) that are injected into the canvas iframe
// but are NOT part of the actual email HTML. Typically saves 20-40 KB.
export function prepareHtmlForEmail(rawHtml) {
  if (!rawHtml) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // 1. Drop or clean editor-only <style> blocks
  const styles = doc.querySelectorAll("style");
  styles.forEach((styleTag) => {
    let content = styleTag.textContent;

    const isEditorStyle =
      /\.gjs-|#gjs-|\bsp-container\b|\.CodeMirror|pointer-events\s*:\s*none|\[data-gjs-type\]/.test(
        content
      );
    const hasMediaQuery = /@media\s/i.test(content);

    if (isEditorStyle) {
      if (!hasMediaQuery) {
        styleTag.remove();
      } else {
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

  // 2. Remove inline padding-bottom on frame column elements
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

  // 3. Strip canvas-only flex layout styles from every <td>
  doc.querySelectorAll("td").forEach((td) => {
    const styleAttr = td.getAttribute("style");
    if (!styleAttr) return;
    const cleaned = stripFlexFromStyle(styleAttr);
    if (cleaned !== styleAttr) {
      td.setAttribute("style", cleaned);
    }
  });

  // 4. Strip canvas-only min-height:100vh from wrapper/mjml/mj-body divs
  doc.querySelectorAll('[style*="min-height"]').forEach((el) => {
    const styleAttr = el.getAttribute("style");
    if (!styleAttr) return;
    const cleaned = styleAttr
      .replace(/min-height\s*:\s*100vh\s*;?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned !== styleAttr) {
      el.setAttribute("style", cleaned);
    }
  });

  // 5. Strip <mj-head> and its rendered children — email clients don't need
  // it. The Inter font @import is duplicated in the main canvasCss style
  // block, so removing mj-head does not lose the font.
  doc
    .querySelectorAll("mj-head, mj-attributes, mj-font, mj-all")
    .forEach((el) => el.remove());

  let html = doc.documentElement.outerHTML;

  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/\s+data-gjs-[a-zA-Z0-9-]+(?:="[^"]*"|='[^']*')?/g, "");
  html = html.replace(/\s+data-is-empty(?:="[^"]*"|='[^']*')?/g, "");
  html = html.replace(/\s+data-column-count(?:="[^"]*"|='[^']*')?/g, "");
  html = html.replace(/\s+data-manual-width(?:="[^"]*"|='[^']*')?/g, "");
  html = html.replace(/\s+draggable="[^"]*"/g, "");
  html = html.replace(/\s*gjs-selected\b/g, "");
  html = html.replace(/\s*gjs-hovered\b/g, "");

  return minifyHTML(html);
}
