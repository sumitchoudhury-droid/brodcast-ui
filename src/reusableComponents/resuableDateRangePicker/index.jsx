import { useState, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isWithinInterval,
  isAfter,
  subWeeks
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
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [hoverDate, setHoverDate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
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
        return { start: startOfWeek(today), end: endOfWeek(today) };
      }
    },
    {
      label: "Last 2 Weeks",
      getDates: () => {
        const today = new Date();
        return {
          start: subWeeks(startOfWeek(today), 1),
          end: endOfWeek(today)
        };
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
        const prev = subMonths(today, 1);
        return { start: startOfMonth(prev), end: endOfMonth(prev) };
      }
    },
    {
      label: "Last 3 Months",
      getDates: () => {
        const today = new Date();
        return {
          start: startOfMonth(subMonths(today, 2)),
          end: endOfMonth(today)
        };
      }
    },
    {
      label: "Next Week",
      getDates: () => {
        const today = new Date();
        const nextW = addDays(today, 7);
        return { start: startOfWeek(nextW), end: endOfWeek(nextW) };
      }
    },
    {
      label: "Next 3 Months",
      getDates: () => {
        const today = new Date();
        return {
          start: startOfMonth(today),
          end: endOfMonth(addMonths(today, 2))
        };
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
    const handlePrev = () => {
      if (isLeft) {
        setLeftMonth(subMonths(leftMonth, 1));
      } else {
        setRightMonth(subMonths(rightMonth, 1));
      }
    };

    const handleNext = () => {
      if (isLeft) {
        setLeftMonth(addMonths(leftMonth, 1));
      } else {
        setRightMonth(addMonths(rightMonth, 1));
      }
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
        <div className="currentMonth">{format(month, "MMMM yyyy")}</div>
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
                {renderDays()}
                {renderCells(leftMonth)}
              </div>
              <div className="calendar">
                {renderHeader(rightMonth, false)}
                {renderDays()}
                {renderCells(rightMonth)}
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
