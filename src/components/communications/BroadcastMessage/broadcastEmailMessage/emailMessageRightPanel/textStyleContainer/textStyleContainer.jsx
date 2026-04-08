import { useState, useRef, useEffect } from "react";
import chevronDown from "../../../../../../assets/mainScreen/chevronRight.svg";
import "./style.scss";
import { getOpacityFromColor } from "../../../../../../utils/colorUtils";

export const TextStyleContainer = ({
  typography,
  handleTypographyChange,
  textColor,
  handleTextColorChange,
  textColorInputRef,
  title = "",
  activeFormats = {},
  onFormatToggle
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        fontFamilyRef.current &&
        !fontFamilyRef.current.contains(event.target)
      )
        setIsFontFamilyOpen(false);
      if (
        fontWeightRef.current &&
        !fontWeightRef.current.contains(event.target)
      )
        setIsFontWeightOpen(false);
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

  const fmt = (action) => () => onFormatToggle?.(action);
  const isActive = (action) => activeFormats[action] || false;

  return (
    <div className="textStyleContainer">
      <div className="section-header">
        <span>{title || "Text Style"}</span>
      </div>
      <div className="textControls">
        {/* ── Font Family ─────────────────────────────────────────────────── */}
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

        {/* ── Font Weight + Size ──────────────────────────────────────────── */}
        <div className="dropdownRow">
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

        {/* ── Color + Quick Alignment ─────────────────────────────────────── */}
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
              <span className="opacityValue">
                {getOpacityFromColor(textColor)}%
              </span>
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

        {/* ══════════════════════════════════════════════════════════════════
            ADVANCED FORMAT TOOLBAR
        ══════════════════════════════════════════════════════════════════ */}
        <div className="textStyleActionsRight">
          {/* ── Group 1: Underline | Italic | Bold | Strikethrough + Aa | UL | OL ── */}
          <div className="textStyleActionsRightItem">
            <div
              className="textStyleActionsRightItemContent"
              style={{ width: "49%" }}
            >
              {/* Underline */}
              <button
                className={`formatIconBtn ${isActive("underline") ? "active" : ""}`}
                title="Underline"
                onClick={fmt("underline")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M4.5 3V7.5C4.5 8.69347 4.97411 9.83807 5.81802 10.682C6.66193 11.5259 7.80653 12 9 12C10.1935 12 11.3381 11.5259 12.182 10.682C13.0259 9.83807 13.5 8.69347 13.5 7.5V3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 15H15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Italic */}
              <button
                className={`formatIconBtn ${isActive("italic") ? "active" : ""}`}
                title="Italic"
                onClick={fmt("italic")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M14.25 3H7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.5 15H3.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.25 3L6.75 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* <button className={`formatIconBtn ${isActive("bold") ? "active" : ""}`} title="Bold" onClick={fmt("bold")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M12.0002 3H6.7502C6.39015 2.99981 6.0353 3.08604 5.71548 3.25143C5.39566 3.41682 5.1202 3.65655 4.91225 3.95048C4.70429 4.24441 4.56991 4.58396 4.5204 4.94059C4.47089 5.29723 4.50768 5.66054 4.6277 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.5 9C11.2956 9 12.0587 9.31607 12.6213 9.87868C13.1839 10.4413 13.5 11.2044 13.5 12C13.5 12.7956 13.1839 13.5587 12.6213 14.1213C12.0587 14.6839 11.2956 15 10.5 15H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 9H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button> */}

              {/* Strikethrough */}
              <button
                className={`formatIconBtn ${isActive("strikethrough") ? "active" : ""}`}
                title="Strikethrough"
                onClick={fmt("strikethrough")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M12.0002 3H6.7502C6.39015 2.99981 6.0353 3.08604 5.71548 3.25143C5.39566 3.41682 5.1202 3.65655 4.91225 3.95048C4.70429 4.24441 4.56991 4.58396 4.5204 4.94059C4.47089 5.29723 4.50768 5.66054 4.6277 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.5 9C11.2956 9 12.0587 9.31607 12.6213 9.87868C13.1839 10.4413 13.5 11.2044 13.5 12C13.5 12.7956 13.1839 13.5587 12.6213 14.1213C12.0587 14.6839 11.2956 15 10.5 15H4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 9H15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div
              className="textStyleActionsRightItemContent"
              style={{ width: "49%" }}
            >
              {/* Uppercase / Aa */}
              <button
                className={`formatIconBtn ${isActive("uppercase") ? "active" : ""}`}
                title="Uppercase"
                onClick={fmt("uppercase")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M1.5 12L4.52925 4.7325C4.55773 4.66418 4.6058 4.60581 4.66739 4.56476C4.72899 4.52371 4.80135 4.5018 4.87538 4.5018C4.9494 4.5018 5.02176 4.52371 5.08336 4.56476C5.14495 4.60581 5.19302 4.66418 5.2215 4.7325L8.25 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.5 6.75V12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.47754 9.75H7.27154"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.875 12C15.3247 12 16.5 10.8247 16.5 9.375C16.5 7.92525 15.3247 6.75 13.875 6.75C12.4253 6.75 11.25 7.92525 11.25 9.375C11.25 10.8247 12.4253 12 13.875 12Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Unordered List */}
              <button
                className={`formatIconBtn ${isActive("unorderedList") ? "active" : ""}`}
                title="Bullet List"
                onClick={fmt("unorderedList")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M2.25 3.75H2.2575"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.25 9H2.2575"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.25 14.25H2.2575"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 3.75H15.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 9H15.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 14.25H15.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Ordered List */}
              <button
                className={`formatIconBtn ${isActive("orderedList") ? "active" : ""}`}
                title="Numbered List"
                onClick={fmt("orderedList")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M8.25 3.75H15.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.25 9H15.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.25 14.25H15.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 3H3.75V6.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 6.75H4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.8748 15H2.5498C2.5498 14.25 4.4998 13.5562 4.4998 12.375C4.49983 12.1489 4.43171 11.928 4.30432 11.7411C4.17693 11.5543 3.99619 11.4101 3.78566 11.3276C3.57514 11.245 3.34462 11.2277 3.12416 11.2781C2.90371 11.3285 2.70355 11.4442 2.5498 11.61"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Group 2: Alignment + Indent ─────────────────────────────────── */}
          <div className="textStyleActionsRightItem">
            <div
              className="textStyleActionsRightItemContent"
              style={{ width: "69%" }}
            >
              {/* Align Left */}
              <button
                className={`formatIconBtn ${typography.textAlign === "left" ? "active" : ""}`}
                title="Align Left"
                onClick={() => handleTypographyChange("textAlign", "left")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M15.75 3.75H2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.25 9H2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.75 14.25H2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Align Center */}
              <button
                className={`formatIconBtn ${typography.textAlign === "center" ? "active" : ""}`}
                title="Align Center"
                onClick={() => handleTypographyChange("textAlign", "center")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M15.75 3.75H2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.75 9H5.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.25 14.25H3.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Align Right */}
              <button
                className={`formatIconBtn ${typography.textAlign === "right" ? "active" : ""}`}
                title="Align Right"
                onClick={() => handleTypographyChange("textAlign", "right")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M15.75 3.75H2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 9H6.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 14.25H5.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Justify */}
              <button
                className={`formatIconBtn ${typography.textAlign === "justify" ? "active" : ""}`}
                title="Justify"
                onClick={() => handleTypographyChange("textAlign", "justify")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M15.75 3.75H2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 9H2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 14.25H2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div
              className="textStyleActionsRightItemContent"
              style={{ width: "29%" }}
            >
              {/* Indent Decrease */}
              <button
                className="formatIconBtn"
                title="Decrease Indent"
                onClick={fmt("indentDecrease")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M15.75 3.75H8.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 9H8.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 14.25H8.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.25 6L2.25 9L5.25 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Indent Increase */}
              <button
                className="formatIconBtn"
                title="Increase Indent"
                onClick={fmt("indentIncrease")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M15.75 3.75H8.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 9H8.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.75 14.25H8.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.25 6L5.25 9L2.25 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Group 3: Super | Sub | Code | Line-through | Highlight ─────── */}
          <div className="textStyleActionsRightSize">
            {/* Superscript */}
            <button
              className={`formatIconBtn ${isActive("superscript") ? "active" : ""}`}
              title="Superscript"
              onClick={fmt("superscript")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M3 3.75L9 9.75"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 3.75L3 9.75"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 14.25H12C12 13.125 12.33 12.75 13.125 12.375C13.92 12 15 11.4975 15 10.5C15 10.1475 14.8725 9.8025 14.64 9.5325C14.3999 9.26063 14.0737 9.07949 13.716 9.01942C13.3582 8.95934 12.9907 9.02398 12.675 9.2025C12.36 9.3825 12.12 9.6675 12 10.005"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Subscript */}
            <button
              className={`formatIconBtn ${isActive("subscript") ? "active" : ""}`}
              title="Subscript"
              onClick={fmt("subscript")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M3 14.25L9 8.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 14.25L3 8.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 9H12C12 7.875 12.3315 7.5 13.125 7.125C13.9185 6.75 15 6.2505 15 5.2515C15 4.8975 14.8725 4.554 14.637 4.284C14.397 4.01255 14.071 3.8319 13.7136 3.77236C13.3562 3.71282 12.9893 3.77801 12.6743 3.957C12.3593 4.13625 12.1207 4.4175 12 4.752"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Code */}
            <button
              className={`formatIconBtn ${isActive("code") ? "active" : ""}`}
              title="Inline Code"
              onClick={fmt("code")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M13.5 12L16.5 9L13.5 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.5 6L1.5 9L4.5 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.875 3L7.125 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Line Through */}
            <button
              className={`formatIconBtn ${isActive("lineThrough") ? "active" : ""}`}
              title="Line Through"
              onClick={fmt("lineThrough")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M3.75 9H14.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Highlight */}
            <button
              className={`formatIconBtn ${isActive("highlight") ? "active" : ""}`}
              title="Highlight"
              onClick={fmt("highlight")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M15.7497 15.75H5.99968C5.8019 15.7505 5.60599 15.7118 5.42321 15.6362C5.24044 15.5607 5.07441 15.4497 4.93468 15.3098L1.93918 12.3105C1.65797 12.0292 1.5 11.6477 1.5 11.25C1.5 10.8523 1.65797 10.4708 1.93918 10.1895L9.43918 2.6895C9.57848 2.55015 9.74386 2.43961 9.92589 2.36419C10.1079 2.28877 10.303 2.24995 10.5001 2.24995C10.6971 2.24995 10.8922 2.28877 11.0742 2.36419C11.2562 2.43961 11.4216 2.55015 11.5609 2.6895L16.0602 7.1895C16.3414 7.47079 16.4994 7.85225 16.4994 8.25C16.4994 8.64775 16.3414 9.02921 16.0602 9.3105L9.62518 15.75"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.81152 8.3175L10.4325 14.9385"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
