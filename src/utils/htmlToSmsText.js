// Convert the GrapesJS SMS editor HTML into the plain-text body an SMS gateway
// expects. Strips <style>/<script>, unwraps <a> to bare URLs, converts <br>
// and block boundaries to newlines, and preserves placeholder tokens like
// {PatientName} verbatim for backend interpolation.
export function htmlToSmsText(rawHtml) {
  if (!rawHtml) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  doc.querySelectorAll("style, script").forEach((el) => el.remove());

  doc.querySelectorAll("a").forEach((a) => {
    const href = (a.getAttribute("href") || "").trim();
    const text = a.textContent.trim();
    const replacement = doc.createTextNode(href || text);
    a.replaceWith(replacement);
  });

  doc.querySelectorAll("br").forEach((br) => {
    br.replaceWith(doc.createTextNode("\n"));
  });

  doc
    .querySelectorAll("div, p, li, tr, section, article, header, footer")
    .forEach((el) => {
      el.append(doc.createTextNode("\n"));
    });

  const text = doc.body ? doc.body.textContent : "";

  return text
    .replace(/\u200B/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
