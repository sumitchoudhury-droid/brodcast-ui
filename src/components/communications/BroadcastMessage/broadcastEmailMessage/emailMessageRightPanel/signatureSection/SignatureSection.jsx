import { useState, useRef, useEffect } from "react";
import "./style.scss";
import signatureIcon from "../../../../../../assets/commonIcons/signatureIcon.svg";
import fileTextIcon from "../../../../../../assets/commonIcons/fileTextIcon.svg";
import fileHtmlIcon from "../../../../../../assets/commonIcons/fileHtmlIcon.svg";
import checkBox from "../../../../../../assets/mainScreen/checkBox.svg";
import uncheckBox from "../../../../../../assets/mainScreen/uncheckBox.svg";
import searchIcon from "../../../../../../assets/mainScreen/searchIcon.svg";
import greenChevronRight from "../../../../../../assets/mainScreen/greenChevronRight.svg";
import eyeIcon from "../../../../../../assets/mainScreen/eyeIcon.svg";

import { ReusableDropDown } from "../../../../../../reusableComponents/reusableDropDown/index";
import { ReusableModal } from "../../../../../../reusableComponents/reusableModal";
import { ReusableUpload } from "../../../../../../reusableComponents/reusableUpload";
import { useToast } from "../../../../../../hooks/useToast";

export default function SignatureSection({ editorRef, isEditorEmpty }) {
  const [signature, setSignature] = useState("");
  const [showFormsDropdown, setShowFormsDropdown] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);
  const [pendingForms, setPendingForms] = useState([]);
  const [formSearch, setFormSearch] = useState("");
  const dropdownRef = useRef(null);
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

    // Recursively find if there is an existing on-demand form section for this specific value
    let existingForm = null;
    const findFormComp = (comp) => {
      if (existingForm) return;
      if (comp.getAttributes?.()?.["data-form-value"] === value) {
        existingForm = comp;
        return;
      }
      comp.components().each(findFormComp);
    };
    findFormComp(wrapper);

    if (mjBody) {
      // MJML mode
      const formUrl = `https://forms.manipalhospitals.com/${value}`;
      const newFormHtml = `<mj-section full-width="full-width" data-type="on-demand-form-section" data-form-value="${value}" padding="0px" margin="0px" width="100%" background-color="transparent">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text padding="0px" font-family="Inter" font-size="16px" color="#181D25" line-height="24px">
      <div style="padding: 6px 0px;">
        Kindly review and submit the form at the link below.<br />
        <a href="${formUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${formUrl}</a>
      </div>
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
      const formUrl = `https://forms.manipalhospitals.com/${value}`;
      const newFormHtml = `<div data-type="on-demand-form-section" data-form-value="${value}" style="padding-top: 6px; padding-bottom: 6px; padding-left: 0px; padding-right: 0px; margin: 0px; font-family: Inter, sans-serif; font-size: 16px; color: #181D25; line-height: 24px;">
        Kindly review and submit the form at the link below.<br />
        <a href="${formUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${formUrl}</a>
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

    toast.success("Success", "On-demand form link added to editor");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowFormsDropdown(false);
        setPendingForms(selectedForms);
        setFormSearch("");
      }
    };
    if (showFormsDropdown)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFormsDropdown, selectedForms]);

  const handleOpenFormsDropdown = () => {
    if (showFormsDropdown) {
      setShowFormsDropdown(false);
      setPendingForms(selectedForms);
      setFormSearch("");
    } else {
      setPendingForms([...selectedForms]);
      setFormSearch("");
      setShowFormsDropdown(true);
    }
  };

  const handleToggleForm = (value) => {
    setPendingForms((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleFormsSend = () => {
    selectedForms.forEach((form) => {
      const editor = editorRef?.current?.getEditor();
      if (editor) {
        const wrapper = editor.getWrapper();
        let existingForm = null;
        const findFormComp = (comp) => {
          if (existingForm) return;
          if (comp.getAttributes?.()?.["data-form-value"] === form) {
            existingForm = comp;
            return;
          }
          comp.components().each(findFormComp);
        };
        findFormComp(wrapper);
        if (existingForm) existingForm.remove();
      }
    });

    pendingForms.forEach((form) => handleOnDemandFormClick(form));
    setSelectedForms(pendingForms);
    setShowFormsDropdown(false);
    setFormSearch("");
  };

  const handleFormsCancel = () => {
    setPendingForms([...selectedForms]);
    setShowFormsDropdown(false);
    setFormSearch("");
  };

  const filteredFormOptions = OnDemandFormsOptions.filter((opt) =>
    opt.label.toLowerCase().includes(formSearch.toLowerCase())
  );

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
        {/* On-Demand Forms multiselect */}
        <div className="formsMultiSelect" ref={dropdownRef}>
          <div
            className={`formsMultiSelectTrigger ${showFormsDropdown ? "open" : ""}`}
            onClick={handleOpenFormsDropdown}
          >
            <img src={fileTextIcon} alt="forms" className="triggerIcon" />
            <span
              className={`triggerLabel ${selectedForms.length === 0 ? "placeholder" : ""}`}
            >
              {selectedForms.length === 0
                ? "Select On-Demand Form"
                : `${selectedForms.length} form${selectedForms.length > 1 ? "s" : ""} selected`}
            </span>
            <img
              src={greenChevronRight}
              alt="chevron"
              className={`triggerChevron ${showFormsDropdown ? "rotated" : ""}`}
            />
          </div>

          {showFormsDropdown && (
            <div className="formsDropdownPanel">
              {/* Search */}
              <div className="formsSearchWrapper">
                <img
                  src={searchIcon}
                  alt="search"
                  className="formsSearchIcon"
                />
                <input
                  type="text"
                  placeholder="Search by Form Name"
                  value={formSearch}
                  onChange={(e) => setFormSearch(e.target.value)}
                  className="formsSearchInput"
                  autoFocus
                />
              </div>

              {/* Options list */}
              <div className="formsOptionsList">
                {filteredFormOptions.length === 0 ? (
                  <div className="formsNoResults">No results found</div>
                ) : (
                  filteredFormOptions.map((opt) => {
                    const isChecked = pendingForms.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        className={`formsOption ${isChecked ? "checked" : ""}`}
                        onClick={() => handleToggleForm(opt.value)}
                      >
                        <img
                          src={isChecked ? checkBox : uncheckBox}
                          alt="checkbox"
                          className="formsCheckbox"
                        />
                        <span className="formsOptionLabel">{opt.label}</span>
                        <img
                          src={eyeIcon}
                          alt="preview"
                          className="formsEyeIcon"
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer buttons */}
              <div className="formsDropdownFooter">
                <button className="formsCancelBtn" onClick={handleFormsCancel}>
                  Cancel
                </button>
                <button className="formsSendBtn" onClick={handleFormsSend}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

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
    </>
  );
}
