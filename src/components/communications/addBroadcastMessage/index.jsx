import "./style.scss";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import { BroadcastDetails } from "./broadcastDetails/index";
import { BroadCastSchedule } from "./broadCastSchedule/index";

export const AddBroadcastMessage = () => {
  return (
    <div className="addBroadcastMessage">
      <h1>Add Broadcast Message</h1>
      <div className="addBroadcastMessageContent">
        <BroadcastDetails />
        <BroadCastSchedule />
      </div>
      <div className="addBroadcastMessageFooter">
        <ReusableButton label="Cancel" variant="secondary" />
        <ReusableButton label="Next" variant="primary" />
      </div>
    </div>
  );
};
