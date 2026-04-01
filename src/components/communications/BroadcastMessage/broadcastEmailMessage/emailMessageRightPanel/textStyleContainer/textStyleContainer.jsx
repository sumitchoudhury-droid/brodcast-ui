import { useState, useRef, useEffect } from "react";
import chevronDown from "../../../../../../assets/mainScreen/chevronRight.svg";
import "./style.scss";

export const TextStyleContainer = ({
  typography,
  handleTypographyChange,
  textColor,
  handleTextColorChange,
  textColorInputRef,
  title = ""
}) => {
  const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
  const [isFontWeightOpen, setIsFontWeightOpen] = useState(false);

  const fontFamilyRef = useRef(null);
  const fontWeightRef = useRef(null);

  const fontFamilies = ["Inter", "Roboto", "Arial", "Times New Roman"];
  const fontWeights = [
    { label: "Regular", value: "400" },
    { label: "Medium", value: "500" },
    { label: "SemiBold", value: "600" },
    { label: "Bold", value: "700" }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        fontFamilyRef.current &&
        !fontFamilyRef.current.contains(event.target)
      ) {
        setIsFontFamilyOpen(false);
      }
      if (
        fontWeightRef.current &&
        !fontWeightRef.current.contains(event.target)
      ) {
        setIsFontWeightOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFontFamily = (font) => {
    handleTypographyChange("fontFamily", font);
    setIsFontFamilyOpen(false);
  };

  const handleSelectFontWeight = (weight) => {
    handleTypographyChange("fontWeight", weight);
    setIsFontWeightOpen(false);
  };

  return (
    <div className="textStyleContainer">
      <div className="section-header">
        <span>{title || "Text Style"}</span>
      </div>
      <div className="textControls">
        {/* Font Family Dropdown */}
        <div
          className={`customDropdown fullWidth ${isFontFamilyOpen ? "open" : ""}`}
          ref={fontFamilyRef}
        >
          <div
            className="dropdownTrigger"
            onClick={() => setIsFontFamilyOpen(!isFontFamilyOpen)}
          >
            <p>{typography.fontFamily}</p>
            <img
              src={chevronDown}
              alt="chevron"
              className={`chevronIcon ${isFontFamilyOpen ? "rotated" : ""}`}
            />
          </div>
          {isFontFamilyOpen && (
            <div className="dropdownOptions">
              {fontFamilies.map((font) => (
                <div
                  key={font}
                  className={`optionItem ${typography.fontFamily === font ? "selected" : ""}`}
                  onClick={() => handleSelectFontFamily(font)}
                >
                  <p>{font}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dropdownRow">
          {/* Font Weight Dropdown */}
          <div
            className={`customDropdown flex1 ${isFontWeightOpen ? "open" : ""}`}
            ref={fontWeightRef}
          >
            <div
              className="dropdownTrigger"
              onClick={() => setIsFontWeightOpen(!isFontWeightOpen)}
            >
              <p>
                {fontWeights.find((w) => w.value === typography.fontWeight)
                  ?.label || "Regular"}
              </p>
              <img
                src={chevronDown}
                alt="chevron"
                className={`chevronIcon ${isFontWeightOpen ? "rotated" : ""}`}
              />
            </div>
            {isFontWeightOpen && (
              <div className="dropdownOptions">
                {fontWeights.map((weight) => (
                  <div
                    key={weight.value}
                    className={`optionItem ${typography.fontWeight === weight.value ? "selected" : ""}`}
                    onClick={() => handleSelectFontWeight(weight.value)}
                  >
                    <p>{weight.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dropdownControl flex1">
            <input
              type="number"
              value={typography.fontSize}
              onChange={(e) =>
                handleTypographyChange("fontSize", e.target.value)
              }
            />
            <span>px</span>
          </div>
        </div>

        <div className="textStyleActions">
          <div className="colorControlWrapper tiny">
            <div
              className="colorControl mini"
              onClick={() => textColorInputRef.current?.click()}
            >
              <div
                className="colorPreview"
                style={{ backgroundColor: textColor }}
              ></div>
              <span className="hexValue">{textColor.toUpperCase()}</span>
              <input
                type="color"
                ref={textColorInputRef}
                className="hiddenColorInput"
                value={
                  textColor.match(/^#[0-9a-f]{6}$/i) ? textColor : "#000000"
                }
                onChange={(e) => handleTextColorChange(e.target.value)}
              />
            </div>
          </div>
          <div className="alignmentToggle">
            <button
              className={typography.textAlign === "left" ? "active" : ""}
              onClick={() => handleTypographyChange("textAlign", "left")}
            >
              L
            </button>
            <button
              className={typography.textAlign === "center" ? "active" : ""}
              onClick={() => handleTypographyChange("textAlign", "center")}
            >
              C
            </button>
            <button
              className={typography.textAlign === "right" ? "active" : ""}
              onClick={() => handleTypographyChange("textAlign", "right")}
            >
              R
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
