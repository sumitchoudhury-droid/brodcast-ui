import { useState, useRef, useEffect } from "react";
import "./style.scss";
import { getOpacityFromColor } from "../../../../../../utils/colorUtils";
const BorderContainer = ({
  borderWidth,
  borderStyle,
  borderColor,
  borderRadius,
  handleBorderChange,
  handleBorderRadiusChange,
  borderColorInputRef
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const borderOptions = [
    { value: "solid", label: "Solid" },
    { value: "dashed", label: "Dashed" },
    { value: "dotted", label: "Dotted" },
    { value: "none", label: "None" }
  ];

  return (
    <div className="borderControls">
      <p className="sectionLabel">Border</p>
      <div className="borderRow">
        <div className="borderStyleRow">
          <div className="colorControlWrapper mini">
            <div
              className="colorControl mini"
              onClick={() => borderColorInputRef.current?.click()}
            >
              <div
                className="colorPreview"
                style={{ backgroundColor: borderColor }}
              ></div>
              <span className="hexValue">{borderColor.toUpperCase()}</span>
              <span className="opacityValue">
                {getOpacityFromColor(borderColor)}%
              </span>
              <input
                type="color"
                ref={borderColorInputRef}
                className="hiddenColorInput"
                value={borderColor}
                onChange={(e) => handleBorderChange("color", e.target.value)}
              />
            </div>
          </div>
          <div
            className={`styleSelector ${dropdownOpen ? "open" : ""}`}
            ref={dropdownRef}
          >
            <div
              className="customSelect"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <p className="selectedValue">
                {borderOptions.find((opt) => opt.value === borderStyle)
                  ?.label || "None"}
              </p>
            </div>
            {dropdownOpen && (
              <div className="dropdownOptions">
                {borderOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`dropdownOption ${borderStyle === option.value ? "selected" : ""}`}
                    onClick={() => {
                      handleBorderChange("style", option.value);
                      setDropdownOpen(false);
                    }}
                  >
                    <p>{option.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="borderRow inputs">
        <div className="inputGroup">
          <span className="inputLabel">Width</span>
          <div className="inputWrapper">
            <input
              type="number"
              value={borderWidth}
              onChange={(e) => handleBorderChange("width", e.target.value)}
              min="0"
            />
            <span className="unit">px</span>
          </div>
        </div>
        <div className="inputGroup">
          <span className="inputLabel">Radius</span>
          <div className="inputWrapper">
            <input
              type="number"
              value={borderRadius}
              onChange={(e) => handleBorderRadiusChange(e.target.value)}
              min="0"
            />
            <span className="unit">px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorderContainer;
