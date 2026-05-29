import "./style.scss";

const allowedKeys = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End"
]);

export function ReusableInput({
  label,
  type = "text",
  name,
  value,
  placeholder = "",
  onChange,
  onBlur,
  disabled = false,
  required = false,
  error = "",
  leftIcon,
  rightIcon,
  className = "",
  Containerstyle = "",
  numbersOnly = false
}) {
  const handleKeyDown = (e) => {
    if (!numbersOnly) return;
    if (allowedKeys.has(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  return (
    <div className={`inputWrapper ${className}`}>
      {label && (
        <label className="inputLabel">
          {label} {required && <span className="required">*</span>}
        </label>
      )}

      <div
        className={`inputContainer ${error ? "inputError" : ""} ${Containerstyle}`}
      >
        {leftIcon && <span className="leftIcon">{leftIcon}</span>}

        <input
          className="inputField"
          type={type}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        {rightIcon && <span className="rightIcon">{rightIcon}</span>}
      </div>

      {error && <p className="errorText">{error}</p>}
    </div>
  );
}

export default ReusableInput;
