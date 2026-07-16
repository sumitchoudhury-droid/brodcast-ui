import { createContext, useContext, useState } from "react";

const BroadcastFormContext = createContext(null);

export function BroadcastFormProvider({ children }) {
  const [selectedModes, setSelectedModes] = useState([]);
  const [selectedTemplateData, setSelectedTemplateData] = useState(null);

  const [category, setCategory] = useState("select");
  const [priority, setPriority] = useState(2);

  const [sendType, setSendType] = useState(1);
  const [scheduleStartDateTime, setScheduleStartDateTime] = useState(
    new Date()
  );
  const [scheduleEndDateTime, setScheduleEndDateTime] = useState(null);
  const [frequency, setFrequency] = useState("Daily");
  const [repeatType, setRepeatType] = useState("Week");
  const [repeatOn, setRepeatOn] = useState([]);

  const [patientType, setPatientType] = useState("targetRecipients");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [broadcastStartDate, setBroadcastStartDate] = useState(new Date());
  const [broadcastEndDate, setBroadcastEndDate] = useState(null);
  const [patientStartDateTime, setPatientStartDateTime] = useState(new Date());
  const [patientEndDateTime, setPatientEndDateTime] = useState(null);
  const [ageFilter, setAgeFilter] = useState(0);
  const [ageYear, setAgeYear] = useState("");
  const [ageMonth, setAgeMonth] = useState("");
  const [ageError, setAgeError] = useState("");

  const [appointmentType, setAppointmentType] = useState("");
  const [appointmentTypeLabels, setAppointmentTypeLabels] = useState([]);
  const [location, setLocation] = useState("");
  const [locationLabels, setLocationLabels] = useState([]);
  const [provider, setProvider] = useState("");
  const [providerLabels, setProviderLabels] = useState([]);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [priorityLabel, setPriorityLabel] = useState("");
  const [gender, setGender] = useState(3);
  const [modality, setModality] = useState("");
  const [includeOptOut, setIncludeOptOut] = useState(false);
  const [patientsFoundForType, setPatientsFoundForType] = useState(null);

  const [selectedTemplateType, setSelectedTemplateType] =
    useState("newTemplate");
  const [existingTemplateValues, setExistingTemplateValues] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedEmailTemplateType, setSelectedEmailTemplateType] =
    useState("blank");

  const [mailSubject, setMailSubject] = useState("");

  return (
    <BroadcastFormContext.Provider
      value={{
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
        appointmentType,
        setAppointmentType,
        appointmentTypeLabels,
        setAppointmentTypeLabels,
        location,
        setLocation,
        locationLabels,
        setLocationLabels,
        provider,
        setProvider,
        providerLabels,
        setProviderLabels,
        categoryLabel,
        setCategoryLabel,
        priorityLabel,
        setPriorityLabel,
        gender,
        setGender,
        modality,
        setModality,
        includeOptOut,
        setIncludeOptOut,
        patientsFoundForType,
        setPatientsFoundForType,
        selectedTemplateType,
        setSelectedTemplateType,
        existingTemplateValues,
        setExistingTemplateValues,
        newTemplateName,
        setNewTemplateName,
        selectedEmailTemplateType,
        setSelectedEmailTemplateType,
        mailSubject,
        setMailSubject
      }}
    >
      {children}
    </BroadcastFormContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBroadcastForm = () => useContext(BroadcastFormContext);
