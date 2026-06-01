import "./style.scss";
import downloadIcon from "../../assets/commonIcons/downloadIcon.svg";
import greenDownloadIcon from "../../assets/commonIcons/greenDownloadIcon.svg";
import addIcon2 from "../../assets/boardCastTableIcons/addIcon.svg";
import editIcon from "../../assets/boardCastTableIcons/editIcon.svg";
import deleteIcon from "../../assets/boardCastTableIcons/deleteIcon.svg";
import eyeIcon from "../../assets/commonIcons/eyeIcon.svg";
import sendIcon from "../../assets/voiceTextIcons/messageIcon.svg";
import playIcon from "../../assets/voiceTextIcons/pausedIcon.svg";
import pauseIcon from "../../assets/voiceTextIcons/playIcon.svg";

export function ReusableButton({
  label = "Button",
  onClick,
  type = "button",
  variant = "primary", // primary | danger | secondary
  disabled = false,
  loading = false,
  className = "",
  downloadImage = false,
  greenDownloadImage = false,
  eyeImage = false,
  sendImage = false,
  playImage = false,
  pauseImage = false,
  addIcon = false,
  addImage2 = false,
  editImage = false,
  deleteImage = false,
  addImage
}) {
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
          {sendImage && (
            <img
              src={sendIcon}
              alt="sendIcon"
              className="icon"
              style={{ width: "20px", height: "20px" }}
            />
          )}
          {playImage && (
            <img
              src={playIcon}
              alt="playIcon"
              className="icon"
              style={{ width: "16px", height: "16px" }}
            />
          )}
          {pauseImage && (
            <img
              src={pauseIcon}
              alt="pauseIcon"
              className="icon"
              style={{ width: "16px", height: "16px" }}
            />
          )}

          {addIcon && (
            <img
              src={addImage}
              alt="addIcon"
              className="icon"
              style={{ width: "20px", height: "20px" }}
            />
          )}

          {addImage2 && (
            <img
              src={addIcon2}
              alt="addIcon"
              className="icon"
              style={{ width: "20px", height: "20px" }}
            />
          )}

          {editImage && (
            <img
              src={editIcon}
              alt="editIcon"
              className="icon"
              style={{ width: "20px", height: "20px" }}
            />
          )}

          {deleteImage && (
            <img
              src={deleteIcon}
              alt="deleteIcon"
              className="icon"
              style={{ width: "20px", height: "20px" }}
            />
          )}

          <span className="btn-label">{label}</span>
        </>
      )}
    </button>
  );
}
