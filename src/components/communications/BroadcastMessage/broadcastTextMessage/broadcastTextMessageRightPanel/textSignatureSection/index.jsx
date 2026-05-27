import { useState } from "react";
import "./style.scss";
import signatureIcon from "../../../../../../assets/commonIcons/signatureIcon.svg";
import fileTextIcon from "../../../../../../assets/commonIcons/fileTextIcon.svg";
import { ReusableDropDown } from "../../../../../../reusableComponents/reusableDropDown/index";
import { useToast } from "../../../../../../hooks/useToast";

export default function TextSignatureSection({
  editorInstance,
  isEditorEmpty
}) {
  const [signature, setSignature] = useState("");
  const [onDemandForm, setOnDemandForm] = useState("");
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
    setOnDemandForm(value);

    if (!editorInstance) {
      toast.error("Editor Error", "Editor instance not found");
      return;
    }

    const formUrl = `https://forms.manipalhospitals.com/${value}`;
    editorInstance.insertFormLink(value, formUrl);
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
      </div>
    </>
  );
}
