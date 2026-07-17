import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import ReusableDateTime from "../../../../reusableComponents/reusableDate&TimePicker/index";
import { usePost } from "../../../../hooks/usePost";
import { ENDPOINTS } from "../../../../api/endpoints.js";

function OneTimeBroadcast({
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  onSearch
}) {
  const { mutate: searchPatients, isPending: isSearching } = usePost(
    ENDPOINTS.patients.SEARCH
  );

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
      appointmentStartDateTime: new Date(startDateTime).toISOString(),
      appointmentEndDateTime: new Date(endDateTime).toISOString(),
      includeOptOutPatients: false
    };

    searchPatients(body, {
      onSuccess: (res) => {
        const patients = res?.data?.data?.patients ?? [];
        const totalCount = res?.data?.data?.totalCount ?? 0;
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
            if (endDateTime && date && endDateTime <= date) {
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
