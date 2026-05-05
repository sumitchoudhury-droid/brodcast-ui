import { useState } from "react";

import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton/index";

import infoIcon from "../../../../assets/mainScreen/infoCircle.svg";

import "./style.scss";

export const BroadCastSchedule = () => {
  const [sendType, setSendType] = useState("immediately");

  return (
    <div className="broadcastSchedule">
      <div className="broadcastScheduleTitle">
        <p>Schedule</p>
      </div>

      <div className="broadcastScheduleContent">
        <div className="broadcastScheduleContentRow">
          <div className="broadcastScheduleContentRowLabel">
            <p>Send</p>
            <span>*</span>
          </div>

          <div className="broadcastScheduleContentRowValue">
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

        <div className="broadcastScheduleInfoBox">
          <img src={infoIcon} alt="infoIcon" className="infoIcon" />
          {sendType === "immediately" && (
            <p>The broadcast will be delivered instantly once scheduled.</p>
          )}

          {sendType === "notifyLater" && (
            <p>The broadcast will be delivered at a scheduled time.</p>
          )}

          {sendType === "recurring" && (
            <p>The broadcast will be sent repeatedly based on schedule.</p>
          )}
        </div>
      </div>
    </div>
  );
};
