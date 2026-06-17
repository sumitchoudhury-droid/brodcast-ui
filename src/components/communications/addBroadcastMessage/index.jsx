import "./style.scss";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import { BroadcastDetails } from "./broadcastDetails/index";
import { BroadCastSchedule } from "./broadCastSchedule/index";
import BroadcastTemplateDetails from "./broadcastTemplateDetails/index";
import BroadcastPatientDetails from "./broadcastPatientDetails/index";
import { useBroadcastForm } from "../broadcastFormContext";

export function AddBroadcastMessage({ onNext, handleCancel }) {
  const {
    selectedModes,
    setSelectedModes,
    selectedTemplateData,
    setSelectedTemplateData,
    category,
    setCategory,
    priority,
    setPriority,
    sendType,
    setSendType,
    scheduleStartDateTime,
    setScheduleStartDateTime,
    scheduleEndDateTime,
    setScheduleEndDateTime,
    frequency,
    setFrequency,
    repeatType,
    setRepeatType,
    repeatOn,
    setRepeatOn,
    patientType,
    setPatientType,
    uploadedFile,
    setUploadedFile,
    broadcastStartDate,
    setBroadcastStartDate,
    broadcastEndDate,
    setBroadcastEndDate,
    patientStartDateTime,
    setPatientStartDateTime,
    patientEndDateTime,
    setPatientEndDateTime,
    ageFilter,
    setAgeFilter,
    ageYear,
    setAgeYear,
    ageMonth,
    setAgeMonth,
    ageError,
    setAgeError,
    selectedTemplateType,
    setSelectedTemplateType,
    existingTemplateValues,
    setExistingTemplateValues,
    newTemplateName,
    setNewTemplateName,
    selectedEmailTemplateType,
    setSelectedEmailTemplateType
  } = useBroadcastForm();

  const showRadioRow =
    !selectedModes.includes("Email") &&
    (selectedModes.includes("Text") || selectedModes.includes("Voice"));

  const isFormValid =
    selectedModes.length > 0 &&
    !!priority &&
    (sendType === "immediately" || !!scheduleStartDateTime) &&
    (sendType !== "recurring" || !!frequency) &&
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
          ageFilter={ageFilter}
          setAgeFilter={setAgeFilter}
          ageYear={ageYear}
          setAgeYear={setAgeYear}
          ageMonth={ageMonth}
          setAgeMonth={setAgeMonth}
          ageError={ageError}
          setAgeError={setAgeError}
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
            if (
              patientType === "targetRecipients" &&
              ageFilter &&
              !ageYear &&
              !ageMonth
            ) {
              setAgeError("Enter Patient Age");
              return;
            }
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
