import { useState } from "react";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton/index";
import "./style.scss";
import PatientUploadFile from "./patientUploadFile";
import OneTimeBroadcast from "./oneTimeBroadcast";
import TargetRecipients from "./targetRecipients";

function BroadcastPatientDetails() {
  const [patientType, setPatientType] = useState("targetRecipients");

  // Dropdown states
  const [appointmentType, setAppointmentType] = useState("");
  const [location, setLocation] = useState("");
  const [provider, setProvider] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [gender, setGender] = useState("");
  const [modality, setModality] = useState("");

  // Date/Time states
  const [startDateTime, setStartDateTime] = useState(null);
  const [endDateTime, setEndDateTime] = useState(null);

  // OneTimeBroadcast states
  const [broadcastStartDate, setBroadcastStartDate] = useState(null);
  const [broadcastEndDate, setBroadcastEndDate] = useState(null);

  // Toggle state
  const [includeOptOut, setIncludeOptOut] = useState(false);

  const appointmentTypeOptions = [
    { label: "Check-in", value: "checkin" },
    { label: "Follow-up", value: "followup" },
    { label: "New Patient", value: "new" }
  ];

  const locationOptions = [
    { label: "Main Clinic", value: "main" },
    { label: "North Branch", value: "north" },
    { label: "South Branch", value: "south" }
  ];

  const providerOptions = [
    { label: "Dr. Smith", value: "smith" },
    { label: "Dr. Jones", value: "jones" },
    { label: "Dr. Taylor", value: "taylor" }
  ];

  const ageOptions = [
    { label: "Between", value: "between" },
    { label: "Greater than", value: "greater" },
    { label: "Less than", value: "less" }
  ];

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" }
  ];

  const modalityOptions = [
    { label: "SMS", value: "sms" },
    { label: "Email", value: "email" },
    { label: "Voice", value: "voice" }
  ];

  return (
    <div className="broadcastPatientDetailsContainer">
      <div className="patientDetailsHeader">
        <h1>Patient Details</h1>
      </div>

      <div className="patientDetailsForm">
        <div className="patientTypeSection">
          <div className="patientDetailsLabel">
            <p>Patients</p>
            <span>*</span>
          </div>

          <div className="patientDetailsValue">
            <ReusableRadioButton
              label="Target Recipients"
              value="targetRecipients"
              name="patientType"
              checked={patientType === "targetRecipients"}
              onChange={() => setPatientType("targetRecipients")}
            />

            <ReusableRadioButton
              label="Upload File"
              value="uploadFile"
              name="patientType"
              checked={patientType === "uploadFile"}
              onChange={() => setPatientType("uploadFile")}
            />

            <ReusableRadioButton
              label="One Time Broadcast"
              value="oneTimeBroadcast"
              name="patientType"
              checked={patientType === "oneTimeBroadcast"}
              onChange={() => setPatientType("oneTimeBroadcast")}
            />
          </div>
        </div>

        {/* Conditionally render PatientUploadFile */}
        {patientType === "uploadFile" && <PatientUploadFile />}

        {/* Conditionally render OneTimeBroadcast with props */}
        {patientType === "oneTimeBroadcast" && (
          <OneTimeBroadcast
            startDateTime={broadcastStartDate}
            setStartDateTime={setBroadcastStartDate}
            endDateTime={broadcastEndDate}
            setEndDateTime={setBroadcastEndDate}
          />
        )}

        {/* Only show these sections when targetRecipients is selected */}
        {patientType === "targetRecipients" && (
          <TargetRecipients
            appointmentType={appointmentType}
            setAppointmentType={setAppointmentType}
            location={location}
            setLocation={setLocation}
            provider={provider}
            setProvider={setProvider}
            ageFilter={ageFilter}
            setAgeFilter={setAgeFilter}
            gender={gender}
            setGender={setGender}
            modality={modality}
            setModality={setModality}
            startDateTime={startDateTime}
            setStartDateTime={setStartDateTime}
            endDateTime={endDateTime}
            setEndDateTime={setEndDateTime}
            includeOptOut={includeOptOut}
            setIncludeOptOut={setIncludeOptOut}
            appointmentTypeOptions={appointmentTypeOptions}
            locationOptions={locationOptions}
            providerOptions={providerOptions}
            ageOptions={ageOptions}
            genderOptions={genderOptions}
            modalityOptions={modalityOptions}
          />
        )}
        <div className="patientsFoundContainer">
          <div className="patientsFoundHeading">
            <p>Patients Found</p>
            <div className="patientCountContainer">
              <ReusableButton
                label="Export"
                variant="primary"
                greenDownloadImage={true}
              />
              <ReusableButton label="View" variant="primary" eyeImage={true} />
            </div>
          </div>
          <div className="patientsFoundDivider"></div>
          <div className="patientsFoundContent">
            <div className="patientsFound">
              <p className="patientName">Patients Found</p>
              <p className="patientCount">2731</p>
            </div>
            <div className="patientsFound">
              <p className="patientName">Opt Out Patients</p>
              <p className="patientCount">7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BroadcastPatientDetails;
