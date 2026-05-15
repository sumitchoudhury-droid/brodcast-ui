import "./style.scss";

export function ReusableCheckbox({
  label,
  name,
  checked = false,
  onChange,
  disabled = false,
  error = "",
  className = ""
}) {
  return (
    <div className={`checkboxWrapper ${className}`}>
      <label className={`checkboxContainer ${disabled ? "disabled" : ""}`}>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          readOnly={!onChange}
          disabled={disabled}
          className="checkboxInput"
        />

        <span className="customCheckbox"></span>

        {label && <span className="checkboxLabel">{label}</span>}
      </label>

      {error && <p className="checkboxError">{error}</p>}
    </div>
  );
}
