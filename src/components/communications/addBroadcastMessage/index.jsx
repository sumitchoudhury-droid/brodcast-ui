import { useState } from "react";
import "./style.scss";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import { BroadcastDetails } from "./broadcastDetails/index";
import { BroadCastSchedule } from "./broadCastSchedule/index";
import BroadcastTemplateDetails from "./broadcastTemplateDetails/index";
import BroadcastPatientDetails from "./broadcastPatientDetails/index";

export const AddBroadcastMessage = ({
  onNext,
  selectedModes,
  setSelectedModes
}) => {
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  return (
    <div className="addBroadcastMessage">
      <h1>Add Broadcast Message</h1>
      <div className="addBroadcastMessageContent">
        <BroadcastDetails
          selectedModes={selectedModes}
          setSelectedModes={setSelectedModes}
          category={category}
          setCategory={setCategory}
          priority={priority}
          setPriority={setPriority}
        />
        <BroadcastPatientDetails />
        <BroadCastSchedule />
        <BroadcastTemplateDetails />
      </div>
      <div className="addBroadcastMessageFooter">
        <ReusableButton label="Cancel" variant="primary" />
        <ReusableButton label="Next" variant="secondary" onClick={onNext} />
      </div>
    </div>
  );
};
