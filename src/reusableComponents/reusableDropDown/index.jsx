import { useState, useRef, useEffect } from "react";
import greenDownArrow from "../../assets/mainScreen/greenChevronRight.svg";
import downArrow from "../../assets/mainScreen/chevronRight.svg";
import "./style.scss";

export const ReusableDropDown = ({
  label,
  options = [],
  value = "",
  placeholder = "Select option",
  onChange,
  valueImage,
  greenIcon = true
}) => {
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

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`dropdown ${isOpen ? "open" : ""}`} ref={dropdownRef}>
      {label && <label className="dropdownLabel">{label}</label>}
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
                !greenIcon ? { color: placeholder ? "#929FB1" : "#181D25" } : {}
              }
            >
              {value || placeholder}
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
                onClick={() => handleOptionClick(option.value)}
                className="dropdownSelectContainerOptions"
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
};
