import { ReusableButton } from "../resuableButton";
import CloseButton from "../../assets/commonIcons/CloseButton.svg";
import "./style.scss";

export const ReusableModal = ({
  isOpen,
  title = "Modal Title",
  children,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
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
          <ReusableButton
            label={cancelText}
            variant="primary"
            onClick={onClose}
          />
          <ReusableButton
            label={confirmText}
            variant="secondary"
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
};
