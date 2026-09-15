import { useState } from "react";
import "./style.scss";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import { BroadcastDetails } from "./broadcastDetails/index";
import { BroadCastSchedule } from "./broadCastSchedule/index";
import BroadcastTemplateDetails from "./broadcastTemplateDetails/index";
import BroadcastPatientDetails from "./broadcastPatientDetails/index";
import { useBroadcastForm } from "../broadcastFormContext";
import { ReusableModal } from "../../../reusableComponents/reusableModal/index";

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
    frequencyToRemind,
    setFrequencyToRemind,
    intervalsToRemind,
    setIntervalsToRemind,
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

  const handleCategoryChange = (val) => {
    setCategory(val);
  };

  const handleTemplateSelect = (templateData) => {
    if (!templateData) {
      setSelectedTemplateData(null);
      return;
    }
    const transformed = {
      ...templateData,
      emailTemplate:
        templateData.channels?.find((c) => c.methodType === "Mail")
          ?.templateBody ?? "",
      textTemplate:
        templateData.channels?.find((c) => c.methodType === "SMS")
          ?.templateBody ?? "",
      voiceTemplate:
        templateData.channels?.find((c) => c.methodType === "Voice")
          ?.templateBody ?? ""
    };
    setSelectedTemplateData(transformed);
    setSelectedEmailTemplateType("existing");
    setSelectedTemplateType("existingTemplate");
  };

  const [showHighPriorityModal, setShowHighPriorityModal] = useState(false);
  const [pendingTemplateData, setPendingTemplateData] = useState(null);

  const hasEmailMode = selectedModes.some((m) => m.toLowerCase() === "mail");
  const showRadioRow = !hasEmailMode && selectedModes.length > 0;

  const isFormValid =
    selectedModes.length > 0 &&
    // !!priority &&
    (sendType === "immediately" || !!scheduleStartDateTime) &&
    (sendType !== "recurring" || !!frequency) &&
    !(
      sendType === "recurring" &&
      frequency === "Custom" &&
      repeatType === "Week" &&
      repeatOn.length === 0
    ) &&
    (sendType !== 3 ||
      (!!String(frequencyToRemind).trim() &&
        !!String(intervalsToRemind).trim())) &&
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
        : !!existingTemplateValues || !!selectedTemplateData
      : selectedEmailTemplateType === "blank"
        ? !!newTemplateName.trim()
        : !!selectedTemplateData);

  return (
    <div className="addBroadcastMessage">
      <div className="disc">
        <h1>Add Broadcast Message</h1>
        <p className="disclaimer">
          <span>*</span> Indicates Mandatory
        </p>
      </div>

      <div className="addBroadcastMessageContent">
        <BroadcastDetails
          selectedModes={selectedModes}
          setSelectedModes={setSelectedModes}
          category={category}
          onCategoryChange={handleCategoryChange}
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
          onSelectTemplate={handleTemplateSelect}
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
          patientType={patientType}
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
          frequencyToRemind={frequencyToRemind}
          setFrequencyToRemind={setFrequencyToRemind}
          intervalsToRemind={intervalsToRemind}
          setIntervalsToRemind={setIntervalsToRemind}
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
              const modeToTemplateKey = {
                mail: "emailTemplate",
                sms: "textTemplate",
                voice: "voiceTemplate"
              };
              finalTemplateData = {
                title: newTemplateName,
                ...Object.fromEntries(
                  selectedModes
                    .map((name) => modeToTemplateKey[name.toLowerCase()])
                    .filter(Boolean)
                    .map((key) => [key, ""])
                )
              };
            }
            if (priority === 1) {
              setPendingTemplateData(finalTemplateData);
              setShowHighPriorityModal(true);
              return;
            }
            onNext(finalTemplateData);
          }}
          disabled={!isFormValid}
        />
      </div>
      <ReusableModal
        isOpen={showHighPriorityModal}
        onClose={() => setShowHighPriorityModal(false)}
        title="High Priority Broadcast Confirmation"
        confirmText="Yes, Send as High Priority"
        cancelText="No, Keep Standard Priority"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        onConfirm={() => {
          setShowHighPriorityModal(false);
          onNext(pendingTemplateData);
        }}
        onCancel={() => {
          setPriority(2);
          setShowHighPriorityModal(false);
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "16px",
            lineHeight: "24px",
            color: "#344054"
          }}
        >
          This broadcast has been marked as <strong>High Priority</strong> and
          will be prioritized over other patient communications.
        </p>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "16px",
            lineHeight: "24px",
            color: "#344054"
          }}
        >
          All eligible recipients will be processed on the scheduled day. Other
          pending patient notifications may be delayed until this broadcast has
          been completed.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            lineHeight: "24px",
            color: "#344054"
          }}
        >
          Are you sure you want to continue?
        </p>
      </ReusableModal>
    </div>
  );
}
