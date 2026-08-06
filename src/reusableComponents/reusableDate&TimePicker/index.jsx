import { useState, useRef, useEffect, forwardRef, useMemo } from "react";
import calendarIcon from "../../assets/boardCastTableIcons/calendar.svg";
import clockIcon from "../../assets/boardCastTableIcons/clockIcon.svg";
import chevronLeftIcon from "../../assets/boardCastTableIcons/chevronLeftIcon.svg";
import chevronRightIcon from "../../assets/boardCastTableIcons/chevronRightIcon.svg";
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
  eachDayOfInterval,
  setHours,
  setMinutes,
  isToday,
  getHours,
  getMinutes,
  isBefore,
  startOfDay,
  setYear,
  getYear
} from "date-fns";
import "./style.scss";

const CustomInput = forwardRef(
  ({ value, onClick, placeholder, icon, error, disabled }, ref) => (
    <div
      className={`dateTimeInputContainer ${error ? "inputError" : ""} ${disabled ? "disabled" : ""}`}
      onClick={disabled ? null : onClick}
      ref={ref}
    >
      <div className="inputFieldWrapper">
        <input
          className="dateTimeInputField"
          value={value}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
        />
      </div>
      <span className="dateTimeIcon">{icon}</span>
    </div>
  )
);
CustomInput.displayName = "CustomInput";

