import { useState, useRef, useEffect } from "react";
import greenDownArrow from "../../assets/mainScreen/greenChevronRight.svg";
import downArrow from "../../assets/mainScreen/chevronRight.svg";
import checkedIcon from "../../assets/commonIcons/checkedIcon.svg";
import uncheckedIcon from "../../assets/commonIcons/uncheckedIcon.svg";
import "./style.scss";

export function ReusableMulti({
  label,
  options = [],
  value = [],
  placeholder = "Select option",
  onChange,
  greenIcon = true,
  required = false,
  overWriteClassName = "",
  maxWidth = "100%"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = Array.isArray(value) ? value : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleOptionClick = (optionValue) => {
    const updated = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue];
    onChange?.(updated);
  };

  const displayValue =
    selected.length > 0
      ? options
          .filter((o) => selected.includes(o.value))
          .map((o) => o.label)
          .join(", ")
      : null;

  return (
    <div
      className={`reusableMulti ${isOpen ? "open" : ""} ${overWriteClassName}`}
      style={{ maxWidth }}
      ref={dropdownRef}
    >
      {label && (
        <label className="reusableMultiLabel">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <div
        className="reusableMultiSelectContainer"
        style={!greenIcon ? { borderColor: "#E1E5EA" } : {}}
      >
        <div className="reusableMultiSelectValue" onClick={handleToggle}>
          <p
            className="reusableMultiSelectValueText"
            style={
              !greenIcon ? { color: displayValue ? "#181D25" : "#929FB1" } : {}
            }
          >
            {displayValue || placeholder}
          </p>
          <img
            src={greenIcon ? greenDownArrow : downArrow}
            alt="downArrow"
            className={`reusableMultiArrow ${isOpen ? "rotated" : ""}`}
          />
        </div>

        {isOpen && (
          <div className="reusableMultiOptions">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className="reusableMultiOption"
              >
                <img
                  src={
                    selected.includes(option.value)
                      ? checkedIcon
                      : uncheckedIcon
                  }
                  alt={
                    selected.includes(option.value) ? "checked" : "unchecked"
                  }
                  className="reusableMultiCheckIcon"
                />
                <p className="reusableMultiOptionText">{option.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReusableMulti;
