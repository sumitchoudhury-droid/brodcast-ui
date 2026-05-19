import { ReusableButton } from "../../../../reusableComponents/resuableButton/index.jsx";

import addScheduleIcon from "../../../../assets/boardCastTableIcons/plus.svg";

function BroadCastTableHeader({ handleAddSchedule }) {
  return (
    <div className="broadCastTableHeader">
      <ReusableButton
        addIcon={true}
        addImage={addScheduleIcon}
        label="Add Schedule"
        variant="secondary"
        onClick={handleAddSchedule}
      />
    </div>
  );
}

export default BroadCastTableHeader;
