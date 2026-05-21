import ReusableModal from "../../../../../reusableComponents/reusableModal/index";
import "./confirmReprocessModal.scss";

function ConfirmReprocessModal({ isOpen, onClose, onConfirm, patientCount }) {
  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Reprocess"
      cancelText="Cancel"
      confirmText="Confirm"
    >
      <div className="confirmReprocessBody">
        <p className="confirmText">
          Are you sure you want to{" "}
          <strong>reprocess this broadcast for {patientCount} patients?</strong>
        </p>
        <p className="subText">
          The system will retry sending the message to the applicable
          recipients.
        </p>
      </div>
    </ReusableModal>
  );
}

export default ConfirmReprocessModal;
