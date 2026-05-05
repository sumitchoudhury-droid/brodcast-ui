import { useState } from "react";
import "./style.scss";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton/index";
import { ReusableInput } from "../../../../reusableComponents/reusableInput/index";
import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown/index";
import ReusableDateTime from "../../../../reusableComponents/reusableDate&TimePicker/index";
import ReusableToggleButton from "../../../../reusableComponents/reusableToggleButton/index";

function BroadcastPatientDetails() {
  const [patientType, setPatientType] = useState("targetRecipients");

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

        <div className="formRow">
          <div className="formGroup">
            <ReusableDropDown
              label="Appointment Type"
              greenIcon={false}
              placeholder="Select Appointment Type"
              options={appointmentTypeOptions}
            />
          </div>
          <div className="formGroup">
            <ReusableDropDown
              label="Location"
              greenIcon={false}
              placeholder="Select Location"
              options={locationOptions}
            />
          </div>
          <div className="formGroup">
            <ReusableDropDown
              label="Provider"
              greenIcon={false}
              placeholder="Select Provider"
              options={providerOptions}
            />
          </div>
        </div>

        <div className="formRow">
          <div className="formGroup ageGroup">
            <p className="fieldLabel">Age</p>
            <div className="ageInputs">
              <div className="ageSelect">
                <ReusableDropDown
                  greenIcon={false}
                  placeholder="Select Date"
                  options={ageOptions}
                />
              </div>
              <div className="ageInput">
                <ReusableInput placeholder="Enter Year" />
              </div>
              <div className="ageInput">
                <ReusableInput placeholder="Enter Month" />
              </div>
            </div>
          </div>
          <div className="formGroup">
            <ReusableDropDown
              label="Gender"
              greenIcon={false}
              placeholder="Select Gender"
              options={genderOptions}
            />
          </div>
          <div className="formGroup">
            <ReusableDropDown
              label="Modality"
              greenIcon={false}
              placeholder="Select Modality"
              options={modalityOptions}
            />
          </div>
        </div>

        <div className="dateAndTimeContainer">
          <div className="dateContainer">
            <ReusableDateTime
              label={"Appointment Start Date / Time"}
              required={true}
            />
          </div>
          <div className="dateContainer">
            <ReusableDateTime
              label={"Appointment End Date / Time"}
              required={true}
            />
          </div>
          <div className="toggleButtonContainer">
            <ReusableToggleButton label="Include Opt Out Patients" />
          </div>
        </div>

        <div className="searchButtonContainer">
          <ReusableButton label="Search" variant="primary" />
        </div>
      </div>
    </div>
  );
}

export default BroadcastPatientDetails;
