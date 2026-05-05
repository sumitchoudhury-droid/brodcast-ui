import "./style.scss";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import { BroadcastDetails } from "./broadcastDetails/index";
import { BroadCastSchedule } from "./broadCastSchedule/index";
import BroadcastTemplateDetails from "./broadcastTemplateDetails/index";
import BroadcastPatientDetails from "./broadcastPatientDetails/index";

export const AddBroadcastMessage = () => {
  return (
    <div className="addBroadcastMessage">
      <h1>Add Broadcast Message</h1>
      <div className="addBroadcastMessageContent">
        <BroadcastDetails />
        <BroadcastPatientDetails />
        <BroadCastSchedule />
        <BroadcastTemplateDetails />
      </div>
      <div className="addBroadcastMessageFooter">
        <ReusableButton label="Cancel" variant="secondary" />
        <ReusableButton label="Next" variant="primary" />
      </div>
    </div>
  );
};
