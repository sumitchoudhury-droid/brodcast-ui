import { useState, useRef, useEffect } from "react";
import greenDownArrow from "../../assets/mainScreen/greenChevronRight.svg";
import downArrow from "../../assets/mainScreen/chevronRight.svg";
import infoIcon from "../../assets/mainScreen/infoCircle.svg";
import { ReusableToolTip } from "../reusableToolTip/index";
import "./style.scss";

export function ReusableDropDown({
  label,
  options = [],
  value = "",
  placeholder = "Select option",
  onChange,
  valueImage,
  greenIcon = true,
  required = false,
  overWriteClassName = "",
  maxWidth = "100%",
  info = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div
      className={`dropdown ${isOpen ? "open" : ""} ${overWriteClassName}`}
      style={{ maxWidth: maxWidth }}
      ref={dropdownRef}
    >
      {label && (
        <label className="dropdownLabel">
          {label} {required && <span className="required">*</span>}{" "}
          {info && (
            <ReusableToolTip
              content="Select High for urgent communications that must reach all recipients on the same day. Select Standard for routine communications that can be completed during business hours and continue the next business day if needed."
              position="top"
            >
              <img
                src={infoIcon}
                alt="infoIcon"
                className="infoIcon"
                style={{ cursor: "pointer" }}
              />
            </ReusableToolTip>
          )}
        </label>
      )}
      <div
        className="dropdownSelectContainer"
        style={!greenIcon ? { borderColor: "#E1E5EA" } : {}}
      >
        <div className="dropdownSelectContainerValue" onClick={handleToggle}>
          <div className="dropdownSelectContainerValueImage">
            {valueImage && (
              <div className="dropdownSelectContainerValueImageWrapper">
                <img
                  src={valueImage}
                  alt="valueImage"
                  className="dropdownSelectContainerValueImage"
                />
              </div>
            )}
            <p
              className="dropdownSelectContainerValueText"
              style={
                !greenIcon
                  ? { color: selectedLabel ? "#181D25" : "#929FB1" }
                  : {}
              }
            >
              {selectedLabel || placeholder}
            </p>
          </div>
          <img
            src={greenIcon ? greenDownArrow : downArrow}
            alt="downArrow"
            className={`dropdownSelectContainerValueArrow ${isOpen ? "rotated" : ""}`}
          />
        </div>

        {isOpen && (
          <div className="dropdownSelectContainerOptionsContainer">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option)}
                className={`dropdownSelectContainerOptions ${option.value === value ? "selected" : ""}`}
              >
                {option.image && (
                  <img
                    src={option.image}
                    alt={option.label}
                    className="dropdownSelectContainerOptionsImage"
                  />
                )}
                <p className="dropdownSelectContainerOptionsText">
                  {option.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default ReusableDropDown;
