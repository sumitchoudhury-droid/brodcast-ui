import { useEffect, useRef, useState } from "react";
import "./style.scss";
import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown";
import { ReusableDateTime } from "../../../../reusableComponents/reusableDate&TimePicker";
import ReusableToggleButton from "../../../../reusableComponents/reusableToggleButton";
import { ReusableButton } from "../../../../reusableComponents/resuableButton";
import { ReusableInput } from "../../../../reusableComponents/reusableInput";
import { ReusableMultiSelectDropdown } from "../../../../reusableComponents/reusableMultiSelectDropdown";
import ReusableModal from "../../../../reusableComponents/reusableModal";
import { useBroadcastConfigGet as useGet } from "../../../../hooks/useBroadcastConfigGet";
import { usePost } from "../../../../hooks/usePost";
import { useToast } from "../../../../hooks/useToast";
import { ENDPOINTS } from "../../../../api/endpoints.js";
import { BROADCAST_CONFIG_HEADERS } from "../../../../api/api.jsx";
import { useBroadcastForm } from "../../broadcastFormContext";

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return d;
};

const toLocalIsoString = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

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
  onSearch
}) {
  const { data: apptTypesData } = useGet(
    ["appointment-types"],
    ENDPOINTS.broadcastConfig.APPOINTMENT_TYPES,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const { data: locationsData } = useGet(
    ["locations"],
    ENDPOINTS.broadcastConfig.LOCATIONS,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const { data: providersData } = useGet(
    ["providers"],
    ENDPOINTS.broadcastConfig.PROVIDERS,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const { data: ageOptionsData } = useGet(
    ["age-options"],
    ENDPOINTS.broadcastConfig.AGE_OPTIONS,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const { data: genderOptionsData } = useGet(
    ["gender-options"],
    ENDPOINTS.broadcastConfig.GENDER_OPTIONS,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const { data: modalitiesData } = useGet(
    ["modalities"],
    ENDPOINTS.broadcastConfig.MODALITIES,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const appointmentTypeOptions = (apptTypesData?.data ?? []).map((a) => ({
    value: a.id,
    label: a.catalogDesc
  }));

  const locationOptions = (locationsData?.data ?? []).map((l) => ({
    value: l.id,
    label: l.displayName
  }));

  const providerOptions = (providersData?.data ?? []).map((p) => ({
    value: p.id,
    label: p.name
  }));

  const ageOptions = [
    { value: "", label: "Select" },
    ...(ageOptionsData?.data ?? []).map((a) => ({
      value: a.id,
      label: a.ageCriteria
    }))
  ];

  const genderOptions = [
    { value: "", label: "Select" },
    ...(genderOptionsData?.data ?? []).map((g) => ({
      value: g.id,
      label: g.name
    }))
  ];

  const modalityOptions = (modalitiesData?.data ?? []).map((m) => ({
    value: m.catalogDataId,
    label: m.catalogDec.trim()
  }));

  const {
    setAppointmentTypeLabels,
    setLocationLabels,
    setProviderLabels,
    setAllAppointmentTypeIds,
    setAllLocationIds,
    setAllProviderIds,
    allAppointmentTypeIds,
    allLocationIds,
    allProviderIds,
    categoryLabel
  } = useBroadcastForm();

  const isRecall = categoryLabel === "Recall";
  const startDateLabel = isRecall
    ? "Recall Start Date"
    : "Appointment Start Date / Time";
  const endDateLabel = isRecall
    ? "Recall End Date"
    : "Appointment End Date / Time";

  const toast = useToast();
  const { mutate: searchPatients, isPending: isSearching } = usePost(
    ENDPOINTS.patients.SEARCH
  );

  const getLabels = (ids, options) =>
    (Array.isArray(ids) ? ids : ids ? [ids] : [])
      .map((id) => options.find((o) => o.value === id)?.label)
      .filter(Boolean);

  // Backfill labels when IDs come from a saved template. onChange only fires
  // on user interaction, so template-seeded IDs would otherwise never resolve
  // to labels for the confirm-broadcast summary.
  useEffect(() => {
    if (appointmentTypeOptions.length > 0) {
      setAppointmentTypeLabels(
        getLabels(appointmentType, appointmentTypeOptions)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apptTypesData, appointmentType]);

  useEffect(() => {
    if (locationOptions.length > 0) {
      setLocationLabels(getLabels(location, locationOptions));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsData, location]);

  useEffect(() => {
    if (providerOptions.length > 0) {
      setProviderLabels(getLabels(provider, providerOptions));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersData, provider]);

  // Cache the full ID list for each dropdown once its options load. Payload
  // builders fall back to these when the user hasn't picked anything, so an
  // empty UI selection still sends every value.
  const apptCachedRef = useRef(false);
  const locationCachedRef = useRef(false);
  const providerCachedRef = useRef(false);

  useEffect(() => {
    if (apptCachedRef.current || appointmentTypeOptions.length === 0) return;
    apptCachedRef.current = true;
    setAllAppointmentTypeIds(appointmentTypeOptions.map((o) => o.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentTypeOptions]);

  useEffect(() => {
    if (locationCachedRef.current || locationOptions.length === 0) return;
    locationCachedRef.current = true;
    setAllLocationIds(locationOptions.map((o) => o.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationOptions]);

  useEffect(() => {
    if (providerCachedRef.current || providerOptions.length === 0) return;
    providerCachedRef.current = true;
    setAllProviderIds(providerOptions.map((o) => o.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerOptions]);

  const [showOptOutModal, setShowOptOutModal] = useState(false);

  useEffect(() => {
    if (!endDateTime) {
      setEndDateTime(endOfToday());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setAgeError("Enter patient age");
      return;
    }
    const hasStartDateTime = Array.isArray(startDateTime)
      ? startDateTime.length > 0
      : !!startDateTime;
    if (!hasStartDateTime || !endDateTime) return;

    // Empty UI selection means "no filter" — send every option instead.
    const effective = (selected, all) => {
      const arr = toArray(selected);
      return arr.length > 0 ? arr : all;
    };

    const body = {
      appointmentTypeIds: effective(appointmentType, allAppointmentTypeIds),
      locationIds: effective(location, allLocationIds),
      providerIds: effective(provider, allProviderIds),
      ageCriteriaId: ageFilter || null,
      ageYears: ageYear ? Number(ageYear) : null,
      ageMonths: ageMonth ? Number(ageMonth) : null,
      genderId: gender && gender !== "all" ? gender : null,
      modalityId: Array.isArray(modality)
        ? (modality[0] ?? null)
        : modality || null,
      appointmentStartDateTime: toLocalIsoString(startDateTime),
      appointmentEndDateTime: toLocalIsoString(endDateTime),
      includeOptOutPatients: includeOptOut
    };

    searchPatients(body, {
      onSuccess: (res) => {
        const patients = res?.data?.patients ?? [];
        const totalCount = res?.data?.totalCount ?? 0;
        if (totalCount === 0) {
          toast.error("No patient record found");
        }
        onSearch(patients, totalCount);
      }
    });
  };
  return (
    <>
      <div className="formRow">
        <div className="formGroup">
          <ReusableMultiSelectDropdown
            label="Appointment Type"
            greenIcon={false}
            placeholder="Select"
            showPlaceholderAsValue={true}
            options={appointmentTypeOptions}
            value={
              Array.isArray(appointmentType)
                ? appointmentType
                : appointmentType
                  ? [appointmentType]
                  : []
            }
            onChange={(val) => {
              setAppointmentType(val);
              setAppointmentTypeLabels(getLabels(val, appointmentTypeOptions));
            }}
            searchPlaceholder="Search Appointment Type"
          />
        </div>
        <div className="formGroup">
          <ReusableMultiSelectDropdown
            label="Location"
            greenIcon={false}
            placeholder="Select"
            showPlaceholderAsValue={true}
            options={locationOptions}
            value={
              Array.isArray(location) ? location : location ? [location] : []
            }
            onChange={(val) => {
              setLocation(val);
              setLocationLabels(getLabels(val, locationOptions));
            }}
            searchPlaceholder="Search Location"
          />
        </div>
        <div className="formGroup">
          <ReusableMultiSelectDropdown
            label="Provider"
            greenIcon={false}
            placeholder="Select"
            showPlaceholderAsValue={true}
            options={providerOptions}
            value={
              Array.isArray(provider) ? provider : provider ? [provider] : []
            }
            onChange={(val) => {
              setProvider(val);
              setProviderLabels(getLabels(val, providerOptions));
            }}
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
                placeholder=""
                options={ageOptions}
                value={ageFilter || ""}
                onChange={(val) => {
                  setAgeFilter(val);
                  setAgeError(
                    val && !ageYear && !ageMonth ? "Enter patient age" : ""
                  );
                }}
              />
            </div>
            <div className="ageInput">
              <p className="ageHintText">(eg: 18)</p>
              <ReusableInput
                placeholder="Age(Years)"
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
              <p className="ageHintText">Month</p>
              <ReusableDropDown
                greenIcon={false}
                placeholder="Month"
                options={[
                  { value: "", label: "Select" },
                  ...Array.from({ length: 12 }, (_, i) => ({
                    value: i,
                    label: String(i)
                  }))
                ]}
                value={ageMonth}
                onChange={(val) => {
                  setAgeMonth(val);
                  if (val) setAgeError("");
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
          <ReusableDropDown
            label="Modality"
            greenIcon={false}
            placeholder="Select Modality"
            options={modalityOptions}
            value={modality}
            onChange={(val) => setModality(val)}
          />
        </div>
      </div>

      <div className="dateAndTimeContainer">
        <div className="dateContainer">
          <ReusableDateTime
            label={startDateLabel}
            required={true}
            selected={startDateTime}
            onChange={(date) => {
              setStartDateTime(date);
              if (date && date > new Date()) {
                const endOfPicked = new Date(date);
                endOfPicked.setHours(23, 59, 0, 0);
                setEndDateTime(endOfPicked);
              } else if (endDateTime && date && endDateTime <= date) {
                setEndDateTime(null);
              }
            }}
            className="leftOpening topDown"
            placeholder={isRecall ? "Select Date" : "Select Date & Time"}
            showTimeSelect={!isRecall}
            dateFormat={isRecall ? "MM/dd/yyyy" : "MM/dd/yyyy, h:mm aa"}
          />
        </div>
        <div className="dateContainer">
          <ReusableDateTime
            label={endDateLabel}
            required={true}
            selected={endDateTime}
            onChange={(date) => setEndDateTime(date)}
            className="topDown"
            minDate={startDateTime}
            showTimeSelect={!isRecall}
            placeholder={isRecall ? "Select Date" : "Select Date & Time"}
            dateFormat={isRecall ? "MM/dd/yyyy" : "MM/dd/yyyy, h:mm aa"}
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
          label={isSearching ? "Searching…" : "Search"}
          variant="primary"
          onClick={handleSearch}
          disabled={
            isSearching ||
            !(Array.isArray(startDateTime)
              ? startDateTime.length > 0
              : !!startDateTime) ||
            !endDateTime
          }
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
