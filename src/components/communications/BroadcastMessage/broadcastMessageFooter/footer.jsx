import { useState } from "react";

import { ReusableButton } from "../../../../reusableComponents/resuableButton";
import { ReusableInput } from "../../../../reusableComponents/reusableInput/index";
import { ReusableCheckbox } from "../../../../reusableComponents/reusableCheckbox/index";
import { useToast } from "../../../../hooks/useToast";
import { ReusableModal } from "../../../../reusableComponents/reusableModal/index";

import externalLinkIcon from "../../../../assets/commonIcons/externalLinkIcon.svg";

import "./style.scss";

export default function Footer({ onBack }) {
  const toast = useToast();
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
  };

  const handleCancelBroadcast = () => {
    setIsConfirmModalOpen(false);
  };

  const toggleFilterExpansion = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  return (
    <>
      {/* Footer Buttons */}
      <div className="footer">
        <div className="buttonBlock">
          <ReusableButton label="Back" variant="primary" onClick={onBack} />

          <ReusableButton
            label="Save as Template"
            variant="secondary"
            onClick={handleSaveTemplate}
          />
        </div>

        <div className="buttonBlock">
          <ReusableButton
            label="Cancel"
            variant="primary"
            onClick={() => console.log("Cancel")}
          />

          <ReusableButton
            label="Send"
            variant="secondary"
            onClick={handleSendClick} // Changed to open confirmation modal
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
        title="Confirm Immediate Broadcast"
        confirmText="Confirm & Schedule"
        cancelText="Back to Editing"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        onConfirm={handleConfirmBroadcast}
        onCancel={handleCancelBroadcast}
      >
        <div className="confirmBroadcastModal">
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
                    <div className="badge">+111</div>
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
                    <div className="badge">+6</div>
                  </div>
                </div>

                {/* Provider */}
                <div className="filterSection">
                  <p className="filterLabel">Provider</p>
                  <div className="filterValue">
                    <p>Barbara Phillips, Olivia Smith</p>
                    <div className="badge">+12</div>
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
