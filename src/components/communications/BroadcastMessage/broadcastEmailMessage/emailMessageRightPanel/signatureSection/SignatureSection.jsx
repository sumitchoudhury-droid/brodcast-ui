import { useState } from "react";
import "./style.scss";
import signatureIcon from "../../../../../../assets/commonIcons/signatureIcon.svg";

import fileTextIcon from "../../../../../../assets/commonIcons/fileTextIcon.svg";
import fileHtmlIcon from "../../../../../../assets/commonIcons/fileHtmlIcon.svg";
import { ReusableDropDown } from "../../../../../../reusableComponents/reusableDropDown/index";
import { ReusableModal } from "../../../../../../reusableComponents/reusableModal";
import { ReusableUpload } from "../../../../../../reusableComponents/reusableUpload";

export default function SignatureSection({ editorRef }) {
  const [signature, setSignature] = useState("");
  const [onDemandForm, setOnDemandForm] = useState("");
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const applySignatureToEditor = (selectedValue) => {
    const editor = editorRef?.current?.getEditor();
    if (!editor) return;

    // Find mj-body
    const wrapper = editor.getWrapper();
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

    // Find the existing signature section
    let existingSig = null;
    mjBody.components().each((c) => {
      if (c.getAttributes?.()?.["data-type"] === "signature-section") {
        existingSig = c;
      }
    });
    if (!existingSig) return;

    // Build replacement MJML with the selected signature text.
    // Remove old first (reconciler ignores sig-section removals), then append
    // the new one so GrapesJS parses and renders it fresh.
    const newSigHtml = `<mj-section full-width="full-width" data-type="signature-section" padding="0px" margin="0px" width="100%" background-color="#ffffff">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text padding="16px 0px" margin="0px" color="#181D25" font-size="20px" font-weight="500" font-family="Inter" line-height="20px">
      ${selectedValue}
    </mj-text>
  </mj-column>
</mj-section>`;

    existingSig.remove();
    mjBody.append(newSigHtml);
  };

  const handleSignatureChange = (value) => {
    setSignature(value);
    applySignatureToEditor(value);
  };

  const SignatureOptions = [
    {
      label: "Warm Regards, Manipal Hospitals Team",
      value: "Warm Regards, Manipal Hospitals Team"
    },
    {
      label: "Best Regards,  Support Team, Manipal Hospitals",
      value: "Best Regards,  Support Team, Manipal Hospitals"
    },
    {
      label: "Sincerely,  Patient Care Team,  Manipal Hospitals",
      value: "Sincerely,  Patient Care Team,  Manipal Hospitals"
    },
    {
      label:
        "This is an automated communication from Manipal Hospitals. Please do not reply to this email.",
      value:
        "This is an automated communication from Manipal Hospitals. Please do not reply to this email."
    }
  ];

  const OnDemandFormsOptions = [
    { label: "ASQ3", value: "ASQ3" },
    { label: "Administration", value: "Administration" },
    { label: "Clinical", value: "Clinical" },
    { label: "Health Screening Forms", value: "Health Screening Forms" },
    { label: "Patient Feedback Forms", value: "Patient Feedback Forms" }
  ];

  const handleImportClick = () => {
    setOpenUploadModal(true);
  };

  const handleUploadConfirm = () => {
    // Don't close the upload modal, just open the confirm modal
    setOpenConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    console.log("Confirmed");
    setOpenConfirmModal(false);
    setOpenUploadModal(false); // Close both modals after final confirmation
  };

  const handleCancelConfirm = () => {
    setOpenConfirmModal(false);
    // Upload modal remains open
  };

  return (
    <>
      <div className="signatureSectionContainer">
        <ReusableDropDown
          options={SignatureOptions}
          value={signature}
          placeholder="Select Signature"
          onChange={handleSignatureChange}
          valueImage={signatureIcon}
        />
        <ReusableDropDown
          options={OnDemandFormsOptions}
          value={onDemandForm}
          placeholder="Select On-Demand Form"
          onChange={setOnDemandForm}
          valueImage={fileTextIcon}
        />

        <div className="importTemplateContainer" onClick={handleImportClick}>
          <img
            src={fileHtmlIcon}
            alt="fileHtmlIcon"
            className="importTemplateContainerImage"
          />
          <p>Import Template</p>
        </div>
      </div>

      <ReusableModal
        isOpen={openUploadModal}
        title="Upload Template"
        onClose={() => setOpenUploadModal(false)}
        onConfirm={handleUploadConfirm}
        cancelText="Cancel"
        confirmText="Upload"
      >
        <ReusableUpload />
      </ReusableModal>

      <ReusableModal
        isOpen={openConfirmModal}
        title="Confirm Upload Template"
        onClose={handleCancelConfirm}
        onConfirm={handleFinalConfirm}
        cancelText="Cancel"
        confirmText="Confirm & Upload"
      >
        <div className="confirmUploadTemplateContainer">
          <p className="confirmUploadTemplateContainerTitle">
            Are you sure you want to{" "}
            <span style={{ fontWeight: "600" }}>
              upload this HTML template?
            </span>
          </p>
          <p className="confirmUploadTemplateContainerTitle">
            Your current content will be replaced with the uploaded template
            content.
          </p>
        </div>
      </ReusableModal>
    </>
  );
}
