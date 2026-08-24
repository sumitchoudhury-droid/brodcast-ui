import "./style.scss";

import emptyBox from "../../assets/commonIcons/emptyBox.svg";
import checkedBox from "../../assets/commonIcons/checkedBox.svg";
import partialCheckedBox from "../../assets/commonIcons/partialCheckedBox.svg";

export function ReusableCheckbox({
  label,
  name,
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  error = "",
  className = ""
}) {
  const getIcon = () => {
    if (indeterminate) return partialCheckedBox;
    if (checked) return checkedBox;
    return emptyBox;
  };

  const getAlt = () => {
    if (indeterminate) return "partially checked";
    if (checked) return "checked";
    return "unchecked";
  };

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

        <img src={getIcon()} alt={getAlt()} className="checkboxIcon" />

        {label && <span className="checkboxLabel">{label}</span>}
      </label>

      {error && <p className="checkboxError">{error}</p>}
    </div>
  );
}
