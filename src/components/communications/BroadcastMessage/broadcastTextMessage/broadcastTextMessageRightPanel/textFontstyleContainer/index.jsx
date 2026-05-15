import { useState, useRef, useEffect } from "react";
import { ColorPicker } from "../../../../../../reusableComponents/reusableColorPicker/ColorPicker";
import chevronDown from "../../../../../../assets/mainScreen/chevronRight.svg";
import underlineIcon from "../../../../../../assets/textStyleIcons/underlineIcon.svg";
import italicIcon from "../../../../../../assets/textStyleIcons/italicIcon.svg";
import strikethroughIcon from "../../../../../../assets/textStyleIcons/strikethroughIcon.svg";
import highlightIcon from "../../../../../../assets/textStyleIcons/highlightIcon.svg";
import codeIcon from "../../../../../../assets/textStyleIcons/codeIcon.svg";
import subscriptIcon from "../../../../../../assets/textStyleIcons/subscriptIcon.svg";
import superscriptIcon from "../../../../../../assets/textStyleIcons/superscriptIcon.svg";
import indentDecreaseIcon from "../../../../../../assets/textStyleIcons/indentDecreaseIcon.svg";
import indentIncreaseIcon from "../../../../../../assets/textStyleIcons/indentIncreaseIcon.svg";
import uppercaseIcon from "../../../../../../assets/textStyleIcons/uppercaseIcon.svg";
import unorderedListIcon from "../../../../../../assets/textStyleIcons/unorderedListIcon.svg";
import orderedListIcon from "../../../../../../assets/textStyleIcons/orderedListIcon.svg";
import alignLeftIcon from "../../../../../../assets/textStyleIcons/alignLeftIcon.svg";
import alignCenterIcon from "../../../../../../assets/textStyleIcons/alignCenterIcon.svg";
import alignRightIcon from "../../../../../../assets/textStyleIcons/alignRightIcon.svg";
import justifyIcon from "../../../../../../assets/textStyleIcons/JustifyIcon.svg";
import lineThroughIcon from "../../../../../../assets/textStyleIcons/lineThroughIcon.svg";

import "./style.scss";
import { getOpacityFromColor } from "../../../../../../utils/colorUtils";

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

