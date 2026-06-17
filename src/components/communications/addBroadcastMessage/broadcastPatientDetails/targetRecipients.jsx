import { useState } from "react";
import "./style.scss";
import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown";
import { ReusableDateTime } from "../../../../reusableComponents/reusableDate&TimePicker";
import ReusableToggleButton from "../../../../reusableComponents/reusableToggleButton";
import { ReusableButton } from "../../../../reusableComponents/resuableButton";
import { ReusableInput } from "../../../../reusableComponents/reusableInput";
import { ReusableMultiSelectDropdown } from "../../../../reusableComponents/reusableMultiSelectDropdown";
import ReusableModal from "../../../../reusableComponents/reusableModal";

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
  ageYear,
  setAgeYear,
  ageMonth,
  setAgeMonth,
  ageError,
  setAgeError,
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
  modalityOptions,
  onSearch
}) {
  const [showOptOutModal, setShowOptOutModal] = useState(false);

  const handleToggleOptOut = (val) => {
    if (val) {
      setShowOptOutModal(true);
    } else {
      setIncludeOptOut(false);
    }
  };

  const handleConfirmOptOut = () => {
    setIncludeOptOut(true);
    setShowOptOutModal(false);
  };

  const handleSearch = () => {
    if (ageFilter && !ageYear && !ageMonth) {
      setAgeError("Enter Patient Age");
      return;
    }
    const hasStartDateTime = Array.isArray(startDateTime)
      ? startDateTime.length > 0
      : !!startDateTime;
    if (hasStartDateTime && endDateTime) {
      onSearch();
    }
  };
  return (
    <>
      <div className="formRow">
        <div className="formGroup">
          <ReusableMultiSelectDropdown
            label="Appointment Type"
            greenIcon={false}
            placeholder="Select Appointment Type"
            options={appointmentTypeOptions}
            value={
              Array.isArray(appointmentType)
                ? appointmentType
                : appointmentType
                  ? [appointmentType]
                  : []
            }
            onChange={(val) => setAppointmentType(val)}
            searchPlaceholder="Search Appointment Type"
          />
        </div>
        <div className="formGroup">
          <ReusableMultiSelectDropdown
            label="Location"
            greenIcon={false}
            placeholder="Select Location"
            options={locationOptions}
            value={
              Array.isArray(location) ? location : location ? [location] : []
            }
            onChange={(val) => setLocation(val)}
            searchPlaceholder="Search Location"
          />
        </div>
        <div className="formGroup">
          <ReusableMultiSelectDropdown
            label="Provider"
            greenIcon={false}
            placeholder="Select Provider"
            options={providerOptions}
            value={
              Array.isArray(provider) ? provider : provider ? [provider] : []
            }
            onChange={(val) => setProvider(val)}
            searchPlaceholder="Search Provider"
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
                value={ageFilter}
                onChange={(val) => setAgeFilter(val)}
              />
            </div>
            <div className="ageInput">
              <ReusableInput
                placeholder="Enter Year"
                numbersOnly={true}
                value={ageYear}
                onChange={(e) => {
                  setAgeYear(e.target.value);
                  if (e.target.value) setAgeError("");
                }}
              />
              {ageError && <p className="ageErrorText">{ageError}</p>}
            </div>
            <div className="ageInput">
              <ReusableInput
                placeholder="Enter Month"
                numbersOnly={true}
                value={ageMonth}
                onChange={(e) => {
                  setAgeMonth(e.target.value);
                  if (e.target.value) setAgeError("");
                }}
              />
            </div>
          </div>
        </div>
        <div className="formGroup">
          <ReusableDropDown
            label="Gender"
            greenIcon={false}
            placeholder="Select Gender"
            options={genderOptions}
            value={gender}
            onChange={(val) => setGender(val)}
          />
        </div>
        <div className="formGroup">
          <ReusableMultiSelectDropdown
            label="Modality"
            greenIcon={false}
            placeholder="Select Modality"
            options={modalityOptions}
            value={
              Array.isArray(modality) ? modality : modality ? [modality] : []
            }
            onChange={(val) => setModality(val)}
            searchPlaceholder="Search Modality"
          />
        </div>
      </div>

      <div className="dateAndTimeContainer">
        <div className="dateContainer">
          <ReusableDateTime
            label="Appointment Start Date / Time"
            required={true}
            selected={startDateTime}
            onChange={(date) => setStartDateTime(date)}
            className="leftOpening topDown"
          />
        </div>
        <div className="dateContainer">
          <ReusableDateTime
            label={"Appointment End Date / Time"}
            required={true}
            selected={endDateTime}
            onChange={(date) => setEndDateTime(date)}
            className="topDown"
          />
        </div>
        <div className="toggleButtonContainer">
          <ReusableToggleButton
            label="Include Opt Out Patients"
            isChecked={includeOptOut}
            onChange={handleToggleOptOut}
          />
        </div>
      </div>

      <div className="searchButtonContainer">
        <ReusableButton
          label="Search"
          variant="primary"
          onClick={handleSearch}
        />
      </div>

      <ReusableModal
        isOpen={showOptOutModal}
        onClose={() => setShowOptOutModal(false)}
        onConfirm={handleConfirmOptOut}
        title="Include Opt-Out Patients"
        cancelText="Cancel"
        confirmText="Confirm"
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "16px",
            lineHeight: "24px",
            color: "#344054"
          }}
        >
          Are you sure you want to{" "}
          <strong>include opt-out patients in this broadcast?</strong>
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            lineHeight: "24px",
            color: "#344054"
          }}
        >
          These patients have previously chosen not to receive communications.
        </p>
      </ReusableModal>
    </>
  );
}

export default TargetRecipients;
