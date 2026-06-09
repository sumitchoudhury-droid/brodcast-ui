import { useState, useRef, useEffect, useCallback } from "react";
import greenDownArrow from "../../assets/mainScreen/greenChevronRight.svg";
import downArrow from "../../assets/mainScreen/chevronRight.svg";
import "./style.scss";
import { ReusableCheckbox } from "../reusableCheckbox";
import ResuableSearch from "../reusableSearch";

import checkBox from "../../assets/mainScreen/checkBox.svg";
import uncheckBox from "../../assets/mainScreen/uncheckBox.svg";
import { ReusableButton } from "../resuableButton";

export const ReusableMultiSelectDropdown = ({
  label,
  options = [],
  value = [],
  placeholder = "Select option",
  onChange,
  valueImage,
  greenIcon = true,
  required = false,
  width = "100%",
  overWriteClassName = "",
  searchPlaceholder = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [selectedValues, setSelectedValues] = useState(
    Array.isArray(value) ? value : []
  );
  const [tempSelectedValues, setTempSelectedValues] = useState(
    Array.isArray(value) ? value : []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimer = useRef(null);
  const dropdownRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(val), 300);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTempSelectedValues(selectedValues);
        setShowOnlySelected(false);
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedValues]);

  const handleToggle = () => {
    if (!isOpen) {
      setTempSelectedValues(selectedValues);
      setSearchQuery("");
      setDebouncedQuery("");
    }
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionValue) => {
    const updated = tempSelectedValues.includes(optionValue)
      ? tempSelectedValues.filter((v) => v !== optionValue)
      : [...tempSelectedValues, optionValue];
    setTempSelectedValues(updated);
  };

  const allSelected =
    options.length > 0 && tempSelectedValues.length === options.length;

  const handleSelectDeselectAll = () => {
    if (allSelected) {
      setTempSelectedValues([]);
      setShowOnlySelected(false);
    } else {
      setTempSelectedValues(options.map((o) => o.value));
    }
  };

  const handleDone = () => {
    setSelectedValues(tempSelectedValues);
    onChange?.(tempSelectedValues);
    setShowOnlySelected(false);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedValues(selectedValues);
    setShowOnlySelected(false);
    setSearchQuery("");
    setIsOpen(false);
  };

  const displayValue =
    selectedValues.length > 0
      ? options
          .filter((o) => selectedValues.includes(o.value))
          .map((o) => o.label)
          .join(", ")
      : null;

  const visibleOptions = options
    .filter((o) => !showOnlySelected || tempSelectedValues.includes(o.value))
    .filter((o) =>
      o.label.toLowerCase().includes(debouncedQuery.toLowerCase())
    );

  return (
    <div
      className={`multidropdown ${isOpen ? "open" : ""} ${overWriteClassName}`}
      ref={dropdownRef}
      style={{ maxWidth: width }}
    >
      {label && (
        <label className="multidropdownLabel">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <div
        className="multidropdownSelectContainer"
        style={!greenIcon ? { borderColor: "#E1E5EA" } : {}}
      >
        <div
          className="multidropdownSelectContainerValue"
          onClick={handleToggle}
        >
          <div className="multidropdownSelectContainerValueImage">
            {valueImage && (
              <div className="multidropdownSelectContainerValueImageWrapper">
                <img
                  src={valueImage}
                  alt="valueImage"
                  className="multidropdownSelectContainerValueImage"
                />
              </div>
            )}
            <p
              className="multidropdownSelectContainerValueText"
              style={
                !greenIcon
                  ? { color: displayValue ? "#181D25" : "#929FB1" }
                  : {}
              }
            >
              {displayValue || placeholder}
            </p>
          </div>
          <img
            src={greenIcon ? greenDownArrow : downArrow}
            alt="downArrow"
            className={`multidropdownSelectContainerValueArrow ${isOpen ? "rotated" : ""}`}
          />
        </div>

        {isOpen && (
          <div className="multidropdownSelectContainerOptionsContainer">
            <div className="checkboxMulti">
              <ReusableCheckbox
                label={allSelected ? "Deselect all" : "Select all"}
                checked={allSelected}
                onChange={handleSelectDeselectAll}
              />
              <ReusableCheckbox
                label="Show only selected"
                checked={showOnlySelected}
                onChange={() => setShowOnlySelected((prev) => !prev)}
              />
            </div>

            <ResuableSearch
              placeholder={searchPlaceholder}
              width="calc(100% - 16px)"
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="multidropdownSelectionOptions">
              {visibleOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className="multidropdownSelectContainerOptions"
                >
                  <img
                    src={
                      tempSelectedValues.includes(option.value)
                        ? checkBox
                        : uncheckBox
                    }
                    alt="checkbox"
                    className="checkBox"
                  />
                  <p className="multidropdownSelectContainerOptionsText">
                    {option.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="btnWrapper">
              <ReusableButton
                label="Cancel"
                variant="primary"
                onClick={handleCancel}
              />
              <ReusableButton
                label="Done"
                variant="secondary"
                onClick={handleDone}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
