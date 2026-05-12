import "./style.scss";
import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown";
import { ReusableDateTime } from "../../../../reusableComponents/reusableDate&TimePicker";
import ReusableToggleButton from "../../../../reusableComponents/reusableToggleButton";
import { ReusableButton } from "../../../../reusableComponents/resuableButton";
import { ReusableInput } from "../../../../reusableComponents/reusableInput";

function TargetRecipients({
  // Dropdown props
  appointmentType,
  setAppointmentType,
  location,
  setLocation,
  provider,
  setProvider,
  ageFilter,
  setAgeFilter,
  gender,
  setGender,
  modality,
  setModality,
  // Date/Time props
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  // Toggle props
  includeOptOut,
  setIncludeOptOut,
  // Options arrays
  appointmentTypeOptions,
  locationOptions,
  providerOptions,
  ageOptions,
  genderOptions,
  modalityOptions
}) {
  return (
    <>
      <div className="formRow">
        <div className="formGroup">
          <ReusableDropDown
            label="Appointment Type"
            greenIcon={false}
            placeholder="Select Appointment Type"
            options={appointmentTypeOptions}
            value={
              appointmentTypeOptions.find((o) => o.value === appointmentType)
                ?.label || ""
            }
            onChange={(val) => setAppointmentType(val)}
          />
        </div>
        <div className="formGroup">
          <ReusableDropDown
            label="Location"
            greenIcon={false}
            placeholder="Select Location"
            options={locationOptions}
            value={
              locationOptions.find((o) => o.value === location)?.label || ""
            }
            onChange={(val) => setLocation(val)}
          />
        </div>
        <div className="formGroup">
          <ReusableDropDown
            label="Provider"
            greenIcon={false}
            placeholder="Select Provider"
            options={providerOptions}
            value={
              providerOptions.find((o) => o.value === provider)?.label || ""
            }
            onChange={(val) => setProvider(val)}
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
                placeholder="Select Filter"
                options={ageOptions}
                value={
                  ageOptions.find((o) => o.value === ageFilter)?.label || ""
                }
                onChange={(val) => setAgeFilter(val)}
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
            value={genderOptions.find((o) => o.value === gender)?.label || ""}
            onChange={(val) => setGender(val)}
          />
        </div>
        <div className="formGroup">
          <ReusableDropDown
            label="Modality"
            greenIcon={false}
            placeholder="Select Modality"
            options={modalityOptions}
            value={
              modalityOptions.find((o) => o.value === modality)?.label || ""
            }
            onChange={(val) => setModality(val)}
          />
        </div>
      </div>

      <div className="dateAndTimeContainer">
        <div className="dateContainer">
          <ReusableDateTime
            label={"Appointment Start Date / Time"}
            required={true}
            selected={startDateTime}
            onChange={(date) => setStartDateTime(date)}
          />
        </div>
        <div className="dateContainer">
          <ReusableDateTime
            label={"Appointment End Date / Time"}
            required={true}
            selected={endDateTime}
            onChange={(date) => setEndDateTime(date)}
          />
        </div>
        <div className="toggleButtonContainer">
          <ReusableToggleButton
            label="Include Opt Out Patients"
            isChecked={includeOptOut}
            onChange={(val) => setIncludeOptOut(val)}
          />
        </div>
      </div>

      <div className="searchButtonContainer">
        <ReusableButton label="Search" variant="primary" />
      </div>
    </>
  );
}

export default TargetRecipients;
