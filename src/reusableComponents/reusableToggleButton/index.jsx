import "./style.scss";

export function ReusableToggleButton({
  isChecked = false,
  onChange,
  label = "",
  disabled = false,
  className = ""
}) {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!isChecked);
    }
  };

  return (
    <div
      className={`reusableToggleButtonContainer ${className} ${
        disabled ? "disabled" : ""
      }`}
    >
      {label && <span className="toggleLabel">{label}</span>}
      <div
        className={`toggleSwitch ${isChecked ? "checked" : ""}`}
        onClick={handleToggle}
        role="switch"
        aria-checked={isChecked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className="toggleThumb" />
      </div>
    </div>
  );
}

export default ReusableToggleButton;
