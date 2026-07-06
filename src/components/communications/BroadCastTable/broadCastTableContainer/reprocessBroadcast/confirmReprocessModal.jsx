import ReusableModal from "../../../../../reusableComponents/reusableModal/index";
import "./confirmReprocessModal.scss";

function ConfirmReprocessModal({
  isOpen,
  onClose,
  onConfirm,
  patientCount,
  stats,
  reprocessDateTime
}) {
  const formattedDate = reprocessDateTime
    ? reprocessDateTime.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "-";

  const formattedTime = reprocessDateTime
    ? reprocessDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    : "-";

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

        <div className="reprocessMeta">
          <div className="metaRow">
            <span className="metaLabel">Reprocess Date: </span>
            <span className="metaValue">{formattedDate}</span>
          </div>
          <div className="metaRow">
            <span className="metaLabel">Reprocess Time: </span>
            <span className="metaValue">{formattedTime}</span>
          </div>
        </div>

        <div className="messageStatus">
          <p className="messageStatusTitle">Message Status</p>
          <div className="statusGrid">
            <div className="statusItem emailStatus">
              <span className="statusCount">{stats?.email ?? 0}</span>
              <span className="statusLabel">Email</span>
            </div>
            <div className="statusItem textStatus">
              <span className="statusCount">{stats?.text ?? 0}</span>
              <span className="statusLabel">Text</span>
            </div>
            <div className="statusItem voiceStatus">
              <span className="statusCount">{stats?.voice ?? 0}</span>
              <span className="statusLabel">Voice</span>
            </div>
          </div>
        </div>
      </div>
    </ReusableModal>
  );
}

export default ConfirmReprocessModal;
