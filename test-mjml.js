import mjml2html from "mjml";

const mjml = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column width="80%">
        <mj-text>Hello</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

console.log(mjml2html(mjml).html.includes("80%"));
