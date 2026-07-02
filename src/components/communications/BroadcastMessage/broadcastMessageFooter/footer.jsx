import { useState } from "react";

import { ReusableButton } from "../../../../reusableComponents/resuableButton";
import { ReusableInput } from "../../../../reusableComponents/reusableInput/index";
import { ReusableCheckbox } from "../../../../reusableComponents/reusableCheckbox/index";
import { useToast } from "../../../../hooks/useToast";
import { ReusableModal } from "../../../../reusableComponents/reusableModal/index";
import { useBroadcastForm } from "../../broadcastFormContext";

import ReusableToolTip from "../../../../reusableComponents/reusableToolTip/index.jsx";
import externalLinkIcon from "../../../../assets/commonIcons/externalLinkIcon.svg";

const MAX_TOOLTIP_ITEMS = 9;
const buildTooltipItems = (firstItem, additionalCount) => {
  if (!additionalCount || additionalCount <= 0) return [];
  const total = 1 + additionalCount;
  const shown = Math.min(total, MAX_TOOLTIP_ITEMS);
  const items = Array.from({ length: shown }, (_, i) =>
    i === 0 ? firstItem : `${firstItem} ${i + 1}`
  );
  if (total > MAX_TOOLTIP_ITEMS) items.push(`+${total - MAX_TOOLTIP_ITEMS}`);
  return items;
};

import "./style.scss";

