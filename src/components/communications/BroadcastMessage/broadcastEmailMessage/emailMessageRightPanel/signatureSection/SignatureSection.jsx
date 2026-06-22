import { useState, useRef, useEffect } from "react";
import "./style.scss";
import signatureIcon from "../../../../../../assets/commonIcons/signatureIcon.svg";
import fileTextIcon from "../../../../../../assets/commonIcons/fileTextIcon.svg";
import fileHtmlIcon from "../../../../../../assets/commonIcons/fileHtmlIcon.svg";
import checkBox from "../../../../../../assets/mainScreen/checkBox.svg";
import uncheckBox from "../../../../../../assets/mainScreen/uncheckBox.svg";
import searchIcon from "../../../../../../assets/mainScreen/searchIcon.svg";
import greenChevronRight from "../../../../../../assets/mainScreen/greenChevronRight.svg";
import chevronRight from "../../../../../../assets/mainScreen/chevronRight.svg";

import { ReusableDropDown } from "../../../../../../reusableComponents/reusableDropDown/index";
import { ReusableModal } from "../../../../../../reusableComponents/reusableModal";
import { ReusableUpload } from "../../../../../../reusableComponents/reusableUpload";
import { useToast } from "../../../../../../hooks/useToast";
import { ReusableInput } from "../../../../../../reusableComponents/reusableInput";

