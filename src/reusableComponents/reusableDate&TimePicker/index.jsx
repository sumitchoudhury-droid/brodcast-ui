import { useState, useRef, useEffect, forwardRef, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
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
  getMinutes
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

export const ReusableDateTime = ({
  label,
  selected,
  onChange,
  placeholder = "Select Date & Time",
  showTimeSelect = true,
  dateFormat = "MMMM d, yyyy h:mm aa",
  required = false,
  error = "",
  disabled = false,
  className = "",
  onCancel,
  onOk
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selected || new Date());
  const [tempDate, setTempDate] = useState(selected || new Date());
  const containerRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  const [prevSelected, setPrevSelected] = useState(selected);

  if (selected !== prevSelected) {
    setPrevSelected(selected);
    if (selected) {
      setTempDate(selected);
      setViewDate(selected);
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
            listRef.current.scrollTop =
              selectedBtn.offsetTop -
              listRef.current.clientHeight / 2 +
              selectedBtn.clientHeight / 2;
          }
        }
      };

      // Small timeout to ensure DOM elements are fully rendered and styles applied
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
      if (!isOpen && selected) {
        setTempDate(selected);
        setViewDate(selected);
      }
    }
  };

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const handleDateSelect = (date) => {
    const newDate = setMinutes(
      setHours(date, getHours(tempDate)),
      getMinutes(tempDate)
    );
    setTempDate(newDate);
  };

  const handleHourSelect = (hour) => {
    const newDate = setHours(tempDate, hour);
    setTempDate(newDate);
  };

  const handleMinuteSelect = (minute) => {
    const newDate = setMinutes(tempDate, minute);
    setTempDate(newDate);
  };

  const handleOk = () => {
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

  const hoursList = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  const minutesList = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => i);
  }, []);

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

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
            showTimeSelect ? <Clock size={18} /> : <CalendarIcon size={18} />
          }
          error={error}
          disabled={disabled}
        />

        {isOpen && (
          <div className="customDatePickerPopup">
            <div className="pickerContent">
              <div className="calendarSection">
                <div className="customDatePickerHeader">
                  <div className="monthDisplay">
                    {format(viewDate, "MMMM yyyy")}
                    <ChevronDown size={18} className="dropdownIcon" />
                  </div>
                  <div className="navigationWrapper">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="navBtn"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="navBtn"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="weekDaysRow">
                  {weekDays.map((day, i) => (
                    <div key={`${day}-${i}`} className="weekDay">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="daysGrid">
                  {days.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`dayCell ${!isSameMonth(day, viewDate) ? "outsideMonth" : ""} ${isSameDay(day, tempDate) ? "selected" : ""} ${isToday(day) ? "today" : ""}`}
                      onClick={() => handleDateSelect(day)}
                    >
                      {format(day, "d")}
                    </button>
                  ))}
                </div>
              </div>

              {showTimeSelect && (
                <div className="timeSection">
                  <div className="timeHeader">Time</div>
                  <div className="timeColumns">
                    <div className="timeColumn">
                      <div className="columnTitle">HH</div>
                      <div className="timeList" ref={hourListRef}>
                        {hoursList.map((hour) => {
                          const isSelected = getHours(tempDate) === hour;
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
                    <div className="timeColumn">
                      <div className="columnTitle">MM</div>
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
                  </div>
                </div>
              )}
            </div>

            <div className="datePickerFooter">
              <button
                type="button"
                className="footerBtn cancel"
                onClick={handleCancel}
              >
                CANCEL
              </button>
              <button type="button" className="footerBtn ok" onClick={handleOk}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="errorText">{error}</p>}
    </div>
  );
};

export default ReusableDateTime;
