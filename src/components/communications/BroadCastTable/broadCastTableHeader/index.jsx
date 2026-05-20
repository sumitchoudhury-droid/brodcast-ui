import { ReusableButton } from "../../../../reusableComponents/resuableButton/index.jsx";

import calendar from "../../../../assets/boardCastTableIcons/calendar.svg";

import addScheduleIcon from "../../../../assets/boardCastTableIcons/plus.svg";
import ReusableDateRangePicker from "../../../../reusableComponents/resuableDateRangePicker/index.jsx";
import "./style.scss";

function BroadCastTableHeader({
  handleAddSchedule,
  selectedDateRange,
  onDateRangeChange,
  onTodayClick
}) {
  return (
    <div className="broadCastTableHeader">
      <ReusableButton
        addIcon={true}
        addImage={addScheduleIcon}
        label="Add Schedule"
        variant="secondary"
        onClick={handleAddSchedule}
      />

      <ReusableDateRangePicker
        initialStartDate={selectedDateRange?.startDate}
        initialEndDate={selectedDateRange?.endDate}
        onApply={(range) => onDateRangeChange(range)}
        onReset={() => onDateRangeChange({ startDate: null, endDate: null })}
      />

      <div style={{ display: "flex", gap: "12px" }}>
        <ReusableButton
          label="Today"
          variant="primary"
          addIcon={true}
          addImage={calendar}
          onClick={onTodayClick}
          disabled={
            !!(selectedDateRange?.startDate || selectedDateRange?.endDate)
          }
        />
      </div>
    </div>
  );
}

export default BroadCastTableHeader;
