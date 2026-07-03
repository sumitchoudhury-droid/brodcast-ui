import { useState } from "react";
import "./style.scss";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import { BroadcastDetails } from "./broadcastDetails/index";
import { BroadCastSchedule } from "./broadCastSchedule/index";
import BroadcastTemplateDetails from "./broadcastTemplateDetails/index";
import BroadcastPatientDetails from "./broadcastPatientDetails/index";
import { useBroadcastForm } from "../broadcastFormContext";
import { MOCK_TEMPLATES } from "../existingTemplates/mockTemplates";
import emailTemplate from "../existingTemplates/htmlTemplates/email.html?raw";
import textTemplate from "../existingTemplates/htmlTemplates/textMessage.html?raw";
import voiceTemplate from "../existingTemplates/htmlTemplates/voiceMessage.html?raw";
import { ReusableModal } from "../../../reusableComponents/reusableModal/index";

const buildTemplateData = (template) => ({
  ...template,
  emailTemplate,
  textTemplate,
  voiceTemplate
});

const MODALITY_MAP = { mail: "email", text: "sms", voice: "voice" };

const getTemplatePrefill = (template) => {
  const now = new Date();
  const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const base = {
    selectedEmailTemplateType: "existing",
    selectedTemplateType: "existingTemplate",
    existingTemplateValues: "",
    newTemplateName: template.title,
    modality: template.modes.map((m) => MODALITY_MAP[m]).filter(Boolean),
    includeOptOut: false,
    broadcastStartDate: now,
    broadcastEndDate: null,
    scheduleEndDateTime: null,
    frequency: "Daily",
    repeatType: "Week",
    repeatOn: []
  };

  const prefills = {
    // Appointment Rescheduled
    1: {
      selectedModes: ["Email", "Text", "Voice"],
      priority: "high",
      patientType: "targetRecipients",
      appointmentType: ["checkin", "followup"],
      location: ["main", "north"],
      provider: ["smith"],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: days(30),
      ageFilter: "",
      ageYear: "",
      ageMonth: "",
      sendType: "immediately",
      scheduleStartDateTime: now
    },
    // Health Camp Invitation
    2: {
      selectedModes: ["Email", "Text"],
      priority: "standard",
      patientType: "targetRecipients",
      appointmentType: ["new"],
      location: ["main", "north", "south"],
      provider: ["smith", "jones"],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: days(60),
      ageFilter: "",
      ageYear: "",
      ageMonth: "",
      sendType: "notifyLater",
      scheduleStartDateTime: days(7)
    },
    // Treatment Plan Update
    3: {
      selectedModes: ["Email", "Text", "Voice"],
      priority: "high",
      patientType: "targetRecipients",
      appointmentType: ["followup"],
      location: ["main"],
      provider: ["smith", "jones", "taylor"],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: days(30),
      ageFilter: "isGreaterThan",
      ageYear: "18",
      ageMonth: "",
      sendType: "notifyLater",
      scheduleStartDateTime: days(1)
    },
    // Seasonal Health Advisory
    4: {
      selectedModes: ["Text", "Voice"],
      priority: "standard",
      patientType: "oneTimeBroadcast",
      appointmentType: [],
      location: [],
      provider: [],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: null,
      ageFilter: "",
      ageYear: "",
      ageMonth: "",
      broadcastStartDate: now,
      broadcastEndDate: days(14),
      sendType: "immediately",
      scheduleStartDateTime: now
    },
    // Diabetes Screening Alert
    5: {
      selectedModes: ["Email"],
      priority: "standard",
      patientType: "targetRecipients",
      appointmentType: ["checkin"],
      location: ["main", "north"],
      provider: ["smith"],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: days(30),
      ageFilter: "isGreaterThan",
      ageYear: "45",
      ageMonth: "",
      sendType: "notifyLater",
      scheduleStartDateTime: days(3)
    },
    // Wellness Program Enrollment
    6: {
      selectedModes: ["Email", "Text"],
      priority: "standard",
      patientType: "targetRecipients",
      appointmentType: ["new", "checkin"],
      location: ["main", "north", "south"],
      provider: ["smith", "jones"],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: days(90),
      ageFilter: "isGreaterThanEqualTo",
      ageYear: "18",
      ageMonth: "",
      sendType: "recurring",
      scheduleStartDateTime: days(1),
      frequency: "Custom",
      repeatType: "Week",
      repeatOn: ["monday", "thursday"]
    },
    // Invoice Generated Notification
    7: {
      selectedModes: ["Email", "Text", "Voice"],
      priority: "high",
      patientType: "targetRecipients",
      appointmentType: ["checkin", "new", "followup"],
      location: ["main"],
      provider: ["smith", "jones"],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: days(30),
      ageFilter: "",
      ageYear: "",
      ageMonth: "",
      sendType: "immediately",
      scheduleStartDateTime: now
    },
    // Follow-Up Consultation Reminder
    8: {
      selectedModes: ["Email", "Voice"],
      priority: "standard",
      patientType: "targetRecipients",
      appointmentType: ["followup"],
      location: ["main", "north"],
      provider: ["smith", "taylor"],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: days(30),
      ageFilter: "isGreaterThan",
      ageYear: "18",
      ageMonth: "",
      sendType: "notifyLater",
      scheduleStartDateTime: days(2)
    },
    // Consent Form Reminder
    9: {
      selectedModes: ["Email"],
      priority: "high",
      patientType: "targetRecipients",
      appointmentType: ["checkin", "followup"],
      location: ["main"],
      provider: ["smith"],
      gender: "all",
      patientStartDateTime: now,
      patientEndDateTime: days(30),
      ageFilter: "",
      ageYear: "",
      ageMonth: "",
      sendType: "immediately",
      scheduleStartDateTime: now
    }
  };

  return { ...base, ...(prefills[template.id] ?? {}) };
};