export function ReusableDateTime({
  label,
  selected,
  onChange,
  placeholder = "Select Date & Time",
  showTimeSelect = true,
  dateFormat = "MM/dd/yyyy, h:mm aa",
  required = false,
  error = "",
  disabled = false,
  className = "",
  onCancel,
  onOk,
  minDate = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selected || minDate || new Date());
  const [tempDate, setTempDate] = useState(selected || minDate || new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearRangeStart, setYearRangeStart] = useState(
    Math.floor(getYear(selected || minDate || new Date()) / 12) * 12
  );
  const containerRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  const [amPm, setAmPm] = useState(getHours(tempDate) >= 12 ? "PM" : "AM");

  const [prevSelected, setPrevSelected] = useState(selected);

  if (selected !== prevSelected) {
    setPrevSelected(selected);
    if (selected) {
      setTempDate(selected);
      setViewDate(selected);
      setAmPm(getHours(selected) >= 12 ? "PM" : "AM");
    } else {
      const fallback = minDate || new Date();
      setTempDate(fallback);
      setViewDate(fallback);
      setAmPm(getHours(fallback) >= 12 ? "PM" : "AM");
    }
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && showTimeSelect) {
      const scrollToSelected = (listRef) => {
        if (listRef.current) {
          const selectedBtn = listRef.current.querySelector(".selectedTime");
          if (selectedBtn) {
            const listRect = listRef.current.getBoundingClientRect();
            const btnRect = selectedBtn.getBoundingClientRect();
            listRef.current.scrollTop =
              listRef.current.scrollTop +
              (btnRect.top - listRect.top) -
              listRef.current.clientHeight / 2 +
              selectedBtn.clientHeight / 2;
          }
        }
      };
      const timer = setTimeout(() => {
        scrollToSelected(hourListRef);
        scrollToSelected(minuteListRef);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showTimeSelect]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setShowYearPicker(false);
      if (!isOpen && selected) {
        setTempDate(selected);
        setViewDate(selected);
        setAmPm(getHours(selected) >= 12 ? "PM" : "AM");
      }
    }
  };

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const handleMonthDisplayClick = () => {
    setYearRangeStart(Math.floor(getYear(viewDate) / 12) * 12);
    setShowYearPicker((prev) => !prev);
  };

  const handleYearSelect = (year) => {
    setViewDate(setYear(viewDate, year));
    setShowYearPicker(false);
  };

  const handlePrevYearRange = () => setYearRangeStart((prev) => prev - 12);
  const handleNextYearRange = () => setYearRangeStart((prev) => prev + 12);

  const handleDateSelect = (date) => {
    if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) return;
    const newDate = setMinutes(
      setHours(date, getHours(tempDate)),
      getMinutes(tempDate)
    );
    setTempDate(newDate);
  };

  // Get 12-hour display value (1–12)
  const get12Hour = (date) => {
    const h = getHours(date) % 12;
    return h === 0 ? 12 : h;
  };

  const handleHourSelect = (displayHour) => {
    let h24 = displayHour % 12;
    if (amPm === "PM") h24 += 12;
    setTempDate(setHours(tempDate, h24));
  };

  const handleMinuteSelect = (minute) => {
    setTempDate(setMinutes(tempDate, minute));
  };

  const handleAmPmToggle = (val) => {
    setAmPm(val);
    const currentH = getHours(tempDate);
    let newH = currentH;
    if (val === "AM" && currentH >= 12) newH = currentH - 12;
    if (val === "PM" && currentH < 12) newH = currentH + 12;
    setTempDate(setHours(tempDate, newH));
  };

  const handleOk = () => {
    if (minDate && isBefore(tempDate, minDate)) return;
    onChange(tempDate);
    setIsOpen(false);
    if (onOk) onOk();
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (onCancel) onCancel();
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate));
    const end = endOfWeek(endOfMonth(viewDate));
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const hoursList = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i + 1),
    []
  );
  const minutesList = useMemo(
    () => Array.from({ length: 60 }, (_, i) => i),
    []
  );

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={`dateTimeWrapper ${className}`} ref={containerRef}>
      {label && (
        <label className="dateTimeLabel">
          {label} {required && <span className="required">*</span>}
        </label>
      )}

      <div className="pickerContainer">
        <CustomInput
          value={selected ? format(selected, dateFormat) : ""}
          onClick={handleToggle}
          placeholder={placeholder}
          icon={
            showTimeSelect ? (
              <img
                src={clockIcon}
                alt="Clock"
                style={{ width: "18px", height: "18px" }}
              />
            ) : (
              <img
                src={calendarIcon}
                alt="Calendar"
                style={{ width: "18px", height: "18px" }}
              />
            )
          }
          error={error}
          disabled={disabled}
        />

        {isOpen && (
          <div className="customDatePickerPopup">
            <div className="pickerContent">
              {/* ── Calendar ── */}
              <div className="calendarSection">
                <div className="customDatePickerHeader">
                  <button
                    type="button"
                    onClick={
                      showYearPicker ? handlePrevYearRange : handlePrevMonth
                    }
                    className="navBtn"
                  >
                    <img
                      src={chevronLeftIcon}
                      alt="Previous"
                      style={{ width: "16px", height: "16px" }}
                    />
                  </button>
                  <span
                    className="monthDisplay clickable"
                    onClick={handleMonthDisplayClick}
                  >
                    {showYearPicker
                      ? `${yearRangeStart} - ${yearRangeStart + 11}`
                      : format(viewDate, "MMMM yyyy")}
                  </span>
                  <button
                    type="button"
                    onClick={
                      showYearPicker ? handleNextYearRange : handleNextMonth
                    }
                    className="navBtn"
                  >
                    <img
                      src={chevronRightIcon}
                      alt="Next"
                      style={{ width: "16px", height: "16px" }}
                    />
                  </button>
                </div>

                {showYearPicker ? (
                  <div className="yearsGrid">
                    {Array.from(
                      { length: 12 },
                      (_, i) => yearRangeStart + i
                    ).map((year) => {
                      const isSelectedYear = getYear(tempDate) === year;
                      const isCurrentYear = getYear(new Date()) === year;
                      const isBeforeMin = minDate && year < getYear(minDate);
                      return (
                        <button
                          key={year}
                          type="button"
                          className={`yearCell
                              ${isSelectedYear ? "selected" : ""}
                              ${isCurrentYear && !isSelectedYear ? "today" : ""}
                              ${isBeforeMin ? "disabledYear" : ""}
                            `}
                          onClick={() => !isBeforeMin && handleYearSelect(year)}
                          disabled={isBeforeMin}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="weekDaysRow">
                      {weekDays.map((day, i) => (
                        <div key={`${day}-${i}`} className="weekDay">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="daysGrid">
                      {days.map((day, idx) => {
                        const isBeforeMin =
                          minDate &&
                          isBefore(startOfDay(day), startOfDay(minDate));
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`dayCell
                              ${!isSameMonth(day, viewDate) ? "outsideMonth" : ""}
                              ${isSameDay(day, tempDate) ? "selected" : ""}
                              ${isToday(day) && !isSameDay(day, tempDate) ? "today" : ""}
                              ${isBeforeMin ? "disabledDay" : ""}
                            `}
                            onClick={() =>
                              !isBeforeMin && handleDateSelect(day)
                            }
                            disabled={isBeforeMin}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* ── Time ── */}
              {showTimeSelect && (
                <div className="timeSection">
                  <div className="timeColumns">
                    {/* Hours */}
                    <div className="timeColumn">
                      <div className="timeColumnHeader">
                        {get12Hour(tempDate).toString().padStart(2, "0")}
                      </div>
                      <div className="timeList" ref={hourListRef}>
                        {hoursList.map((hour) => {
                          const isSelected = get12Hour(tempDate) === hour;
                          return (
                            <button
                              key={hour}
                              type="button"
                              className={`timeCell ${isSelected ? "selectedTime" : ""}`}
                              onClick={() => handleHourSelect(hour)}
                            >
                              {hour.toString().padStart(2, "0")}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="timeColumnDivider" />

                    {/* Minutes */}
                    <div className="timeColumn">
                      <div className="timeColumnHeader">
                        {getMinutes(tempDate).toString().padStart(2, "0")}
                      </div>
                      <div className="timeList" ref={minuteListRef}>
                        {minutesList.map((minute) => {
                          const isSelected = getMinutes(tempDate) === minute;
                          return (
                            <button
                              key={minute}
                              type="button"
                              className={`timeCell ${isSelected ? "selectedTime" : ""}`}
                              onClick={() => handleMinuteSelect(minute)}
                            >
                              {minute.toString().padStart(2, "0")}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* AM / PM — 3rd column, right side */}
                    <div className="amPmColumn">
                      <div className="timeColumnHeader">{amPm}</div>
                      <div className="amPmButtons">
                        <button
                          type="button"
                          className={`amPmBtn ${amPm === "AM" ? "active" : ""}`}
                          onClick={() => handleAmPmToggle("AM")}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          className={`amPmBtn ${amPm === "PM" ? "active" : ""}`}
                          onClick={() => handleAmPmToggle("PM")}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="datePickerFooter">
              <button
                type="button"
                className="footerBtn cancel"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button type="button" className="footerBtn ok" onClick={handleOk}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="errorText">{error}</p>}
    </div>
  );
}

export default ReusableDateTime;
