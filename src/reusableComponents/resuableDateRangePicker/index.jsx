import { useState } from "react";
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
import { ReusableButton } from "../resuableButton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "./styel.scss";

export default function ReusableDateRangePicker({
  initialStartDate = null,
  initialEndDate = null,
  onApply,
  onCancel,
  onReset
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [hoverDate, setHoverDate] = useState(null);

  const nextMonth = addMonths(currentMonth, 1);

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
    setCurrentMonth(startOfMonth(start));
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
    return (
      <div className="calendar-header">
        <button
          className="arrow-btn"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          disabled={!isLeft}
          style={{ visibility: isLeft ? "visible" : "hidden" }}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="current-month">{format(month, "MMMM yyyy")}</div>
        <button
          className="arrow-btn"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          disabled={isLeft}
          style={{ visibility: !isLeft ? "visible" : "hidden" }}
        >
          <ArrowRight size={16} />
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
    return <div className="weekdays-row">{days}</div>;
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
          days.push(<div className="day-cell empty" key={day.toString()} />);
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

          let cellClass = "day-cell";
          if (isSelectedStart) cellClass += " start-date";
          if (isSelectedEnd) cellClass += " end-date";
          if (isWithin || isHovering) cellClass += " in-range";
          if (isSelectedStart && isSelectedEnd) cellClass += " start-end-date";

          days.push(
            <div
              className={cellClass}
              key={day.toString()}
              onClick={() => handleDateClick(cloneDay)}
              onMouseEnter={() => handleMouseEnter(cloneDay)}
            >
              <span className="day-text">{formattedDate}</span>
            </div>
          );
        }
        day = addDays(day, 1);
      }
      rows.push(
        <div className="days-row" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-body">{rows}</div>;
  };

  return (
    <div className="reusable-date-range-picker">
      <div className="picker-main">
        <div className="sidebar">
          {predefinedRanges.map((range, idx) => (
            <button
              key={idx}
              className="range-btn"
              onClick={() => handlePredefinedClick(range)}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="calendars-container">
          <div className="calendar">
            {renderHeader(currentMonth, true)}
            {renderDays()}
            {renderCells(currentMonth)}
          </div>
          <div className="calendar">
            {renderHeader(nextMonth, false)}
            {renderDays()}
            {renderCells(nextMonth)}
          </div>
        </div>
      </div>
      <div className="picker-footer">
        <div className="footer-left">
          <ReusableButton
            label="Reset"
            className="footer-btn-secondary"
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              if (onReset) onReset();
            }}
          />
        </div>
        <div className="footer-right">
          <ReusableButton
            label="Cancel"
            className="footer-btn-secondary"
            onClick={() => {
              if (onCancel) onCancel();
            }}
          />
          <ReusableButton
            label="Apply"
            className="footer-btn-primary"
            onClick={() => {
              if (onApply) onApply({ startDate, endDate });
            }}
          />
        </div>
      </div>
    </div>
  );
}
