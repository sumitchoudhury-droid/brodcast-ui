import { useState, useRef, useEffect } from "react";
import "./style.scss";
// import signatureIcon from "../../../../../../assets/commonIcons/signatureIcon.svg";
import fileTextIcon from "../../../../../../assets/commonIcons/fileTextIcon.svg";
import checkBox from "../../../../../../assets/mainScreen/checkBox.svg";
import uncheckBox from "../../../../../../assets/mainScreen/uncheckBox.svg";
import searchIcon from "../../../../../../assets/mainScreen/searchIcon.svg";
import greenChevronRight from "../../../../../../assets/mainScreen/greenChevronRight.svg";
import chevronRight from "../../../../../../assets/mainScreen/chevronRight.svg";
// import { ReusableDropDown } from "../../../../../../reusableComponents/reusableDropDown/index";
import { ReusableModal } from "../../../../../../reusableComponents/reusableModal/index";
import { useToast } from "../../../../../../hooks/useToast";
import { useBroadcastForm } from "../../../../broadcastFormContext";

export default function TextSignatureSection({
  editorInstance
  // isEditorEmpty
}) {
  const { importedTemplateName, newTemplateName, selectedTemplateData } =
    useBroadcastForm();

  const displayTemplateName =
    importedTemplateName ||
    selectedTemplateData?.title ||
    newTemplateName ||
    "";
  // const [signature, setSignature] = useState("");
  const [showFormsDropdown, setShowFormsDropdown] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);
  const [pendingForms, setPendingForms] = useState([]);
  const [formSearch, setFormSearch] = useState("");
  const [previewForm, setPreviewForm] = useState(null);
  const [expandedForm, setExpandedForm] = useState(null);
  const dropdownRef = useRef(null);
  const toast = useToast();

  // const applySignatureToEditor = (selectedValue) => {
  //   if (!editorInstance) return;
  //   editorInstance.insertSignature(selectedValue, isEditorEmpty);
  // };

  // const handleSignatureChange = (value) => {
  //   setSignature(value);
  //   applySignatureToEditor(value);
  // };

  // const SignatureOptions = [
  //   {
  //     label: "Warm Regards, Manipal Hospitals Team",
  //     value: "Warm Regards, Manipal Hospitals Team"
  //   },
  //   {
  //     label: "Best Regards,  Support Team, Manipal Hospitals",
  //     value: "Best Regards,  Support Team, Manipal Hospitals"
  //   },
  //   {
  //     label: "Sincerely,  Patient Care Team,  Manipal Hospitals",
  //     value: "Sincerely,  Patient Care Team,  Manipal Hospitals"
  //   },
  //   {
  //     label:
  //       "This is an automated communication from Manipal Hospitals. Please do not reply to this email.",
  //     value:
  //       "This is an automated communication from Manipal Hospitals. Please do not reply to this email."
  //   },
  //   {
  //     label: "Add Signature",
  //     value: "Add Signature"
  //   }
  // ];

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

  const buildCombinedFormUrl = (formValues) => {
    const params = formValues
      .map((v) => `forms=${encodeURIComponent(v)}`)
      .join("&");
    return `https://forms.manipalhospitals.com?${params}`;
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
    if (!editorInstance) {
      toast.error("Editor Error", "Editor instance not found");
      return;
    }

    // Remove previous combined link if any were selected before
    if (selectedForms.length > 0) {
      editorInstance.insertFormLink("ondemand_forms", null);
    }

    // Insert one combined link for all currently pending selections
    if (pendingForms.length > 0) {
      const combinedUrl = buildCombinedFormUrl(pendingForms);
      editorInstance.insertFormLink("ondemand_forms", combinedUrl);
    }

    setSelectedForms(pendingForms);
    setShowFormsDropdown(false);
    setFormSearch("");
    setExpandedForm(null);
    if (pendingForms.length > 0) {
      toast.success("Success", "On-demand form link added to editor");
    }
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
        {displayTemplateName && (
          <div className="importedTemplateName">
            Template: {displayTemplateName}
          </div>
        )}
        {/* <ReusableDropDown
          options={SignatureOptions}
          value={signature}
          placeholder="Select Signature"
          onChange={handleSignatureChange}
          valueImage={signatureIcon}
        /> */}

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
      </div>

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
    </>
  );
}
