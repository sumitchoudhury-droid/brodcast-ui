import { useState } from "react";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton/index";
import "./style.scss";
import PatientUploadFile from "./patientUploadFile";
import OneTimeBroadcast from "./oneTimeBroadcast";
import TargetRecipients from "./targetRecipients";
import TargetViewList from "./targetViewList";
import OneTimeViewList from "./oneTimeViewList";
import UploadFileViewList from "./uploadFileViewList";

function BroadcastPatientDetails({
  patientType,
  setPatientType,
  onFileChange,
  broadcastStartDate,
  setBroadcastStartDate,
  broadcastEndDate,
  setBroadcastEndDate,
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime
}) {
  // Dropdown states (local, not needed for validation)
  const [appointmentType, setAppointmentType] = useState("");
  const [location, setLocation] = useState("");
  const [provider, setProvider] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [gender, setGender] = useState("all");
  const [modality, setModality] = useState("");
  const [includeOptOut, setIncludeOptOut] = useState(false);
  const [patientsFoundForType, setPatientsFoundForType] = useState(null);
  const [showViewList, setShowViewList] = useState(false);
  const [showOneTimeViewList, setShowOneTimeViewList] = useState(false);
  const [showUploadViewList, setShowUploadViewList] = useState(false);

  const showPatientsFound = patientsFoundForType === patientType;

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
    { label: "is equal to", value: "isEqualTo" },
    { label: "is greater than", value: "isGreaterThan" },
    { label: "is greater than or equal to", value: "isGreaterThanEqualTo" },
    { label: "is lesser than", value: "isLesserThan" },
    { label: "is lesser than or equal to", value: "isLesserThanEqualTo" },
    { label: "is not equal to", value: "isNotEqualTo" }
  ];

  const genderOptions = [
    { label: "All", value: "all" },
    { label: "Male", value: "male" },
    { label: "Female", value: "female" }
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

        {patientType === "uploadFile" && (
          <PatientUploadFile
            onFileChange={(file) => {
              onFileChange?.(file);
              if (file) setPatientsFoundForType("uploadFile");
            }}
          />
        )}

        {patientType === "oneTimeBroadcast" && (
          <OneTimeBroadcast
            startDateTime={broadcastStartDate}
            setStartDateTime={setBroadcastStartDate}
            endDateTime={broadcastEndDate}
            setEndDateTime={setBroadcastEndDate}
            onSearch={() => setPatientsFoundForType("oneTimeBroadcast")}
          />
        )}

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
            onSearch={() => setPatientsFoundForType("targetRecipients")}
          />
        )}
        {showPatientsFound && (
          <div className="patientsFoundContainer">
            <div className="patientsFoundHeading">
              <p>Patients Found</p>
              <div className="patientCountContainer">
                <ReusableButton
                  label="Export"
                  variant="primary"
                  greenDownloadImage={true}
                />
                <ReusableButton
                  label="View"
                  variant="primary"
                  eyeImage={true}
                  onClick={() => {
                    if (patientType === "oneTimeBroadcast")
                      setShowOneTimeViewList(true);
                    else if (patientType === "uploadFile")
                      setShowUploadViewList(true);
                    else setShowViewList(true);
                  }}
                />
              </div>
            </div>
            <div className="patientsFoundDivider"></div>
            <div className="patientsFoundContent">
              {patientType === "targetRecipients" && (
                <>
                  {includeOptOut ? (
                    <>
                      <div className="patientsFound">
                        <p className="patientName">Patients Found</p>
                        <p className="patientCount">2731</p>
                      </div>
                      <div className="patientsFound">
                        <p className="patientName">Opt Out Patients</p>
                        <p className="patientCount">7</p>
                      </div>
                    </>
                  ) : (
                    <div className="patientsFound">
                      <p className="patientName">Total Patients</p>
                      <p className="patientCount">2731</p>
                    </div>
                  )}
                </>
              )}

              {patientType === "uploadFile" && (
                <>
                  <div className="patientsFound">
                    <p className="patientName">Total Patients</p>
                    <p className="patientCount">2731</p>
                  </div>
                  <div className="patientsFound">
                    <p className="patientName">Eligible Patients</p>
                    <p className="patientCount">2700</p>
                  </div>
                  <div className="patientsFound">
                    <p className="patientName">Error Patients</p>
                    <p className="patientCount">31</p>
                  </div>
                </>
              )}

              {patientType === "oneTimeBroadcast" && (
                <div className="patientsFound">
                  <p className="patientName">Patients Found</p>
                  <p className="patientCount">2731</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TargetViewList
        isOpen={showViewList}
        onClose={() => setShowViewList(false)}
        includeOptOut={includeOptOut}
      />

      <OneTimeViewList
        isOpen={showOneTimeViewList}
        onClose={() => setShowOneTimeViewList(false)}
      />

      <UploadFileViewList
        isOpen={showUploadViewList}
        onClose={() => setShowUploadViewList(false)}
      />
    </div>
  );
}

export default BroadcastPatientDetails;
