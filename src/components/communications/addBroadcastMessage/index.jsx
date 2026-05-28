import { useState } from "react";
import "./style.scss";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import { BroadcastDetails } from "./broadcastDetails/index";
import { BroadCastSchedule } from "./broadCastSchedule/index";
import BroadcastTemplateDetails from "./broadcastTemplateDetails/index";
import BroadcastPatientDetails from "./broadcastPatientDetails/index";

export function AddBroadcastMessage({
  onNext,
  selectedModes,
  setSelectedModes,
  selectedTemplateData,
  setSelectedTemplateData,
  handleCancel
}) {
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");

  // Schedule state (lifted from BroadCastSchedule)
  const [sendType, setSendType] = useState("immediately");
  const [scheduleStartDateTime, setScheduleStartDateTime] = useState(null);
  const [scheduleEndDateTime, setScheduleEndDateTime] = useState(null);
  const [frequency, setFrequency] = useState("Daily");
  const [repeatType, setRepeatType] = useState("Week");
  const [repeatOn, setRepeatOn] = useState([]);

  // Patient state (lifted from BroadcastPatientDetails)
  const [patientType, setPatientType] = useState("targetRecipients");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [broadcastStartDate, setBroadcastStartDate] = useState(null);
  const [broadcastEndDate, setBroadcastEndDate] = useState(null);
  const [patientStartDateTime, setPatientStartDateTime] = useState(null);
  const [patientEndDateTime, setPatientEndDateTime] = useState(null);

  // Template state (lifted from BroadcastTemplateDetails)
  const [selectedTemplateType, setSelectedTemplateType] =
    useState("newTemplate");
  const [existingTemplateValues, setExistingTemplateValues] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedEmailTemplateType, setSelectedEmailTemplateType] =
    useState("blank");

  const showRadioRow =
    !selectedModes.includes("Email") &&
    (selectedModes.includes("Text") || selectedModes.includes("Voice"));

  const isFormValid =
    selectedModes.length > 0 &&
    !!priority &&
    (sendType === "immediately" || !!scheduleStartDateTime) &&
    (sendType !== "recurring" || !!scheduleEndDateTime) &&
    !(
      sendType === "recurring" &&
      frequency === "Custom" &&
      repeatType === "Week" &&
      repeatOn.length === 0
    ) &&
    (patientType !== "uploadFile" || !!uploadedFile) &&
    (patientType !== "oneTimeBroadcast" ||
      (!!broadcastStartDate && !!broadcastEndDate)) &&
    (patientType !== "targetRecipients" ||
      ((Array.isArray(patientStartDateTime)
        ? patientStartDateTime.length > 0
        : !!patientStartDateTime) &&
        !!patientEndDateTime)) &&
    (showRadioRow
      ? selectedTemplateType === "newTemplate"
        ? !!newTemplateName.trim()
        : !!existingTemplateValues
      : selectedEmailTemplateType === "blank"
        ? !!newTemplateName.trim()
        : !!selectedTemplateData);

  return (
    <div className="addBroadcastMessage">
      <h1>Add Broadcast Message</h1>
      <div className="addBroadcastMessageContent">
        <BroadcastDetails
          selectedModes={selectedModes}
          setSelectedModes={setSelectedModes}
          category={category}
          setCategory={setCategory}
          priority={priority}
          setPriority={setPriority}
        />
        <BroadcastPatientDetails
          patientType={patientType}
          setPatientType={setPatientType}
          onFileChange={setUploadedFile}
          broadcastStartDate={broadcastStartDate}
          setBroadcastStartDate={setBroadcastStartDate}
          broadcastEndDate={broadcastEndDate}
          setBroadcastEndDate={setBroadcastEndDate}
          startDateTime={patientStartDateTime}
          setStartDateTime={setPatientStartDateTime}
          endDateTime={patientEndDateTime}
          setEndDateTime={setPatientEndDateTime}
        />
        <BroadCastSchedule
          sendType={sendType}
          setSendType={setSendType}
          startDateTime={scheduleStartDateTime}
          setStartDateTime={setScheduleStartDateTime}
          endDateTime={scheduleEndDateTime}
          setEndDateTime={setScheduleEndDateTime}
          frequency={frequency}
          setFrequency={setFrequency}
          repeatType={repeatType}
          setRepeatType={setRepeatType}
          repeatOn={repeatOn}
          setRepeatOn={setRepeatOn}
        />
        <BroadcastTemplateDetails
          selectedModes={selectedModes}
          selectedTemplateType={selectedTemplateType}
          setSelectedTemplateType={setSelectedTemplateType}
          existingTemplateValues={existingTemplateValues}
          setExistingTemplateValues={setExistingTemplateValues}
          newTemplateName={newTemplateName}
          setNewTemplateName={setNewTemplateName}
          selectedTemplate={selectedEmailTemplateType}
          setSelectedTemplate={setSelectedEmailTemplateType}
          onSelectTemplate={setSelectedTemplateData}
          selectedTemplateData={selectedTemplateData}
        />
      </div>
      <div className="addBroadcastMessageFooter">
        <ReusableButton
          label="Cancel"
          variant="primary"
          onClick={handleCancel}
        />
        <ReusableButton
          label="Next"
          variant="secondary"
          onClick={() => {
            let finalTemplateData = selectedTemplateData;
            if (
              (showRadioRow && selectedTemplateType === "newTemplate") ||
              (!showRadioRow && selectedEmailTemplateType === "blank")
            ) {
              finalTemplateData = {
                title: newTemplateName,
                ...(selectedModes.includes("Text") && { textTemplate: "" }),
                ...(selectedModes.includes("Voice") && { voiceTemplate: "" }),
                ...(selectedModes.includes("Email") && { emailTemplate: "" })
              };
            }
            onNext(finalTemplateData);
          }}
          disabled={!isFormValid}
        />
      </div>
    </div>
  );
}