export default function Footer({
  onBack,
  onCancel,
  broadcastType = "immediate",
  disabled = false
}) {
  const toast = useToast();
  const { selectedEmailTemplateType } = useBroadcastForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Added state for second modal
  const [templateName, setTemplateName] = useState("");
  const [checked, setChecked] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false); // Added for collapsible section

  const handleSaveTemplate = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTemplateName("");
    setChecked(false);
  };

  const handleConfirm = () => {
    if (!templateName.trim()) {
      toast.error("Template name is required"); // Changed to error toast
      return;
    }

    toast.success("Template saved successfully");
    setIsModalOpen(false);
    setTemplateName("");
    setChecked(false);
  };

  const handleSendClick = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBroadcast = () => {
    toast.success("Broadcast confirmed and scheduled");
    setIsConfirmModalOpen(false);
    onCancel?.();
  };

  const handleCancelBroadcast = () => {
    setIsConfirmModalOpen(false);
  };

  const toggleFilterExpansion = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const getModalTitle = () => {
    switch (broadcastType) {
      case "recurring":
        return "Confirm Recurring Broadcast";
      case "scheduled":
        return "Confirm Scheduled Broadcast";
      case "out-of-business":
        return "Send Now - Out of Business Hours Alert";
      default:
        return "Confirm Immediate Broadcast";
    }
  };

  const renderConfirmBody = () => {
    if (broadcastType === "immediate") {
      return (
        <p className="confirmBroadcastModalText">
          Are you sure you want to send this broadcast now to{" "}
          <span className="bold">428 Patients</span>?
          <br />
          <br />
          This message will be delivered immediately upon confirmation.
          <br />
          <br />
          Once confirmed, this action cannot be undone.
        </p>
      );
    }
    if (broadcastType === "recurring") {
      return (
        <p className="confirmBroadcastModalText">
          Are you sure you want to start this recurring broadcast on{" "}
          <span className="bold">26 Feb 2026 at 10:30 AM</span> for{" "}
          <span className="bold">428 Patients</span>?
          <br />
          <br />
          It will repeat every Tuesday until 30th April 2026.
          <br />
          <br />
          Once confirmed, this action cannot be undone.
        </p>
      );
    }
    if (broadcastType === "scheduled") {
      return (
        <p className="confirmBroadcastModalText">
          Are you sure you want to schedule this broadcast for{" "}
          <span className="bold">26 Feb 2026 at 10:30 AM</span> to{" "}
          <span className="bold">428 Patients</span>?
          <br />
          <br />
          Once confirmed, this action cannot be undone.
        </p>
      );
    }
    if (broadcastType === "out-of-business") {
      return (
        <p className="confirmBroadcastModalText">
          This broadcast will be delivered outside of business hours and may
          reach patients at late hours.
          <br />
          Are you sure you want to send this broadcast now to{" "}
          <span className="bold">428 Patients</span>? This message will be
          delivered immediately upon confirmation.
        </p>
      );
    }
    // default: "immediate-invalid"
    return (
      <>
        <p className="confirmBroadcastModalText">
          <span className="bold">Out of 428 patients, 8 </span>
          have invalid contact records and will be excluded. Do you wish to
          proceed?
        </p>
        <div className="viewInvalidPatients">
          <p>View Invalid Patients</p>
          <img
            src={externalLinkIcon}
            alt="External link icon"
            className="externalLinkIcon"
          />
        </div>
      </>
    );
  };

  return (
    <>
      {/* Footer Buttons */}
      <div className="footer">
        <div className="buttonBlock">
          <ReusableButton label="Back" variant="primary" onClick={onBack} />

          <ReusableButton
            label={
              selectedEmailTemplateType === "blank"
                ? "Save Template"
                : "Save as Template"
            }
            variant="secondary"
            onClick={handleSaveTemplate}
            disabled={disabled}
          />
        </div>

        <div className="buttonBlock">
          <ReusableButton label="Cancel" variant="primary" onClick={onCancel} />

          <ReusableButton
            label="Send"
            variant="secondary"
            onClick={handleSendClick}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Save Template Modal */}
      <ReusableModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Save as New"
        confirmText="Save"
        cancelText="Cancel"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        onConfirm={handleConfirm}
        onCancel={handleCloseModal}
      >
        <div className="saveTemplateContent">
          <ReusableInput
            label="Template Name"
            name="templateName"
            type="text"
            placeholder="Enter Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            required
          />
          <ReusableCheckbox
            label="Publish in Library"
            name="Publish in Library"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        </div>
      </ReusableModal>

      {/* Confirm Broadcast Modal */}
      <ReusableModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelBroadcast}
        title={getModalTitle()}
        confirmText="Confirm & Schedule"
        cancelText="Back to Editing"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        onConfirm={handleConfirmBroadcast}
        onCancel={handleCancelBroadcast}
      >
        <div className="confirmBroadcastModal">
          {renderConfirmBody()}

          {/* Patient Filter Summary Section */}
          <div className="patientFilterSummary">
            <div
              className="filterSummaryHeader"
              onClick={toggleFilterExpansion}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && toggleFilterExpansion()}
              aria-expanded={isFilterExpanded}
            >
              <p>Patient Filter Summary</p>
              <svg
                className={`chevronIcon ${isFilterExpanded ? "expanded" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 15L12 9L18 15"
                  stroke="#606E80"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div
              className={`filterSummaryContent ${isFilterExpanded ? "expanded" : ""}`}
            >
              {/* Total Patients */}
              <div className="Section">
                <div className="filterSection">
                  <p className="filterLabel">Total Patients</p>
                  <div className="filterValue">
                    <p>428</p>
                    <img
                      src={externalLinkIcon}
                      alt="External link icon"
                      className="externalLinkIcon"
                    />
                  </div>
                </div>

                {/* Appointment Type */}
                <div className="filterSection">
                  <p className="filterLabel">Appointment Type</p>
                  <div className="filterValue">
                    <p>BPC-A Blood Pressure Check</p>
                    <ReusableToolTip
                      content={buildTooltipItems(
                        "BPC-A Blood Pressure Check",
                        111
                      )}
                      position="top"
                    >
                      <div className="badge" style={{ cursor: "pointer" }}>
                        +111
                      </div>
                    </ReusableToolTip>
                  </div>
                </div>
              </div>

              <div className="Section">
                {/* Location */}
                <div className="filterSection">
                  <p className="filterLabel">Location</p>
                  <div className="filterValue">
                    <p>
                      Eastside Urgent Care, Riverbend Urgent Care, Greenwood
                      Health Clinic, Maplewood Family Practice,
                    </p>
                    <ReusableToolTip
                      content={buildTooltipItems("Eastside Urgent Care", 6)}
                      position="top"
                    >
                      <div className="badge" style={{ cursor: "pointer" }}>
                        +6
                      </div>
                    </ReusableToolTip>
                  </div>
                </div>

                {/* Provider */}
                <div className="filterSection">
                  <p className="filterLabel">Provider</p>
                  <div className="filterValue">
                    <p>Barbara Phillips, Olivia Smith</p>
                    <ReusableToolTip
                      content={buildTooltipItems("Barbara Phillips", 12)}
                      position="top"
                    >
                      <div className="badge" style={{ cursor: "pointer" }}>
                        +12
                      </div>
                    </ReusableToolTip>
                  </div>
                </div>
              </div>

              <div className="Section">
                {/* Age */}
                <div className="filterSection">
                  <p className="filterLabel">Age</p>
                  <div className="filterValue">
                    <p>Greater than 45 years 0 months</p>
                  </div>
                </div>

                {/* Gender */}
                <div className="filterSection">
                  <p className="filterLabel">Gender</p>
                  <div className="filterValue">
                    <p>All</p>
                  </div>
                </div>
              </div>

              <div className="Section">
                {/* Appointment Start Date/Time */}
                <div className="filterSection">
                  <p className="filterLabel">Appointment Start Date / Time</p>
                  <div className="filterValue">
                    <p>2/15/2026, 9:45:00 AM</p>
                  </div>
                </div>

                {/* Appointment End Date/Time */}
                <div className="filterSection">
                  <p className="filterLabel">Appointment End Date / Time</p>
                  <div className="filterValue">
                    <p>2/15/2026, 9:45:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ReusableModal>
    </>
  );
}