const getCategoryPrefill = (val) => {
  const now = new Date();
  const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const prefills = {
    balance_payment_reminder: {
      selectedModes: ["Text", "Email"],
      priority: "high",
      selectedEmailTemplateType: "existing",
      selectedTemplateData: buildTemplateData(MOCK_TEMPLATES[0]),
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
      selectedEmailTemplateType: "existing",
      selectedTemplateData: buildTemplateData(MOCK_TEMPLATES[1]),
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
      selectedEmailTemplateType: "existing",
      selectedTemplateData: buildTemplateData(MOCK_TEMPLATES[2]),
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
    if (!p) {
      setSelectedModes([]);
      setPriority("standard");
      setSelectedEmailTemplateType("blank");
      setNewTemplateName("");
      setSelectedTemplateType("newTemplate");
      setExistingTemplateValues("");
      setSelectedTemplateData(null);
      setPatientType("targetRecipients");
      setAppointmentType("");
      setLocation("");
      setProvider("");
      setGender("all");
      setModality("");
      setPatientStartDateTime(new Date());
      setPatientEndDateTime(null);
      setAgeFilter("");
      setAgeYear("");
      setAgeMonth("");
      setAgeError("");
      setIncludeOptOut(false);
      setPatientsFoundForType(null);
      setBroadcastStartDate(new Date());
      setBroadcastEndDate(null);
      setUploadedFile(null);
      setSendType("immediately");
      setScheduleStartDateTime(new Date());
      setScheduleEndDateTime(null);
      setFrequency("Daily");
      setRepeatType("Week");
      setRepeatOn([]);
      return;
    }
    setSelectedModes(p.selectedModes);
    setPriority(p.priority);
    setSelectedEmailTemplateType(p.selectedEmailTemplateType);
    setNewTemplateName(p.newTemplateName);
    setSelectedTemplateType(p.selectedTemplateType);
    setExistingTemplateValues(p.existingTemplateValues);
    setSelectedTemplateData(p.selectedTemplateData ?? null);
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

  const handleTemplateSelect = (templateData) => {
    if (!templateData) {
      setSelectedTemplateData(null);
      return;
    }
    const p = getTemplatePrefill(templateData);
    setSelectedModes(p.selectedModes);
    setPriority(p.priority);
    setSelectedEmailTemplateType(p.selectedEmailTemplateType);
    setSelectedTemplateType(p.selectedTemplateType);
    setExistingTemplateValues(p.existingTemplateValues);
    setNewTemplateName(p.newTemplateName);
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
    setBroadcastStartDate(p.broadcastStartDate);
    setBroadcastEndDate(p.broadcastEndDate);
    setUploadedFile(null);
    setSendType(p.sendType);
    setScheduleStartDateTime(p.scheduleStartDateTime);
    setScheduleEndDateTime(p.scheduleEndDateTime);
    setFrequency(p.frequency);
    setRepeatType(p.repeatType);
    setRepeatOn(p.repeatOn);
    setPatientsFoundForType(null);
    setSelectedTemplateData(templateData);
  };

  const [showHighPriorityModal, setShowHighPriorityModal] = useState(false);
  const [pendingTemplateData, setPendingTemplateData] = useState(null);

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
            if (priority === "high") {
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
          setPriority("standard");
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
