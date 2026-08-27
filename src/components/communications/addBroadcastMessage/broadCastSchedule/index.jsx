import { useState } from "react";

import infoIcon from "../../../../assets/mainScreen/infoCircle.svg";
import ScheduleOptions from "./scheduleOptions";

import "./style.scss";

export const BroadCastSchedule = ({
  patientType,
  sendType,
  setSendType,
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  frequency,
  setFrequency,
  repeatType,
  setRepeatType,
  repeatOn,
  setRepeatOn,
  frequencyToRemind,
  setFrequencyToRemind,
  intervalsToRemind,
  setIntervalsToRemind
}) => {
  const [repeatEvery, setRepeatEvery] = useState("1");
  const [repeatDay, setRepeatDay] = useState("1st day");

  const scheduleProps = {
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
  };

  const formatDate = (date) => {
    if (!date) return "...";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "numeric",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    })
      .format(date)
      .replace(",", "");
  };

  const getSummaryText = () => {
    if (sendType === 1) {
      return "The broadcast will be delivered instantly once scheduled.";
    }
    if (sendType === 2) {
      return `The broadcast will be delivered at ${formatDate(startDateTime)}.`;
    }
    if (sendType === 3) {
      let recurrence = frequency.toLowerCase();
      if (frequency === "Custom") {
        recurrence = `every ${repeatEvery} ${repeatType.toLowerCase()}${repeatEvery > 1 ? "s" : ""}`;
        if (repeatType === "Week" && repeatOn.length > 0) {
          recurrence += ` on ${repeatOn.join(", ")}`;
        } else if (repeatType === "Month") {
          recurrence += ` on the ${repeatDay}`;
        }
      }
      return `Occurs ${recurrence} from ${formatDate(startDateTime)} until ${formatDate(endDateTime)}.`;
    }
    return "";
  };

  return (
    <div className="broadcastSchedule">
      <div className="broadcastScheduleTitle">
        <p>Schedule</p>
      </div>

      <div className="broadcastScheduleContent">
        <ScheduleOptions {...scheduleProps} />

        <div className="broadcastScheduleInfoBox">
          <img src={infoIcon} alt="infoIcon" className="infoIcon" />
          <p>{getSummaryText()}</p>
        </div>
      </div>
    </div>
  );
};
