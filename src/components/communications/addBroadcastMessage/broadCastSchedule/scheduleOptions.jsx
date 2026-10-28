import { useEffect } from "react";
import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown/index";
import ReusableDateTime from "../../../../reusableComponents/reusableDate&TimePicker/index";
import { ReusableInput } from "../../../../reusableComponents/reusableInput/index";
import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton/index";
import { useBroadcastConfigGet as useGet } from "../../../../hooks/useBroadcastConfigGet";
import { ENDPOINTS } from "../../../../api/endpoints.js";
import { BROADCAST_CONFIG_HEADERS } from "../../../../api/api.jsx";

function ScheduleOptions({
  patientType,
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
  setRepeatDay,
  frequencyToRemind,
  setFrequencyToRemind,
  intervalsToRemind,
  setIntervalsToRemind
}) {
  const { data: sendOptionsData } = useGet(
    ["schedule-send-options"],
    ENDPOINTS.broadcastConfig.SCHEDULE_SEND_OPTIONS,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const sendOptions = sendOptionsData?.data ?? [];

  useEffect(() => {
    if (patientType === "oneTimeBroadcast" && sendType === 3) {
      setSendType(1);
    }
  }, [patientType, sendType, setSendType]);

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
            {sendOptions.map((option) => (
              <ReusableRadioButton
                key={option.id}
                label={option.name}
                value={option.id}
                name="send"
                checked={sendType === option.id}
                onChange={setSendType}
                disabled={
                  patientType === "oneTimeBroadcast" &&
                  option.name === "Recurring"
                }
              />
            ))}
          </div>
        </div>

        <div className="dateContainer">
          <ReusableDateTime
            label={sendType !== 3 ? "Schedule Date/Time" : "Start Date/Time"}
            required={sendType !== 1}
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
            className="topDown"
            disabled={sendType === 1}
            minDate={sendType === 2 ? new Date() : null}
          />
        </div>

        {sendType === 3 && (
          <div className="frequencyContainer">
            <ReusableDropDown
              label="Repeat"
              greenIcon={false}
              placeholder="Select Frequency"
              options={frequencyOptions}
              value={frequency}
              onChange={setFrequency}
              required={true}
              overWriteClassName="topDown"
            />
          </div>
        )}

        {/* Row 2 (Conditional) */}
        {sendType === 3 && frequency === "Custom" && (
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
        {sendType === 3 && (
          <div
            className={`dateContainer ${frequency !== "Custom" ? "endsOnFull" : ""}`}
          >
            <ReusableDateTime
              label="Ends On"
              selected={endDateTime}
              onChange={(date) => setEndDateTime(date)}
              className={`topDown ${frequency === "Custom" ? "" : "leftOpening"}`}
              minDate={startDateTime}
            />
          </div>
        )}

        {sendType === 3 && (
          <>
            <div className="repeatEveryContainer">
              <ReusableInput
                label="Frequency to remind"
                required
                numbersOnly
                value={frequencyToRemind}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) setFrequencyToRemind(val);
                }}
              />
            </div>
            <div className="repeatEveryContainer">
              <ReusableInput
                label="No of intervals to remind"
                required
                numbersOnly
                value={intervalsToRemind}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) setIntervalsToRemind(val);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ScheduleOptions;
