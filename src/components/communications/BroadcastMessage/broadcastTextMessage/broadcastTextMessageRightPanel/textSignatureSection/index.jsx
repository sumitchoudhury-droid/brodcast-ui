import { useState, useRef, useEffect } from "react";
import "./style.scss";
import signatureIcon from "../../../../../../assets/commonIcons/signatureIcon.svg";
import fileTextIcon from "../../../../../../assets/commonIcons/fileTextIcon.svg";
import checkBox from "../../../../../../assets/mainScreen/checkBox.svg";
import uncheckBox from "../../../../../../assets/mainScreen/uncheckBox.svg";
import searchIcon from "../../../../../../assets/mainScreen/searchIcon.svg";
import greenChevronRight from "../../../../../../assets/mainScreen/greenChevronRight.svg";
import eyeIcon from "../../../../../../assets/mainScreen/eyeIcon.svg";
import { ReusableDropDown } from "../../../../../../reusableComponents/reusableDropDown/index";
import { useToast } from "../../../../../../hooks/useToast";

export default function TextSignatureSection({
  editorInstance,
  isEditorEmpty
}) {
  const [signature, setSignature] = useState("");
  const [showFormsDropdown, setShowFormsDropdown] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);
  const [pendingForms, setPendingForms] = useState([]);
  const [formSearch, setFormSearch] = useState("");
  const dropdownRef = useRef(null);
  const toast = useToast();

  const applySignatureToEditor = (selectedValue) => {
    if (!editorInstance) return;
    editorInstance.insertSignature(selectedValue, isEditorEmpty);
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
    },
    {
      label: "Add Signature",
      value: "Add Signature"
    }
  ];

  const OnDemandFormsOptions = [
    { label: "ASQ3", value: "ASQ3" },
    { label: "Administration", value: "Administration" },
    { label: "Clinical", value: "Clinical" },
    { label: "Health Screening Forms", value: "Health Screening Forms" },
    { label: "Patient Feedback Forms", value: "Patient Feedback Forms" }
  ];

  const handleOnDemandFormClick = (value) => {
    if (!editorInstance) {
      toast.error("Editor Error", "Editor instance not found");
      return;
    }

    const formUrl = `https://forms.manipalhospitals.com/${value}`;
    editorInstance.insertFormLink(value, formUrl);
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
    // Remove forms that were deselected
    selectedForms
      .filter((form) => !pendingForms.includes(form))
      .forEach((form) => {
        if (editorInstance) {
          editorInstance.insertFormLink(form, null);
        }
      });

    // Add newly selected forms
    pendingForms
      .filter((form) => !selectedForms.includes(form))
      .forEach((form) => handleOnDemandFormClick(form));

    setSelectedForms(pendingForms);
    setShowFormsDropdown(false);
    setFormSearch("");
    toast.success("Success", "On-demand form link(s) added to editor");
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
      </div>
    </>
  );
}
