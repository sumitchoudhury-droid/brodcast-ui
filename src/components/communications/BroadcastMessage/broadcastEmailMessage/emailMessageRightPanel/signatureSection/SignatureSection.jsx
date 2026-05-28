import { useState } from "react";
import "./style.scss";
import signatureIcon from "../../../../../../assets/commonIcons/signatureIcon.svg";
import fileTextIcon from "../../../../../../assets/commonIcons/fileTextIcon.svg";
import fileHtmlIcon from "../../../../../../assets/commonIcons/fileHtmlIcon.svg";
import { ReusableDropDown } from "../../../../../../reusableComponents/reusableDropDown/index";
import { ReusableModal } from "../../../../../../reusableComponents/reusableModal";
import { ReusableUpload } from "../../../../../../reusableComponents/reusableUpload";
import { useToast } from "../../../../../../hooks/useToast";
import ReusableLinkModal from "../../../../../../reusableComponents/reusableLinkModal/index";

export default function SignatureSection({ editorRef, isEditorEmpty }) {
  const [signature, setSignature] = useState("");
  const [onDemandForm, setOnDemandForm] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const applySignatureToEditor = (selectedValue) => {
    const editor = editorRef?.current?.getEditor();
    if (!editor) return;

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

    // Recursively find if there is an existing signature section
    let existingSig = null;
    const findSigComp = (comp) => {
      if (existingSig) return;
      if (comp.getAttributes?.()?.["data-type"] === "signature-section") {
        existingSig = comp;
        return;
      }
      comp.components().each(findSigComp);
    };
    findSigComp(wrapper);

    if (mjBody) {
      // MJML mode
      const newSigHtml = `<mj-section full-width="full-width" data-type="signature-section" padding="0px" margin="0px" width="100%" background-color="transparent">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text padding="16px 0px" margin="0px" color="#181D25" font-size="20px" font-weight="500" font-family="Inter" line-height="20px">
      ${selectedValue}
    </mj-text>
  </mj-column>
</mj-section>`;

      if (existingSig) {
        const parent = existingSig.parent();
        const idx = parent.components().indexOf(existingSig);
        existingSig.remove();
        parent.components().add(newSigHtml, { at: idx });
      } else {
        mjBody.append(newSigHtml);
      }
    } else {
      // HTML mode
      const newSigHtml = `<div data-type="signature-section" style="padding: 16px 0px; margin: 0px; color: #181D25; font-size: 20px; font-weight: 500; font-family: Inter, sans-serif; line-height: 20px;">
        ${selectedValue}
      </div>`;

      if (existingSig) {
        const parent = existingSig.parent();
        const idx = parent.components().indexOf(existingSig);
        existingSig.remove();
        parent.components().add(newSigHtml, { at: idx });
      } else {
        wrapper.append(newSigHtml);
      }
    }
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

      // Bypass htmlToMjml conversion completely to preserve 100% of the original template styles and structure.
      // Load standard HTML or MJML directly.
      const templateContent = text;

      const loadFn = editorRef?.current?.loadTemplate;
      if (!loadFn)
        throw new Error("Editor not ready — loadTemplate unavailable.");

      loadFn(templateContent);

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
    setLinkValue(""); // Reset link value when a new form is selected
    setIsLinkModalOpen(true);
  };

  const handleLinkModalConfirm = () => {
    const editor = editorRef?.current?.getEditor();
    if (!editor) {
      toast.error("Editor Error", "Editor instance not found");
      return;
    }

    if (!linkValue) {
      toast.error("Invalid Link", "Please enter a URL for the form");
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

    // Recursively find if there is an existing on-demand form section
    let existingForm = null;
    const findFormComp = (comp) => {
      if (existingForm) return;
      if (comp.getAttributes?.()?.["data-type"] === "on-demand-form-section") {
        existingForm = comp;
        return;
      }
      comp.components().each(findFormComp);
    };
    findFormComp(wrapper);

    if (mjBody) {
      // MJML mode
      const newFormHtml = `<mj-section full-width="full-width" data-type="on-demand-form-section" padding="10px 0px" margin="0px" width="100%" background-color="transparent">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text padding="10px 0px" font-family="Inter" font-size="16px" color="#007bff">
      <a href="${linkValue}" target="_blank" style="color: #007bff; text-decoration: underline;">${onDemandForm}</a>
    </mj-text>
  </mj-column>
</mj-section>`;

      if (existingForm) {
        const parent = existingForm.parent();
        const idx = parent.components().indexOf(existingForm);
        existingForm.remove();
        parent.components().add(newFormHtml, { at: idx });
      } else {
        // If signature section exists, place the form section just above it
        let existingSig = null;
        mjBody.components().each((c) => {
          if (c.getAttributes?.()?.["data-type"] === "signature-section") {
            existingSig = c;
          }
        });
        if (existingSig) {
          const idx = mjBody.components().indexOf(existingSig);
          mjBody.components().add(newFormHtml, { at: idx });
        } else {
          mjBody.append(newFormHtml);
        }
      }
    } else {
      // HTML mode
      const newFormHtml = `<div data-type="on-demand-form-section" style="padding: 10px 0px; margin: 0px; font-family: Inter, sans-serif; font-size: 16px; color: #007bff;">
        <a href="${linkValue}" target="_blank" style="color: #007bff; text-decoration: underline;">${onDemandForm}</a>
      </div>`;

      if (existingForm) {
        const parent = existingForm.parent();
        const idx = parent.components().indexOf(existingForm);
        existingForm.remove();
        parent.components().add(newFormHtml, { at: idx });
      } else {
        // If signature section exists, place the form section just above it
        let existingSig = null;
        const findSigComp = (comp) => {
          if (existingSig) return;
          if (comp.getAttributes?.()?.["data-type"] === "signature-section") {
            existingSig = comp;
            return;
          }
          comp.components().each(findSigComp);
        };
        findSigComp(wrapper);

        if (existingSig) {
          const parent = existingSig.parent();
          const idx = parent.components().indexOf(existingSig);
          parent.components().add(newFormHtml, { at: idx });
        } else {
          wrapper.append(newFormHtml);
        }
      }
    }

    setIsLinkModalOpen(false);
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

        {isEditorEmpty && (
          <div className="importTemplateContainer" onClick={handleImportClick}>
            <img
              src={fileHtmlIcon}
              alt="fileHtmlIcon"
              className="importTemplateContainerImage"
            />
            <p>Import Template</p>
          </div>
        )}
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

      <ReusableLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onConfirm={handleLinkModalConfirm}
        formName={onDemandForm}
        setFormName={setOnDemandForm}
        linkValue={linkValue}
        setLinkValue={setLinkValue}
      />
    </>
  );
}
