import "./style.scss";

export const ReusableButton = ({
  label = "Button",
  onClick,
  type = "button",
  variant = "primary", // primary | danger | secondary
  disabled = false,
  loading = false,
  className = ""
}) => {
  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={`reusable-btn reusable-btn--${variant} ${className}`}
      disabled={disabled}
      onClick={handleClick}
    >
      {loading ? (
        <span className="btn-loader"></span>
      ) : (
        <>
          <span className="btn-label">{label}</span>
        </>
      )}
    </button>
  );
};