export default function SignatureSection({ editorRef, isEditorEmpty }) {
  const [mailSubject, setMailSubject] = useState("");
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
  const [previewForm, setPreviewForm] = useState(null);
  const [expandedForm, setExpandedForm] = useState(null);
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
    <mj-text padding="16px" margin="0px" color="#181D25" font-size="20px" font-weight="500" font-family="Inter" line-height="20px">
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
      const newSigHtml = `<div data-type="signature-section" style="padding: 16px; margin: 0px; color: #181D25; font-size: 20px; font-weight: 500; font-family: Inter, sans-serif; line-height: 20px;">
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
    {
      label: "ASQ3",
      value: "ASQ3",
      subOptions: [
        { label: "ASQ3 1", value: "ASQ3_1" },
        { label: "ASQ3 2", value: "ASQ3_2" }
      ]
    },
    {
      label: "Administration",
      value: "Administration",
      subOptions: [
        { label: "Administration 1", value: "Administration_1" },
        { label: "Administration 2", value: "Administration_2" },
        { label: "Administration 3", value: "Administration_3" }
      ]
    },
    {
      label: "Clinical",
      value: "Clinical",
      subOptions: [
        { label: "Clinical 1", value: "Clinical_1" },
        { label: "Clinical 2", value: "Clinical_2" }
      ]
    },
    {
      label: "Health Screening Forms",
      value: "Health Screening Forms"
      // subOptions: [
      //   { label: "Health Screening 1", value: "HealthScreening_1" },
      //   { label: "Health Screening 2", value: "HealthScreening_2" }
      // ]
    },
    {
      label: "Patient Feedback Forms",
      value: "Patient Feedback Forms",
      subOptions: [
        { label: "Patient Feedback 1", value: "PatientFeedback_1" },
        { label: "Patient Feedback 2", value: "PatientFeedback_2" }
      ]
    }
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
    if (isEditorEmpty) {
      handleFinalConfirm();
    } else {
      setOpenConfirmModal(true);
    }
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

  const buildCombinedFormUrl = (formValues) => {
    const params = formValues
      .map((v) => `forms=${encodeURIComponent(v)}`)
      .join("&");
    return `https://forms.manipalhospitals.com?${params}`;
  };

  const insertCombinedFormLink = (formValues) => {
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

    // Find existing combined form section
    let existingForm = null;
    const findFormComp = (comp) => {
      if (existingForm) return;
      if (comp.getAttributes?.()?.["data-form-value"] === "ondemand_forms") {
        existingForm = comp;
        return;
      }
      comp.components().each(findFormComp);
    };
    findFormComp(wrapper);

    const combinedUrl = buildCombinedFormUrl(formValues);

    if (mjBody) {
      const newFormHtml = `<mj-section full-width="full-width" data-type="on-demand-form-section" data-form-value="ondemand_forms" padding="0px" margin="0px" width="100%" background-color="transparent">
  <mj-column padding="0px" margin="0px" width="100%">
    <mj-text padding="0px" font-family="Inter" font-size="16px" color="#181D25" line-height="24px">
      <div style="padding: 16px;">
        Kindly review and submit the form at the link below.<br />
        <a href="${combinedUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${combinedUrl}</a>
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
      const newFormHtml = `<div data-type="on-demand-form-section" data-form-value="ondemand_forms" style="padding-top: 6px; padding-bottom: 6px; padding-left: 0px; padding-right: 0px; margin: 0px; font-family: Inter, sans-serif; font-size: 16px; color: #181D25; line-height: 24px;">
        Kindly review and submit the form at the link below.<br />
        <a href="${combinedUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${combinedUrl}</a>
      </div>`;

      if (existingForm) {
        const parent = existingForm.parent();
        const idx = parent.components().indexOf(existingForm);
        existingForm.remove();
        parent.components().add(newFormHtml, { at: idx });
      } else {
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
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowFormsDropdown(false);
        setPendingForms(selectedForms);
        setFormSearch("");
        setExpandedForm(null);
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

  const handleToggleAllSubs = (opt) => {
    const subValues = opt.subOptions.map((s) => s.value);
    const allChecked = subValues.every((v) => pendingForms.includes(v));
    setPendingForms((prev) =>
      allChecked
        ? prev.filter((v) => !subValues.includes(v))
        : [...new Set([...prev, ...subValues])]
    );
  };

  const handleFormsSend = () => {
    if (pendingForms.length > 0) {
      insertCombinedFormLink(pendingForms);
      toast.success("Success", "On-demand form link added to editor");
    } else if (selectedForms.length > 0) {
      // All forms deselected — remove the existing combined section
      const editor = editorRef?.current?.getEditor();
      if (editor) {
        const wrapper = editor.getWrapper();
        let existingForm = null;
        const findFormComp = (comp) => {
          if (existingForm) return;
          if (
            comp.getAttributes?.()?.["data-form-value"] === "ondemand_forms"
          ) {
            existingForm = comp;
            return;
          }
          comp.components().each(findFormComp);
        };
        findFormComp(wrapper);
        if (existingForm) existingForm.remove();
      }
    }

    setSelectedForms(pendingForms);
    setShowFormsDropdown(false);
    setFormSearch("");
    setExpandedForm(null);
  };

  const handleFormsCancel = () => {
    setPendingForms([...selectedForms]);
    setShowFormsDropdown(false);
    setFormSearch("");
    setExpandedForm(null);
  };

  const filteredFormOptions = OnDemandFormsOptions.filter((opt) =>
    opt.label.toLowerCase().includes(formSearch.toLowerCase())
  );

  return (
    <>
      <div className="signatureSectionContainer">
        <ReusableInput
          placeholder="Enter Mail Subject"
          value={mailSubject}
          onChange={(e) => setMailSubject(e.target.value)}
        />
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
                    const isFolder =
                      opt.subOptions && opt.subOptions.length > 0;
                    const isExpanded = expandedForm === opt.value;
                    const allSubChecked =
                      isFolder &&
                      opt.subOptions.every((s) =>
                        pendingForms.includes(s.value)
                      );
                    const someSubChecked =
                      isFolder &&
                      opt.subOptions.some((s) =>
                        pendingForms.includes(s.value)
                      );
                    const isFileChecked =
                      !isFolder && pendingForms.includes(opt.value);

                    return (
                      <div key={opt.value}>
                        <div
                          className={`formsOption ${someSubChecked || isFileChecked ? "checked" : ""}`}
                          onClick={() => {
                            if (isFolder) {
                              setExpandedForm(isExpanded ? null : opt.value);
                            } else {
                              handleToggleForm(opt.value);
                            }
                          }}
                        >
                          <img
                            src={
                              isFolder
                                ? allSubChecked
                                  ? checkBox
                                  : uncheckBox
                                : isFileChecked
                                  ? checkBox
                                  : uncheckBox
                            }
                            alt="checkbox"
                            className="formsCheckbox"
                            onClick={
                              isFolder
                                ? (e) => {
                                    e.stopPropagation();
                                    handleToggleAllSubs(opt);
                                  }
                                : undefined
                            }
                          />
                          <span className="formsOptionLabel">{opt.label}</span>
                          {isFolder && (
                            <img
                              src={chevronRight}
                              alt="expand"
                              className={`formsEyeIcon ${isExpanded ? "rotated" : ""}`}
                            />
                          )}
                        </div>

                        {isFolder && isExpanded && (
                          <div className="formsSubOptionsList">
                            {opt.subOptions.map((sub) => {
                              const isSubChecked = pendingForms.includes(
                                sub.value
                              );
                              return (
                                <div
                                  key={sub.value}
                                  className={`formsSubOption ${isSubChecked ? "checked" : ""}`}
                                  onClick={() => handleToggleForm(sub.value)}
                                >
                                  <img
                                    src={isSubChecked ? checkBox : uncheckBox}
                                    alt="checkbox"
                                    className="formsCheckbox"
                                  />
                                  <span className="formsOptionLabel">
                                    {sub.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
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

        <div className="importTemplateContainer" onClick={handleImportClick}>
          <img
            src={fileHtmlIcon}
            alt="fileHtmlIcon"
            className="importTemplateContainerImage"
          />
          <p>Import Template</p>
        </div>
      </div>

      {/* ── Form preview modal ───────────────────────────────────────────── */}
      <ReusableModal
        isOpen={!!previewForm}
        title={previewForm ? `${previewForm.label} Form Preview` : ""}
        onClose={() => setPreviewForm(null)}
        onConfirm={() => setPreviewForm(null)}
        confirmText="Close"
        cancelText={null}
      >
        <div className="formPreviewContent">
          <div className="formPreviewField">
            <label>Patient Name</label>
            <input type="text" defaultValue="John Doe" readOnly />
          </div>
          <div className="formPreviewField">
            <label>Date of Birth</label>
            <input type="text" defaultValue="01/15/1985" readOnly />
          </div>
          <div className="formPreviewField">
            <label>Contact Number</label>
            <input type="text" defaultValue="+91 98765 43210" readOnly />
          </div>
          <div className="formPreviewField">
            <label>Email Address</label>
            <input type="text" defaultValue="john.doe@example.com" readOnly />
          </div>
          <div className="formPreviewField">
            <label>Doctor / Department</label>
            <input
              type="text"
              defaultValue="Dr. Sharma – Cardiology"
              readOnly
            />
          </div>
          <div className="formPreviewField">
            <label>Appointment Date</label>
            <input type="text" defaultValue="10/06/2026" readOnly />
          </div>
          <div className="formPreviewField">
            <label>Notes / Comments</label>
            <textarea
              defaultValue="Please bring all previous medical reports."
              readOnly
              rows={3}
            />
          </div>
        </div>
      </ReusableModal>

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
          noLimit={true}
        />
      </ReusableModal>

      {/* ── Confirm replace modal ─────────────────────────────────────────── */}
      <ReusableModal
        isOpen={openConfirmModal}
        title="Confirm Upload Template"
        onClose={handleCancelConfirm}
        onConfirm={handleFinalConfirm}
        cancelText="Cancel"
        confirmText={isLoading ? "Importing…" : "Confirm & Import"}
      >
        <div className="confirmUploadTemplateContainer">
          <p className="confirmUploadTemplateContainerTitle">
            Are you sure you want to{" "}
            <span style={{ fontWeight: "600" }}>
              upload this HTML template?
            </span>
          </p>
          <p className="confirmUploadTemplateContainerTitle">
            Your current content will be replaced with the{" "}
            <span style={{ fontWeight: "600" }}>{selectedFile?.name}</span>.
          </p>
        </div>
      </ReusableModal>
    </>
  );
}
