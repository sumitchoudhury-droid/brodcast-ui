import ReactDOM from "react-dom";
import { ReusableButton } from "../resuableButton";
import CloseButton from "../../assets/commonIcons/CloseButton.svg";
import "./style.scss";

export const ReusableModal = ({
  isOpen,
  title = "Modal Title",
  children,
  onClose,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmDisabled = false
}) => {
  if (!isOpen) return null;

  const handleCancel = onCancel ?? onClose;

  return ReactDOM.createPortal(
    <div className="reusableModal">
      {/* Overlay */}
      <div className="modalOverlay" onClick={onClose} />

      {/* Modal */}
      <div className="modalContent">
        {/* Header */}
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>

          <div className="modalClose" onClick={onClose}>
            <img src={CloseButton} alt="CloseButton" />
          </div>
        </div>
        {/* Body */}
        <div className="modalBody">{children}</div>
        {/* Footer */}
        <div className="modalFooter">
          {cancelText && (
            <ReusableButton
              label={cancelText}
              variant="primary"
              onClick={handleCancel}
            />
          )}
          {confirmText && (
            <ReusableButton
              label={confirmText}
              variant="secondary"
              onClick={onConfirm}
              disabled={confirmDisabled}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReusableModal;
