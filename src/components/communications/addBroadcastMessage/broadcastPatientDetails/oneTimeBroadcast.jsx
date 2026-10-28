import { useEffect } from "react";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import ReusableDateTime from "../../../../reusableComponents/reusableDate&TimePicker/index";
import { usePost } from "../../../../hooks/usePost";
import { useToast } from "../../../../hooks/useToast";
import { ENDPOINTS } from "../../../../api/endpoints.js";

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

function OneTimeBroadcast({
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  onSearch
}) {
  const toast = useToast();
  const { mutate: searchPatients, isPending: isSearching } = usePost(
    ENDPOINTS.patients.SEARCH
  );

  useEffect(() => {
    if (!endDateTime) {
      setEndDateTime(endOfToday());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    if (!startDateTime || !endDateTime) return;

    const body = {
      appointmentTypeIds: [],
      locationIds: [],
      providerIds: [],
      ageCriteriaId: null,
      ageYears: null,
      ageMonths: null,
      genderId: null,
      modalityId: null,
      appointmentStartDateTime: toLocalIsoString(startDateTime),
      appointmentEndDateTime: toLocalIsoString(endDateTime),
      includeOptOutPatients: false
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
    <div className="oneTimeBroadcastContainer">
      <div className="dateContainer">
        <ReusableDateTime
          label={"Start Date"}
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
        />
      </div>
      <div className="dateContainer">
        <ReusableDateTime
          label={"End Date"}
          required={true}
          selected={endDateTime}
          onChange={(date) => setEndDateTime(date)}
          className="topDown"
          minDate={startDateTime}
        />
      </div>
      <ReusableButton
        label={isSearching ? "Searching…" : "Search"}
        variant="primary"
        onClick={handleSearch}
        disabled={isSearching}
      />
    </div>
  );
}

export default OneTimeBroadcast;
