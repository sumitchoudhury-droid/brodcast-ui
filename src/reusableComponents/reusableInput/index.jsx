import "./style.scss";

export const ReusableInput = ({
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
  className = ""
}) => {
  return (
    <div className={`inputWrapper ${className}`}>
      {label && (
        <label className="inputLabel">
          {label} {required && <span className="required">*</span>}
        </label>
      )}

      <div className={`inputContainer ${error ? "inputError" : ""}`}>
        {leftIcon && <span className="leftIcon">{leftIcon}</span>}

        <input
          className="inputField"
          type={type}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
        />

        {rightIcon && <span className="rightIcon">{rightIcon}</span>}
      </div>

      {error && <p className="errorText">{error}</p>}
    </div>
  );
};
