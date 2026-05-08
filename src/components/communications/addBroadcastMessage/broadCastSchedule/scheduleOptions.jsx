import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown/index";
import ReusableDateTime from "../../../../reusableComponents/reusableDate&TimePicker/index";
import { ReusableInput } from "../../../../reusableComponents/reusableInput/index";
import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton/index";

function ScheduleOptions({
  sendType,
  setSendType,
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  frequency,
  setFrequency,
  repeatEvery,
  setRepeatEvery,
  repeatType,
  setRepeatType,
  repeatOn,
  setRepeatOn,
  repeatDay,
  setRepeatDay
}) {
  const frequencyOptions = [
    { label: "Daily", value: "Daily" },
    { label: "Weekly on Monday", value: "Weekly on Monday" },
    {
      label: "Monthly on the first Monday",
      value: "Monthly on the first Monday"
    },
    {
      label: "Every weekday (Monday to Friday)",
      value: "Every weekday (Monday to Friday)"
    },
    { label: "Custom", value: "Custom" }
  ];

  const repeatTypeOptions = [
    { label: "Day", value: "Day" },
    { label: "Week", value: "Week" },
    { label: "Month", value: "Month" }
  ];

  const repeatDayOptions = [
    { label: "1st day", value: "1st day" },
    { label: "2nd day", value: "2nd day" },
    { label: "3rd day", value: "3rd day" },
    { label: "4th day", value: "4th day" },
    { label: "5th day", value: "5th day" }
  ];

  const dayOptions = [
    { label: "S", value: "Sunday" },
    { label: "M", value: "Monday" },
    { label: "T", value: "Tuesday" },
    { label: "W", value: "Wednesday" },
    { label: "T", value: "Thursday" },
    { label: "F", value: "Friday" },
    { label: "S", value: "Saturday" }
  ];

  const toggleDay = (day) => {
    if (repeatOn.includes(day)) {
      setRepeatOn(repeatOn.filter((d) => d !== day));
    } else {
      setRepeatOn([...repeatOn, day]);
    }
  };

  return (
    <div className="scheduleOptionsContainer">
      <div className="scheduleOptionsGrid">
        {/* Row 1 */}
        <div className="sendTypeContainer">
          <div className="scheduleLabel">
            <p>Send</p>
            <span>*</span>
          </div>
          <div className="radioGroup">
            <ReusableRadioButton
              label="Immediately"
              value="immediately"
              name="send"
              checked={sendType === "immediately"}
              onChange={setSendType}
            />
            <ReusableRadioButton
              label="Notify Later"
              value="notifyLater"
              name="send"
              checked={sendType === "notifyLater"}
              onChange={setSendType}
            />
            <ReusableRadioButton
              label="Recurring"
              value="recurring"
              name="send"
              checked={sendType === "recurring"}
              onChange={setSendType}
            />
          </div>
        </div>

        {sendType !== "immediately" && (
          <div className="dateContainer">
            <ReusableDateTime
              label="Start Date / Time"
              required={true}
              selected={startDateTime}
              onChange={(date) => setStartDateTime(date)}
            />
          </div>
        )}

        {sendType === "recurring" && (
          <div className="frequencyContainer">
            <ReusableDropDown
              label="Repeat"
              greenIcon={false}
              placeholder="Select Frequency"
              options={frequencyOptions}
              value={frequency}
              onChange={setFrequency}
            />
          </div>
        )}

        {/* Row 2 (Conditional) */}
        {sendType === "recurring" && frequency === "Custom" && (
          <>
            <div className="repeatEveryContainer">
              <div className="customRepeatGroup">
                <ReusableInput
                  placeholder="1"
                  label="Repeat Every"
                  required
                  value={repeatEvery}
                  onChange={(e) => setRepeatEvery(e.target.value)}
                />
                <div className="repeatTypeDropdown">
                  <ReusableDropDown
                    options={repeatTypeOptions}
                    value={repeatType}
                    onChange={setRepeatType}
                    greenIcon={false}
                  />
                </div>
              </div>
            </div>

            {repeatType === "Week" && (
              <div className="repeatOnMainContainer">
                <div className="scheduleLabel">
                  <p>Repeat On</p>
                  <span>*</span>
                </div>
                <div className="daysSelector">
                  {dayOptions.map((day, index) => (
                    <div
                      className={`dayCircle ${repeatOn.includes(day.value) ? "active" : ""}`}
                      key={index}
                      onClick={() => toggleDay(day.value)}
                    >
                      <span>{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {repeatType === "Month" && (
              <div className="repeatDayContainer">
                <ReusableDropDown
                  label="Repeat Every Month On"
                  options={repeatDayOptions}
                  value={repeatDay}
                  onChange={setRepeatDay}
                  greenIcon={false}
                />
              </div>
            )}
          </>
        )}

        {/* Ends On Positioning */}
        {sendType === "recurring" && (
          <div
            className={`dateContainer ${frequency !== "Custom" ? "endsOnFull" : ""}`}
          >
            <ReusableDateTime
              label="Ends On"
              required={true}
              selected={endDateTime}
              onChange={(date) => setEndDateTime(date)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ScheduleOptions;
