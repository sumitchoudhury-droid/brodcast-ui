import "./style.scss";
import downloadIcon from "../../assets/commonIcons/downloadIcon.svg";
import greenDownloadIcon from "../../assets/commonIcons/greenDownloadIcon.svg";
import eyeIcon from "../../assets/commonIcons/eyeIcon.svg";
export const ReusableButton = ({
  label = "Button",
  onClick,
  type = "button",
  variant = "primary", // primary | danger | secondary
  disabled = false,
  loading = false,
  className = "",
  downloadImage = false,
  greenDownloadImage = false,
  eyeImage = false
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
          {downloadImage && (
            <img
              src={downloadIcon}
              alt="downloadIcon"
              className="icon"
              style={{ width: "20px", height: "20px" }}
            />
          )}
          {greenDownloadImage && (
            <img
              src={greenDownloadIcon}
              alt="greenDownloadIcon"
              className="icon"
              style={{ width: "20px", height: "20px" }}
            />
          )}
          {eyeImage && (
            <img
              src={eyeIcon}
              alt="eyeIcon"
              className="icon"
              style={{ width: "20px", height: "20px" }}
            />
          )}
          <span className="btn-label">{label}</span>
        </>
      )}
    </button>
  );
};
