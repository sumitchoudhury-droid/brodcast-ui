import { useState, useRef, useCallback, useEffect } from "react";
import "./colorPicker.scss";

function hsvToRgb(h, s, v) {
  s /= 100;
  v /= 100;
  const k = (n) => (n + h / 60) % 6;
  const f = (n) => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255)
  };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

export function ColorPicker({ color, onChange, defaultColors = [] }) {
  const initHsv = () => {
    const rgb = hexToRgb(color);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  };

  const [hsv, setHsv] = useState(initHsv);
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const [prevColor, setPrevColor] = useState(color);
  const gradientRef = useRef(null);
  const isDragging = useRef(false);

  // Sync state with props during render (recommended for React 19)
  if (color !== prevColor) {
    const rgb = hexToRgb(color);
    const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHsv(newHsv);
    setHexInput(color.toUpperCase());
    setPrevColor(color);
  }

  const applyHsv = useCallback(
    (h, s, v) => {
      const rgb = hsvToRgb(h, s, v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setHexInput(hex);
      onChange(hex);
    },
    [onChange]
  );

  const getPositionFromEvent = (e) => {
    const rect = gradientRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    };
  };

  const handleGradientInteraction = useCallback(
    (e) => {
      if (!gradientRef.current) return;
      const { x, y } = getPositionFromEvent(e);
      const newS = x * 100;
      const newV = (1 - y) * 100;
      setHsv((prev) => ({ ...prev, s: newS, v: newV }));
      applyHsv(hsv.h, newS, newV);
    },
    [hsv.h, applyHsv]
  );

  useEffect(() => {
    const onMove = (e) => {
      if (isDragging.current) handleGradientInteraction(e);
    };
    const onUp = () => {
      isDragging.current = false;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };
  }, [handleGradientInteraction]);

  const handleHueChange = (e) => {
    const newH = Number(e.target.value);
    setHsv((prev) => ({ ...prev, h: newH }));
    applyHsv(newH, hsv.s, hsv.v);
  };

  const handleHexInputChange = (e) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const rgb = hexToRgb(val);
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(newHsv);
      onChange(val.toUpperCase());
    }
  };

  const thumbLeft = `${hsv.s}%`;
  const thumbTop = `${100 - hsv.v}%`;

  return (
    <div className="customColorPicker">
      {/* Gradient saturation/brightness area */}
      <div
        ref={gradientRef}
        className="gradientPicker"
        style={{
          background: `
            linear-gradient(to bottom, transparent, #000),
            linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))
          `
        }}
        onMouseDown={(e) => {
          isDragging.current = true;
          handleGradientInteraction(e);
        }}
        onTouchStart={(e) => {
          isDragging.current = true;
          handleGradientInteraction(e);
        }}
      >
        <div
          className="gradientThumb"
          style={{ left: thumbLeft, top: thumbTop }}
        />
      </div>

      {/* Hue range slider */}
      <div className="hueSliderWrapper">
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={hsv.h}
          className="hueSlider"
          onChange={handleHueChange}
        />
      </div>

      {/* Hex input */}
      <div className="hexInputWrapper">
        <input
          type="text"
          className="hexInput"
          value={hexInput}
          onChange={handleHexInputChange}
          maxLength={7}
          spellCheck={false}
        />
      </div>

      {/* Document colors */}
      {defaultColors.length > 0 && (
        <div className="documentColors">
          <p className="documentColorsLabel">Default colors</p>
          <div className="documentColorSwatches">
            {defaultColors.map((c) => (
              <div
                key={c}
                className={`documentSwatch ${
                  color.toLowerCase() === c.toLowerCase() ? "active" : ""
                }`}
                style={{ backgroundColor: c }}
                onClick={() => onChange(c.toUpperCase())}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
