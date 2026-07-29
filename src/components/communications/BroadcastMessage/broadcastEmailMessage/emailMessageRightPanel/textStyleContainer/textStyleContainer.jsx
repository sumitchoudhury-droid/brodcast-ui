import { useState, useRef, useEffect } from "react";
import { ColorPicker } from "../../../../../../reusableComponents/reusableColorPicker/ColorPicker";
import chevronDown from "../../../../../../assets/mainScreen/chevronRight.svg";
import underlineIcon from "../../../../../../assets/textStyleIcons/underlineIcon.svg";
import italicIcon from "../../../../../../assets/textStyleIcons/italicIcon.svg";
import strikethroughIcon from "../../../../../../assets/textStyleIcons/strikethroughIcon.svg";
import uppercaseIcon from "../../../../../../assets/textStyleIcons/uppercaseIcon.svg";
import unorderedListIcon from "../../../../../../assets/textStyleIcons/unorderedListIcon.svg";
import orderedListIcon from "../../../../../../assets/textStyleIcons/orderedListIcon.svg";

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

export const TextStyleContainer = ({
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

  const fontFamilies = ["Arial", "Inter", "Roboto", "Times New Roman"];
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
                <img src={underlineIcon} alt="underline" />
              </button>

              {/* Italic */}
              <button
                className={`formatIconBtn ${isActive("italic") ? "active" : ""}`}
                title="Italic"
                onClick={fmt("italic")}
              >
                <img src={italicIcon} alt="italic" />
              </button>

              {/* Strikethrough */}
              <button
                className={`formatIconBtn ${isActive("strikethrough") ? "active" : ""}`}
                title="Strikethrough"
                onClick={fmt("strikethrough")}
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
                onClick={fmt("uppercase")}
              >
                <img src={uppercaseIcon} alt="uppercase" />
              </button>

              {/* Unordered List */}
              <button
                className={`formatIconBtn ${isActive("unorderedList") ? "active" : ""}`}
                title="Bullet List"
                onClick={fmt("unorderedList")}
              >
                <img src={unorderedListIcon} alt="unorderedList" />
              </button>

              {/* Ordered List */}
              <button
                className={`formatIconBtn ${isActive("orderedList") ? "active" : ""}`}
                title="Numbered List"
                onClick={fmt("orderedList")}
              >
                <img src={orderedListIcon} alt="orderedList" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
