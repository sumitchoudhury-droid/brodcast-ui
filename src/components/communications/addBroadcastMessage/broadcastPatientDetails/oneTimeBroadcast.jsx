import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import ReusableDateTime from "../../../../reusableComponents/reusableDate&TimePicker/index";

function OneTimeBroadcast({
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime
}) {
  const handleSearch = () => {
    // Add your search logic here
    console.log("Searching with dates:", { startDateTime, endDateTime });
  };

  return (
    <div className="oneTimeBroadcastContainer">
      <div className="dateContainer">
        <ReusableDateTime
          label={"Start Date"}
          required={true}
          selected={startDateTime}
          onChange={(date) => setStartDateTime(date)}
        />
      </div>
      <div className="dateContainer">
        <ReusableDateTime
          label={"End Date"}
          required={true}
          selected={endDateTime}
          onChange={(date) => setEndDateTime(date)}
        />
      </div>
      <ReusableButton label="Search" variant="primary" onClick={handleSearch} />
    </div>
  );
}

export default OneTimeBroadcast;
