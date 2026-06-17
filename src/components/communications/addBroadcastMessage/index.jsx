import "./style.scss";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import { BroadcastDetails } from "./broadcastDetails/index";
import { BroadCastSchedule } from "./broadCastSchedule/index";
import BroadcastTemplateDetails from "./broadcastTemplateDetails/index";
import BroadcastPatientDetails from "./broadcastPatientDetails/index";
import { useBroadcastForm } from "../broadcastFormContext";

const getCategoryPrefill = (val) => {
  const now = new Date();
  const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const prefills = {
    balance_payment_reminder: {
      selectedModes: ["Text", "Email"],
      priority: "high",
      selectedEmailTemplateType: "blank",
      newTemplateName: "Balance Payment Reminder",
      selectedTemplateType: "newTemplate",
      existingTemplateValues: "",
      patientType: "targetRecipients",
      appointmentType: ["checkin", "followup"],
      location: ["main"],
      provider: ["smith", "jones", "taylor"],
      gender: "all",
      modality: ["sms", "email"],
      patientStartDateTime: now,
      patientEndDateTime: days(30),
      ageFilter: "isGreaterThan",
      ageYear: "18",
      ageMonth: "",
      includeOptOut: false,
      broadcastStartDate: now,
      broadcastEndDate: null,
      sendType: "notifyLater",
      scheduleStartDateTime: days(1),
      scheduleEndDateTime: null,
      frequency: "Daily",
      repeatType: "Week",
      repeatOn: []
    },
    offer: {
      selectedModes: ["Email"],
      priority: "standard",
      selectedEmailTemplateType: "blank",
      newTemplateName: "Offer",
      selectedTemplateType: "newTemplate",
      existingTemplateValues: "",
      patientType: "targetRecipients",
      appointmentType: ["new"],
      location: ["main", "north", "south"],
      provider: ["smith", "jones", "taylor"],
      gender: "all",
      modality: ["email"],
      patientStartDateTime: now,
      patientEndDateTime: days(90),
      ageFilter: "isGreaterThanEqualTo",
      ageYear: "18",
      ageMonth: "",
      includeOptOut: false,
      broadcastStartDate: now,
      broadcastEndDate: null,
      sendType: "immediately",
      scheduleStartDateTime: now,
      scheduleEndDateTime: null,
      frequency: "Daily",
      repeatType: "Week",
      repeatOn: []
    },
    announcement: {
      selectedModes: ["Text", "Voice", "Email"],
      priority: "standard",
      selectedEmailTemplateType: "blank",
      newTemplateName: "Announcement",
      selectedTemplateType: "newTemplate",
      existingTemplateValues: "",
      patientType: "oneTimeBroadcast",
      appointmentType: [],
      location: [],
      provider: [],
      gender: "all",
      modality: [],
      patientStartDateTime: now,
      patientEndDateTime: null,
      ageFilter: "",
      ageYear: "",
      ageMonth: "",
      includeOptOut: false,
      broadcastStartDate: now,
      broadcastEndDate: days(7),
      sendType: "immediately",
      scheduleStartDateTime: now,
      scheduleEndDateTime: null,
      frequency: "Daily",
      repeatType: "Week",
      repeatOn: []
    }
  };

  return prefills[val] || null;
};

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
    setSelectedEmailTemplateType,
    setAppointmentType,
    setLocation,
    setProvider,
    setGender,
    setModality,
    setIncludeOptOut,
    setPatientsFoundForType
  } = useBroadcastForm();

  const handleCategoryChange = (val) => {
    setCategory(val);
    const p = getCategoryPrefill(val);
    if (!p) return;
    setSelectedModes(p.selectedModes);
    setPriority(p.priority);
    setSelectedEmailTemplateType(p.selectedEmailTemplateType);
    setNewTemplateName(p.newTemplateName);
    setSelectedTemplateType(p.selectedTemplateType);
    setExistingTemplateValues(p.existingTemplateValues);
    setSelectedTemplateData(null);
    setPatientType(p.patientType);
    setAppointmentType(p.appointmentType);
    setLocation(p.location);
    setProvider(p.provider);
    setGender(p.gender);
    setModality(p.modality);
    setPatientStartDateTime(p.patientStartDateTime);
    setPatientEndDateTime(p.patientEndDateTime);
    setAgeFilter(p.ageFilter);
    setAgeYear(p.ageYear);
    setAgeMonth(p.ageMonth);
    setAgeError("");
    setIncludeOptOut(p.includeOptOut);
    setPatientsFoundForType(null);
    setBroadcastStartDate(p.broadcastStartDate);
    setBroadcastEndDate(p.broadcastEndDate);
    setUploadedFile(null);
    setSendType(p.sendType);
    setScheduleStartDateTime(p.scheduleStartDateTime);
    setScheduleEndDateTime(p.scheduleEndDateTime);
    setFrequency(p.frequency);
    setRepeatType(p.repeatType);
    setRepeatOn(p.repeatOn);
  };

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