export const TextFontStyleContainer = ({
  typography,
  handleTypographyChange,
  textColor,
  handleTextColorChange,
  title = "",
  activeFormats = {},
  onFormatToggle
}) => {
  const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
  const [isFontWeightOpen, setIsFontWeightOpen] = useState(false);
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const fontFamilyRef = useRef(null);
  const fontWeightRef = useRef(null);
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);

  const openPopover = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 6, left: rect.left });
    }
    setShowColorPopover((prev) => !prev);
  };

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
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target)
      )
        setShowColorPopover(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPopover]);

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
              ref={anchorRef}
              className="colorControl mini"
              onClick={openPopover}
            >
              <div
                className="colorPreview"
                style={{ backgroundColor: textColor }}
              ></div>
              <span className="hexValue">{textColor.toUpperCase()}</span>
              <span className="opacityValue">
                {getOpacityFromColor(textColor)}%
              </span>
            </div>
            {showColorPopover && (
              <div
                ref={popoverRef}
                className="colorPopover"
                style={{ top: popoverPos.top, left: popoverPos.left }}
              >
                <ColorPicker
                  color={
                    textColor.match(/^#[0-9a-f]{6}$/i) ? textColor : "#000000"
                  }
                  onChange={handleTextColorChange}
                  defaultColors={DEFAULT_COLORS}
                />
              </div>
            )}
          </div>
          <div className="alignmentToggle">
            <button
              className={typography.textAlign === "left" ? "active" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                handleTypographyChange("textAlign", "left");
              }}
            >
              L
            </button>
            <button
              className={typography.textAlign === "center" ? "active" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                handleTypographyChange("textAlign", "center");
              }}
            >
              C
            </button>
            <button
              className={typography.textAlign === "right" ? "active" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                handleTypographyChange("textAlign", "right");
              }}
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  fmt("underline")();
                }}
              >
                <img src={underlineIcon} alt="underline" />
              </button>

              {/* Italic */}
              <button
                className={`formatIconBtn ${isActive("italic") ? "active" : ""}`}
                title="Italic"
                onMouseDown={(e) => {
                  e.preventDefault();
                  fmt("italic")();
                }}
              >
                <img src={italicIcon} alt="italic" />
              </button>

              {/* Strikethrough */}
              <button
                className={`formatIconBtn ${isActive("strikethrough") ? "active" : ""}`}
                title="Strikethrough"
                onMouseDown={(e) => {
                  e.preventDefault();
                  fmt("strikethrough")();
                }}
              >
                <img src={strikethroughIcon} alt="strikethrough" />
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  fmt("uppercase")();
                }}
              >
                <img src={uppercaseIcon} alt="uppercase" />
              </button>

              {/* Unordered List */}
              <button
                className={`formatIconBtn ${isActive("unorderedList") ? "active" : ""}`}
                title="Bullet List"
                onMouseDown={(e) => {
                  e.preventDefault();
                  fmt("unorderedList")();
                }}
              >
                <img src={unorderedListIcon} alt="unorderedList" />
              </button>

              {/* Ordered List */}
              <button
                className={`formatIconBtn ${isActive("orderedList") ? "active" : ""}`}
                title="Numbered List"
                onMouseDown={(e) => {
                  e.preventDefault();
                  fmt("orderedList")();
                }}
              >
                <img src={orderedListIcon} alt="orderedList" />
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTypographyChange("textAlign", "left");
                }}
              >
                <img src={alignLeftIcon} alt="alignLeft" />
              </button>

              {/* Align Center */}
              <button
                className={`formatIconBtn ${typography.textAlign === "center" ? "active" : ""}`}
                title="Align Center"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTypographyChange("textAlign", "center");
                }}
              >
                <img src={alignCenterIcon} alt="alignCenter" />
              </button>

              {/* Align Right */}
              <button
                className={`formatIconBtn ${typography.textAlign === "right" ? "active" : ""}`}
                title="Align Right"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTypographyChange("textAlign", "right");
                }}
              >
                <img src={alignRightIcon} alt="alignRight" />
              </button>

              {/* Justify */}
              <button
                className={`formatIconBtn ${typography.textAlign === "justify" ? "active" : ""}`}
                title="Justify"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTypographyChange("textAlign", "justify");
                }}
              >
                <img src={justifyIcon} alt="justify" />
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  fmt("indentDecrease")();
                }}
              >
                <img src={indentDecreaseIcon} alt="indentDecrease" />
              </button>

              {/* Indent Increase */}
              <button
                className="formatIconBtn"
                title="Increase Indent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  fmt("indentIncrease")();
                }}
              >
                <img src={indentIncreaseIcon} alt="indentIncrease" />
              </button>
            </div>
          </div>

          {/* ── Group 3: Super | Sub | Code | Line-through | Highlight ─────── */}
          <div className="textStyleActionsRightSize">
            {/* Superscript */}
            <button
              className={`formatIconBtn ${isActive("superscript") ? "active" : ""}`}
              title="Superscript"
              onMouseDown={(e) => {
                e.preventDefault();
                fmt("superscript")();
              }}
            >
              <img src={superscriptIcon} alt="superscript" />
            </button>

            {/* Subscript */}
            <button
              className={`formatIconBtn ${isActive("subscript") ? "active" : ""}`}
              title="Subscript"
              onMouseDown={(e) => {
                e.preventDefault();
                fmt("subscript")();
              }}
            >
              <img src={subscriptIcon} alt="subscript" />
            </button>

            {/* Code */}
            <button
              className={`formatIconBtn ${isActive("code") ? "active" : ""}`}
              title="Inline Code"
              onMouseDown={(e) => {
                e.preventDefault();
                fmt("code")();
              }}
            >
              <img src={codeIcon} alt="code" />
            </button>

            {/* Line Through */}
            <button
              className={`formatIconBtn ${isActive("lineThrough") ? "active" : ""}`}
              title="Line Through"
              onMouseDown={(e) => {
                e.preventDefault();
                fmt("lineThrough")();
              }}
            >
              <img src={lineThroughIcon} alt="lineThrough" />
            </button>

            {/* Highlight */}
            <button
              className={`formatIconBtn ${isActive("highlight") ? "active" : ""}`}
              title="Highlight"
              onMouseDown={(e) => {
                e.preventDefault();
                fmt("highlight")();
              }}
            >
              <img src={highlightIcon} alt="highlight" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
