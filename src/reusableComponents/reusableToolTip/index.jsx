import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./style.scss";

export function ReusableToolTip({
  children,
  content,
  label,
  message,
  position = "top",
  className = ""
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  // Determine if there is any content to display
  const hasContent = content || label || message;

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = rect.top + window.scrollY;
          left = rect.left + window.scrollX + rect.width / 2;
          break;
        case "bottom":
          top = rect.top + window.scrollY + rect.height;
          left = rect.left + window.scrollX + rect.width / 2;
          break;
        case "left":
          top = rect.top + window.scrollY + rect.height / 2;
          left = rect.left + window.scrollX;
          break;
        case "right":
          top = rect.top + window.scrollY + rect.height / 2;
          left = rect.left + window.scrollX + rect.width;
          break;
        default:
          break;
      }

      setCoords({ top, left });
    }
  }, [isVisible, position]);

  // Update position on scroll/resize if the tooltip is visible
  useEffect(() => {
    if (!isVisible) return;

    const handleUpdate = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = rect.top + window.scrollY;
            left = rect.left + window.scrollX + rect.width / 2;
            break;
          case "bottom":
            top = rect.top + window.scrollY + rect.height;
            left = rect.left + window.scrollX + rect.width / 2;
            break;
          case "left":
            top = rect.top + window.scrollY + rect.height / 2;
            left = rect.left + window.scrollX;
            break;
          case "right":
            top = rect.top + window.scrollY + rect.height / 2;
            left = rect.left + window.scrollX + rect.width;
            break;
          default:
            break;
        }

        setCoords({ top, left });
      }
    };

    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isVisible, position]);

  if (!hasContent) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);
  const handleFocus = () => setIsVisible(true);
  const handleBlur = () => setIsVisible(false);

  const renderContent = () => {
    // If it's a React element or custom node
    if (React.isValidElement(content)) {
      return content;
    }

    // If content is an array (list of strings/nodes)
    if (Array.isArray(content)) {
      return (
        <div className="tooltip-list">
          {content.map((item, index) => (
            <div key={index} className="tooltip-list-item">
              {item}
            </div>
          ))}
        </div>
      );
    }

    // If content is an object with label and value, or we have label and message props
    const displayLabel =
      label ||
      (typeof content === "object" && content !== null ? content.label : null);
    const displayValue =
      message ||
      (typeof content === "object" && content !== null
        ? content.value
        : typeof content === "string" || typeof content === "number"
          ? content
          : null);

    if (displayLabel && displayValue) {
      return (
        <div className="tooltip-pair">
          <div className="tooltip-label">{displayLabel}</div>
          <div className="tooltip-value">{displayValue}</div>
        </div>
      );
    }

    // Default: render string/number value
    return <div className="tooltip-text">{displayValue}</div>;
  };

  const portalContent = createPortal(
    <div
      className={`tooltip-box tooltip-${position} ${isVisible ? "is-visible" : ""} ${className}`}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`
      }}
      role="tooltip"
    >
      <div className="tooltip-content">{renderContent()}</div>
      <div className="tooltip-arrow"></div>
    </div>,
    document.body
  );

  return (
    <div
      ref={triggerRef}
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {portalContent}
    </div>
  );
}

export default ReusableToolTip;
