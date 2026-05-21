import ReactDOM from "react-dom";
import { ReusableButton } from "../resuableButton";
import CloseButton from "../../assets/commonIcons/CloseButton.svg";
import "./style.scss";

export const ReusableRightDrawer = ({
  isOpen,
  onClose,
  title = "",
  children,
  width = "600px",
  showCloseBtn = true,
  closeOnOverlayClick = true,
  footer,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmDisabled = false,
  cancelDisabled = false,
  confirmLoading = false,
  cancelLoading = false,
  className = ""
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && onClose) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className="drawerOverlay" onClick={handleOverlayClick}>
      <div
        className={`drawerContainer ${className}`}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawerHeader">
          <div className="headerTitle">
            {typeof title === "string" ? <h2>{title}</h2> : title}
          </div>
          {showCloseBtn && (
            <button
              className="drawerCloseBtn"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <img src={CloseButton} alt="Close" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="drawerContent">{children}</div>

        {/* Footer Area */}
        {(footer !== undefined || onConfirm || onCancel) && (
          <div className="drawerFooter">
            {footer !== undefined ? (
              footer
            ) : (
              <div className="drawerFooterBtn">
                {onCancel && (
                  <ReusableButton
                    label={cancelText}
                    variant="primary"
                    onClick={onCancel}
                    disabled={cancelDisabled}
                    loading={cancelLoading}
                  />
                )}
                {onConfirm && (
                  <ReusableButton
                    label={confirmText}
                    variant="secondary"
                    onClick={onConfirm}
                    disabled={confirmDisabled}
                    loading={confirmLoading}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ReusableRightDrawer;
