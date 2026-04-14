import { useState, useRef, useEffect } from "react";
import "./style.scss";
import { getOpacityFromColor } from "../../../../../../utils/colorUtils";
import { ColorPicker } from "../backgroundContainer/ColorPicker";

const DEFAULT_COLORS = [
  "#D91515",
  "#EB9F13",
  "#F1F12B",
  "#25D825",
  "#2E2EF5",
  "#6941C6",
  "#74B154",
  "#2563EB",
  "#F59E0B",
  "#18B2F5"
];

const BorderContainer = ({
  borderWidth,
  borderStyle,
  borderColor,
  borderRadius,
  handleBorderChange,
  handleBorderRadiusChange
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ bottom: 0, left: 0 });
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);

  const openPopover = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopoverPos({
        bottom: window.innerHeight - rect.top + 6,
        left: rect.left
      });
    }
    setShowColorPopover((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target)
      ) {
        setShowColorPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPopover]);

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
              ref={anchorRef}
              className="colorControl mini"
              onClick={openPopover}
            >
              <div
                className="colorPreview"
                style={{ backgroundColor: borderColor }}
              ></div>
              <span className="hexValue">{borderColor.toUpperCase()}</span>
              <span className="opacityValue">
                {getOpacityFromColor(borderColor)}%
              </span>
            </div>
            {showColorPopover && (
              <div
                ref={popoverRef}
                className="colorPopover"
                style={{ bottom: popoverPos.bottom, left: popoverPos.left }}
              >
                <ColorPicker
                  color={borderColor}
                  onChange={(val) => handleBorderChange("color", val)}
                  defaultColors={DEFAULT_COLORS}
                />
              </div>
            )}
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
