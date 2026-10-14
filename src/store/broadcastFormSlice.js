import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedModes: [],
  selectedTemplateData: null,

  category: "select",
  priority: 2,

  sendType: 1,
  scheduleStartDateTime: new Date(),
  scheduleEndDateTime: null,
  frequency: "Daily",
  repeatType: "Week",
  repeatOn: [],
  frequencyToRemind: "",
  intervalsToRemind: "",

  patientType: "targetRecipients",
  uploadedFile: null,
  broadcastStartDate: new Date(),
  broadcastEndDate: null,
  patientStartDateTime: new Date(),
  patientEndDateTime: null,
  ageFilter: 0,
  ageYear: "",
  ageMonth: "",
  ageError: "",

  appointmentType: "",
  appointmentTypeLabels: [],
  location: "",
  locationLabels: [],
  provider: "",
  providerLabels: [],
  // Full option-id lists cached once options load. Payload builders fall back
  // to these when the user hasn't picked anything, so an empty UI selection
  // still sends every value.
  allAppointmentTypeIds: [],
  allLocationIds: [],
  allProviderIds: [],
  categoryLabel: "",
  priorityLabel: "",
  gender: 3,
  modality: "",
  includeOptOut: false,
  patientsFoundForType: null,
  totalPatientsFound: 0,

  selectedTemplateType: "newTemplate",
  existingTemplateValues: "",
  newTemplateName: "",
  selectedEmailTemplateType: "blank",

  mailSubject: "",
  mailSubjectError: false,
  importedTemplateName: "",

  isEmailEditorEmpty: true,
  isSmsEditorEmpty: true,
  isVoiceEditorEmpty: true
};

const makeSetter = (field) => (state, action) => {
  state[field] = action.payload;
};

const buildInitialState = () => ({
  ...initialState,
  scheduleStartDateTime: new Date(),
  broadcastStartDate: new Date(),
  patientStartDateTime: new Date()
});

const broadcastFormSlice = createSlice({
  name: "broadcastForm",
  initialState,
  reducers: {
    // Reset back to defaults — dispatched when the broadcast flow unmounts
    // so opening it again starts from a clean form (matches the previous
    // context-per-mount lifecycle).
    resetBroadcastForm: () => buildInitialState(),
    setSelectedModes: makeSetter("selectedModes"),
    setSelectedTemplateData: makeSetter("selectedTemplateData"),
    setCategory: makeSetter("category"),
    setPriority: makeSetter("priority"),
    setSendType: makeSetter("sendType"),
    setScheduleStartDateTime: makeSetter("scheduleStartDateTime"),
    setScheduleEndDateTime: makeSetter("scheduleEndDateTime"),
    setFrequency: makeSetter("frequency"),
    setRepeatType: makeSetter("repeatType"),
    setRepeatOn: makeSetter("repeatOn"),
    setFrequencyToRemind: makeSetter("frequencyToRemind"),
    setIntervalsToRemind: makeSetter("intervalsToRemind"),
    setPatientType: makeSetter("patientType"),
    setUploadedFile: makeSetter("uploadedFile"),
    setBroadcastStartDate: makeSetter("broadcastStartDate"),
    setBroadcastEndDate: makeSetter("broadcastEndDate"),
    setPatientStartDateTime: makeSetter("patientStartDateTime"),
    setPatientEndDateTime: makeSetter("patientEndDateTime"),
    setAgeFilter: makeSetter("ageFilter"),
    setAgeYear: makeSetter("ageYear"),
    setAgeMonth: makeSetter("ageMonth"),
    setAgeError: makeSetter("ageError"),
    setAppointmentType: makeSetter("appointmentType"),
    setAppointmentTypeLabels: makeSetter("appointmentTypeLabels"),
    setLocation: makeSetter("location"),
    setLocationLabels: makeSetter("locationLabels"),
    setProvider: makeSetter("provider"),
    setProviderLabels: makeSetter("providerLabels"),
    setAllAppointmentTypeIds: makeSetter("allAppointmentTypeIds"),
    setAllLocationIds: makeSetter("allLocationIds"),
    setAllProviderIds: makeSetter("allProviderIds"),
    setCategoryLabel: makeSetter("categoryLabel"),
    setPriorityLabel: makeSetter("priorityLabel"),
    setGender: makeSetter("gender"),
    setModality: makeSetter("modality"),
    setIncludeOptOut: makeSetter("includeOptOut"),
    setPatientsFoundForType: makeSetter("patientsFoundForType"),
    setTotalPatientsFound: makeSetter("totalPatientsFound"),
    setSelectedTemplateType: makeSetter("selectedTemplateType"),
    setExistingTemplateValues: makeSetter("existingTemplateValues"),
    setNewTemplateName: makeSetter("newTemplateName"),
    setSelectedEmailTemplateType: makeSetter("selectedEmailTemplateType"),
    setMailSubject: makeSetter("mailSubject"),
    setMailSubjectError: makeSetter("mailSubjectError"),
    setImportedTemplateName: makeSetter("importedTemplateName"),
    setIsEmailEditorEmpty: makeSetter("isEmailEditorEmpty"),
    setIsSmsEditorEmpty: makeSetter("isSmsEditorEmpty"),
    setIsVoiceEditorEmpty: makeSetter("isVoiceEditorEmpty")
  }
});

export const broadcastFormActions = broadcastFormSlice.actions;
export default broadcastFormSlice.reducer;
