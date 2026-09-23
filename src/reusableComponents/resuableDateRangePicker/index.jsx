import { useState, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isWithinInterval,
  isAfter,
  subYears,
  setYear,
  getYear
} from "date-fns";
import dateRangeIcon from "../../assets/boardCastTableIcons/dateRange.svg";
import arrowLeftIcon from "../../assets/boardCastTableIcons/arrowLeftIcon.svg";
import arrowRightIcon from "../../assets/boardCastTableIcons/arrowRightIcon.svg";
import "./style.scss";
import { ReusableButton } from "../resuableButton/index";
import { useToast } from "../../hooks/useToast";

export default function ReusableDateRangePicker({
  initialStartDate = null,
  initialEndDate = null,
  onApply,
  onCancel,
  onReset
}) {
  const toast = useToast();
  const [leftMonth, setLeftMonth] = useState(startOfMonth(new Date()));
  const [rightMonth, setRightMonth] = useState(
    addMonths(startOfMonth(new Date()), 1)
  );
  const [startDate, setStartDate] = useState(
    () => initialStartDate ?? new Date()
  );
  const [endDate, setEndDate] = useState(() => initialEndDate ?? new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showLeftYearPicker, setShowLeftYearPicker] = useState(false);
  const [showRightYearPicker, setShowRightYearPicker] = useState(false);
  const [leftYearRangeStart, setLeftYearRangeStart] = useState(
    Math.floor(getYear(new Date()) / 12) * 12
  );
  const [rightYearRangeStart, setRightYearRangeStart] = useState(
    Math.floor(getYear(new Date()) / 12) * 12
  );
  const containerRef = useRef(null);

  const [prevStart, setPrevStart] = useState(initialStartDate);
  const [prevEnd, setPrevEnd] = useState(initialEndDate);

  if (initialStartDate !== prevStart) {
    setStartDate(initialStartDate);
    setPrevStart(initialStartDate);
  }
  if (initialEndDate !== prevEnd) {
    setEndDate(initialEndDate);
    setPrevEnd(initialEndDate);
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${format(startDate, "MM/dd/yyyy")} - ${format(endDate, "MM/dd/yyyy")}`;
    }
    return "Select Date Range";
  };

  const predefinedRanges = [
    {
      label: "This Week",
      getDates: () => {
        const today = new Date();
        return { start: addDays(today, -7), end: today };
      }
    },
    {
      label: "Last 2 Weeks",
      getDates: () => {
        const today = new Date();
        return { start: addDays(today, -14), end: today };
      }
    },
    {
      label: "Current Month",
      getDates: () => {
        const today = new Date();
        return { start: startOfMonth(today), end: endOfMonth(today) };
      }
    },
    {
      label: "Previous Month",
      getDates: () => {
        const today = new Date();
        return { start: subMonths(today, 1), end: today };
      }
    },
    {
      label: "Last 3 Months",
      getDates: () => {
        const today = new Date();
        return { start: subMonths(today, 3), end: today };
      }
    },
    {
      label: "Last 1 Year",
      getDates: () => {
        const today = new Date();
        return { start: subYears(today, 1), end: today };
      }
    },
    {
      label: "Next Week",
      getDates: () => {
        const today = new Date();
        return { start: today, end: addDays(today, 7) };
      }
    },
    {
      label: "Next 3 Months",
      getDates: () => {
        const today = new Date();
        return { start: today, end: addMonths(today, 3) };
      }
    }
  ];

  const handlePredefinedClick = (range) => {
    const { start, end } = range.getDates();
    setStartDate(start);
    setEndDate(end);
    const startM = startOfMonth(start);
    setLeftMonth(startM);
    setRightMonth(addMonths(startM, 1));
  };

  const handleDateClick = (day) => {
    if (
      startDate &&
      !endDate &&
      (isAfter(day, startDate) || isSameDay(day, startDate))
    ) {
      setEndDate(day);
    } else {
      setStartDate(day);
      setEndDate(null);
    }
  };

  const handleMouseEnter = (day) => {
    setHoverDate(day);
  };

  const renderHeader = (month, isLeft) => {
    const showYearPicker = isLeft ? showLeftYearPicker : showRightYearPicker;
    const yearRangeStart = isLeft ? leftYearRangeStart : rightYearRangeStart;
    const setYearRangeStart = isLeft
      ? setLeftYearRangeStart
      : setRightYearRangeStart;
    const setShowYearPicker = isLeft
      ? setShowLeftYearPicker
      : setShowRightYearPicker;

    const handlePrev = () => {
      if (showYearPicker) {
        setYearRangeStart(yearRangeStart - 12);
        return;
      }
      if (isLeft) {
        setLeftMonth(subMonths(leftMonth, 1));
      } else {
        setRightMonth(subMonths(rightMonth, 1));
      }
    };

    const handleNext = () => {
      if (showYearPicker) {
        setYearRangeStart(yearRangeStart + 12);
        return;
      }
      if (isLeft) {
        setLeftMonth(addMonths(leftMonth, 1));
      } else {
        setRightMonth(addMonths(rightMonth, 1));
      }
    };

    const handleMonthClick = () => {
      setYearRangeStart(Math.floor(getYear(month) / 12) * 12);
      setShowYearPicker(!showYearPicker);
    };

    return (
      <div className="calendarHeader">
        <button className="arrowBtn" onClick={handlePrev}>
          <img
            src={arrowLeftIcon}
            alt="Previous"
            style={{ width: "16px", height: "16px" }}
          />
        </button>
        <div className="currentMonth clickable" onClick={handleMonthClick}>
          {showYearPicker
            ? `${yearRangeStart} - ${yearRangeStart + 11}`
            : format(month, "MMMM yyyy")}
        </div>
        <button className="arrowBtn" onClick={handleNext}>
          <img
            src={arrowRightIcon}
            alt="Next"
            style={{ width: "16px", height: "16px" }}
          />
        </button>
      </div>
    );
  };

  const renderYears = (month, isLeft) => {
    const yearRangeStart = isLeft ? leftYearRangeStart : rightYearRangeStart;
    const setShowYearPicker = isLeft
      ? setShowLeftYearPicker
      : setShowRightYearPicker;
    const currentYear = getYear(month);
    const todayYear = getYear(new Date());

    const handleYearSelect = (year) => {
      const newMonth = setYear(month, year);
      if (isLeft) {
        setLeftMonth(newMonth);
      } else {
        setRightMonth(newMonth);
      }
      setShowYearPicker(false);
    };

    return (
      <div className="yearsGrid">
        {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(
          (year) => {
            const isSelectedYear = currentYear === year;
            const isCurrentYear = todayYear === year;
            return (
              <button
                key={year}
                type="button"
                className={`yearCell ${isSelectedYear ? "selected" : ""} ${
                  isCurrentYear && !isSelectedYear ? "today" : ""
                }`}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </button>
            );
          }
        )}
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDateOfWeek = startOfWeek(new Date());

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="weekday" key={i}>
          {format(addDays(startDateOfWeek, i), "EEEE").substring(0, 2)}
        </div>
      );
    }
    return <div className="weekdaysRow">{days}</div>;
  };

  const renderCells = (month) => {
    const monthStart = startOfMonth(month);
    const startDateOfWeek = startOfWeek(monthStart);
    const endDateToRender = addDays(startDateOfWeek, 41); // Ensure 6 weeks are rendered for consistent height

    const rows = [];
    let days = [];
    let day = startDateOfWeek;

    while (day <= endDateToRender) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;

        if (!isSameMonth(day, monthStart)) {
          days.push(<div className="dayCell empty" key={day.toString()} />);
        } else {
          const formattedDate = format(day, "d");
          const isSelectedStart = startDate && isSameDay(day, startDate);
          const isSelectedEnd = endDate && isSameDay(day, endDate);
          const isWithin =
            startDate &&
            endDate &&
            isWithinInterval(day, { start: startDate, end: endDate });
          const isHovering =
            startDate &&
            !endDate &&
            hoverDate &&
            isAfter(hoverDate, startDate) &&
            isWithinInterval(day, { start: startDate, end: hoverDate });

          let cellClass = "dayCell";
          if (isSelectedStart) cellClass += " startDate";
          if (isSelectedEnd) cellClass += " endDate";
          if (isWithin || isHovering) cellClass += " inRange";
          if (isSelectedStart && isSelectedEnd) cellClass += " startEndDate";

          days.push(
            <div
              className={cellClass}
              key={day.toString()}
              onClick={() => handleDateClick(cloneDay)}
              onMouseEnter={() => handleMouseEnter(cloneDay)}
            >
              <span className="dayText">{formattedDate}</span>
            </div>
          );
        }
        day = addDays(day, 1);
      }
      rows.push(
        <div className="daysRow" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendarBody">{rows}</div>;
  };

  return (
    <div className="dateRangePickerContainer" ref={containerRef}>
      <div
        className={`dateRangePickerTrigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src={dateRangeIcon}
          alt="Calendar"
          className="triggerIcon"
          style={{ width: "18px", height: "18px" }}
        />
        <span className="triggerText">{getDisplayText()}</span>
      </div>

      {isOpen && (
        <div className="reusableDateRangePicker">
          <div className="pickerMain">
            <div className="sidebar">
              {predefinedRanges.map((range, idx) => (
                <button
                  key={idx}
                  className="rangeBtn"
                  onClick={() => handlePredefinedClick(range)}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="calendarsContainer">
              <div className="calendar">
                {renderHeader(leftMonth, true)}
                {showLeftYearPicker ? (
                  renderYears(leftMonth, true)
                ) : (
                  <>
                    {renderDays()}
                    {renderCells(leftMonth)}
                  </>
                )}
              </div>
              <div className="calendar">
                {renderHeader(rightMonth, false)}
                {showRightYearPicker ? (
                  renderYears(rightMonth, false)
                ) : (
                  <>
                    {renderDays()}
                    {renderCells(rightMonth)}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="pickerFooter">
            <div className="footerLeft">
              <ReusableButton
                label="Reset"
                variant="primary"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  if (onReset) onReset();
                  setIsOpen(false);
                  toast.success(
                    "Date Range Reset",
                    `Showing results for ${format(new Date(), "MM/dd/yyyy")}.`
                  );
                }}
              />
            </div>
            <div className="footerRight">
              <ReusableButton
                label="Cancel"
                variant="primary"
                onClick={() => {
                  setStartDate(initialStartDate);
                  setEndDate(initialEndDate);
                  if (onCancel) onCancel();
                  setIsOpen(false);
                }}
              />
              <ReusableButton
                label="Apply"
                variant="secondary"
                onClick={async () => {
                  if (startDate && endDate) {
                    const startStr = format(startDate, "MM/dd/yyyy");
                    const endStr = format(endDate, "MM/dd/yyyy");
                    try {
                      if (onApply) {
                        await onApply({ startDate, endDate });
                      }
                      toast.success(
                        "Date Range Applied",
                        `Showing results from ${startStr} – ${endStr}.`
                      );
                      setIsOpen(false);
                    } catch {
                      toast.error(
                        "Failed to Apply Date Range",
                        `The selected range ${startStr} – ${endStr} could not be applied. Please try again.`
                      );
                    }
                  } else {
                    toast.error(
                      "Failed to Apply Date Range",
                      "Please select both a start date and an end date."
                    );
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
