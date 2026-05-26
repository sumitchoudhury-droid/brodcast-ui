import { useState } from "react";
import "./style.scss";
import signatureIcon from "../../../../../../assets/commonIcons/signatureIcon.svg";
import fileTextIcon from "../../../../../../assets/commonIcons/fileTextIcon.svg";
import fileHtmlIcon from "../../../../../../assets/commonIcons/fileHtmlIcon.svg";
import { ReusableDropDown } from "../../../../../../reusableComponents/reusableDropDown/index";
import { ReusableModal } from "../../../../../../reusableComponents/reusableModal";
import { ReusableUpload } from "../../../../../../reusableComponents/reusableUpload";
import { htmlToMjml, isMjml } from "../../../../../../utils/htmlToMjml";
import { useToast } from "../../../../../../hooks/useToast";

export default function SignatureSection({ editorRef }) {
  const [signature, setSignature] = useState("");
  const [onDemandForm, setOnDemandForm] = useState("");
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

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
    if (existingSig) {
      existingSig.remove();
    }

    // Build replacement MJML with the selected signature text.
    const newSigHtml = `<mj-section full-width="full-width" data-type="signature-section" padding="0px" margin="0px" width="100%" background-color="transparent">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text padding="16px 0px" margin="0px" color="#181D25" font-size="20px" font-weight="500" font-family="Inter" line-height="20px">
      ${selectedValue}
    </mj-text>
  </mj-column>
</mj-section>`;

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
    setSelectedFile(null);
    setOpenUploadModal(true);
  };

  const handleUploadConfirm = () => {
    if (!selectedFile) {
      toast.error("No file selected", "Please select an HTML or MJML file.");
      return;
    }
    setOpenConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    if (!selectedFile || isLoading) return;

    setIsLoading(true);
    try {
      const text = await selectedFile.text();

      let mjmlContent;
      if (isMjml(text) || selectedFile.name.toLowerCase().endsWith(".mjml")) {
        // File is already MJML — use it directly
        mjmlContent = text;
        console.log(
          "[ImportTemplate] File detected as MJML, loading directly."
        );
      } else {
        // Convert HTML → MJML
        console.log("[ImportTemplate] Converting HTML → MJML…");
        mjmlContent = htmlToMjml(text);
      }

      const loadFn = editorRef?.current?.loadTemplate;
      if (!loadFn)
        throw new Error("Editor not ready — loadTemplate unavailable.");

      loadFn(mjmlContent);

      setOpenConfirmModal(false);
      setOpenUploadModal(false);
      setSelectedFile(null);
      toast.success(
        "Template imported",
        "Your template has been loaded into the editor."
      );
    } catch (err) {
      console.error("[ImportTemplate] failed:", err);
      toast.error(
        "Import failed",
        err?.message ||
          "Could not parse the file. Check the format and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelConfirm = () => {
    setOpenConfirmModal(false);
    // Upload modal stays open so the user can re-pick a file
  };

  const handleCloseUploadModal = () => {
    setOpenUploadModal(false);
    setSelectedFile(null);
  };

  const handleOnDemandFormClick = (value) => {
    setOnDemandForm(value);

    const editor = editorRef?.current?.getEditor();
    if (!editor) {
      toast.error("Editor Error", "Editor instance not found");
      return;
    }

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

    const formUrl = `https://forms.manipalhospitals.com/${value}`;
    const newFormHtml = `<mj-section full-width="full-width" data-type="on-demand-form-section" padding="10px 0px" margin="0px" width="100%" background-color="transparent">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text padding="10px 0px" font-family="Inter" font-size="16px" color="#181D25" line-height="24px">
      Kindly review and submit the form at the link below.<br />
      <a href="${formUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${formUrl}</a>
    </mj-text>
  </mj-column>
</mj-section>`;

    mjBody.append(newFormHtml);
    toast.success("Success", "On-demand form link added to editor");
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
          onChange={handleOnDemandFormClick}
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

      {/* ── Upload modal ──────────────────────────────────────────────────── */}
      <ReusableModal
        isOpen={openUploadModal}
        title="Upload Template"
        onClose={handleCloseUploadModal}
        onConfirm={handleUploadConfirm}
        cancelText="Cancel"
        confirmText="Upload"
      >
        <ReusableUpload
          accept=".html,.htm,.mjml"
          onChange={(file) => setSelectedFile(file)}
        />
      </ReusableModal>

      {/* ── Confirm replace modal ─────────────────────────────────────────── */}
      <ReusableModal
        isOpen={openConfirmModal}
        title="Confirm Template Import"
        onClose={handleCancelConfirm}
        onConfirm={handleFinalConfirm}
        cancelText="Cancel"
        confirmText={isLoading ? "Importing…" : "Confirm & Import"}
      >
        <div className="confirmUploadTemplateContainer">
          <p className="confirmUploadTemplateContainerTitle">
            Are you sure you want to{" "}
            <span style={{ fontWeight: "600" }}>import this template?</span>
          </p>
          <p className="confirmUploadTemplateContainerTitle">
            Your current editor content will be replaced with the content from{" "}
            <span style={{ fontWeight: "600" }}>{selectedFile?.name}</span>.
          </p>
        </div>
      </ReusableModal>
    </>
  );
}
