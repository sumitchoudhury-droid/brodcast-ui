import "./style.scss";

export function ReusableRadioButton({
  label,
  value,
  name,
  checked,
  onChange,
  disabled = false,
  className = ""
}) {
  return (
    <label
      className={`reusableRadio ${checked ? "is-checked" : ""} ${disabled ? "is-disabled" : ""} ${className}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
      />
      <span className="radioCustom"></span>
      <span className="radioLabel">{label}</span>
    </label>
  );
}

export default ReusableRadioButton;
