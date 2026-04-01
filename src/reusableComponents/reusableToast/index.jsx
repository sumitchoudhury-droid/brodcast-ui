import { useEffect, useState, useCallback } from "react";
import successToast from "../../assets/toastIcons/successToast.svg";
import failToast from "../../assets/toastIcons/failToast.svg";
import closeToast from "../../assets/commonIcons/CloseButton.svg";
import "./style.scss";

const ReusableToast = ({ type, title, message, onClose, duration = 5000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  const getIcon = () => {
    if (type === "success") {
      return (
        <div className="toastIconBox">
          <img src={successToast} alt="successToast" />
        </div>
      );
    }
    if (type === "error") {
      return (
        <div className="toastIconBox hexagon">
          <img src={failToast} alt="failToast" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`reusableToast ${type} ${isExiting ? "toastExit" : ""}`}>
      {getIcon()}
      <div className="toastContent">
        <div className="toastTitle">{title}</div>
        <div className="toastMessage">{message}</div>
      </div>
      <button className="toastCloseBtn" onClick={handleClose}>
        <img src={closeToast} alt="closeToast" width={20} height={20} />
      </button>
    </div>
  );
};

export default ReusableToast;
