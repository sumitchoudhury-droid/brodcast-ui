import { useState, useEffect, useRef } from "react";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index.jsx";

import calendar from "../../../../assets/boardCastTableIcons/calendar.svg";
import addScheduleIcon from "../../../../assets/boardCastTableIcons/plus.svg";
import ReusableDateRangePicker from "../../../../reusableComponents/resuableDateRangePicker/index.jsx";

import CancelScheduleIcon from "../../../../assets/boardCastTableIcons/CancelScheduleIcon.svg";
import ReportIcon from "../../../../assets/boardCastTableIcons/ReportIcon.svg";

import "./style.scss";

function BroadCastTableHeader({
  handleAddSchedule,
  selectedDateRange,
  onDateRangeChange,
  onTodayClick,
  selectedBroadcasts = [],
  onBulkCancel
  // onBulkReport
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedRowsCount = selectedBroadcasts.length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="broadCastTableHeader">
      <div className="headerLeft">
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
          onReset={() =>
            onDateRangeChange({ startDate: new Date(), endDate: new Date() })
          }
        />

        <div style={{ display: "flex", gap: "12px" }}>
          <ReusableButton
            label="Today"
            variant="primary"
            addIcon={true}
            addImage={calendar}
            onClick={onTodayClick}
          />
        </div>
      </div>

      {selectedRowsCount > 0 && (
        <div className="headerRight" ref={dropdownRef}>
          <span className="selectedCountText">
            {selectedRowsCount} {selectedRowsCount === 1 ? "item" : "items"}{" "}
            selected
          </span>
          <div className="bulkActionsDropdownWrapper">
            <button
              className="bulkActionsBtn"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              Bulk Actions
              <svg
                className={`dropdownArrow ${isDropdownOpen ? "open" : ""}`}
                width="12"
                height="7"
                viewBox="0 0 12 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L6 6L11 1"
                  stroke="#77C1B6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="bulkDropdownMenu">
                <button
                  className="bulkMenuItem"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onBulkCancel();
                  }}
                >
                  <span className="menuIcon">
                    <img src={CancelScheduleIcon} alt="Cancel Schedule" />
                  </span>
                  Cancel Schedule
                </button>
                <button
                  className="bulkMenuItem"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    window.open("https://google.com", "_blank");
                  }}
                >
                  <span className="menuIcon">
                    <img src={ReportIcon} alt="Report" />
                  </span>
                  Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BroadCastTableHeader;
