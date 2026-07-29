import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ReusableButton } from "../../../../reusableComponents/resuableButton";
import { ReusableInput } from "../../../../reusableComponents/reusableInput/index";
import { ReusableCheckbox } from "../../../../reusableComponents/reusableCheckbox/index";
import { useToast } from "../../../../hooks/useToast";
import { ReusableModal } from "../../../../reusableComponents/reusableModal/index";
import { useBroadcastForm } from "../../broadcastFormContext";
import { usePost } from "../../../../hooks/usePost";
import { ENDPOINTS } from "../../../../api/endpoints.js";
import ReusableToolTip from "../../../../reusableComponents/reusableToolTip/index.jsx";
import { prepareHtmlForEmail } from "../../../../utils/prepareHtmlForEmail";
// import externalLinkIcon from "../../../../assets/commonIcons/externalLinkIcon.svg";

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const buildTooltipContent = (labels) =>
  labels.length > 10
    ? [...labels.slice(0, 10), `+${labels.length - 10} more`]
    : labels;
const sendModeMap = { 1: "Immediately", 2: "NotifyLater", 3: "Recurring" };
const patientSelectionTypeMap = {
  targetRecipients: "TargetRecipients",
  oneTimeBroadcast: "OneTimeBroadcast",
  uploadFile: "UploadFile"
};

import "./style.scss";

export default function Footer({
  onBack,
  onCancel,
  disabled = false,
  hasChanges = false,
  editorRef,
  textEditorInstanceRef
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const {
    selectedEmailTemplateType,
    scheduleStartDateTime,
    sendType,
    selectedModes,
    newTemplateName,
    mailSubject,
    selectedTemplateData,
    categoryLabel,
    priorityLabel,
    scheduleEndDateTime,
    frequency,
    patientType,
    appointmentType,
    appointmentTypeLabels,
    location,
    locationLabels,
    provider,
    providerLabels,
    patientStartDateTime,
    patientEndDateTime,
    includeOptOut,
    ageFilter,
    ageYear,
    ageMonth,
    gender,
    modality
  } = useBroadcastForm();
  const { mutate: saveTemplate, isPending: isSaving } = usePost(
    ENDPOINTS.templates.CREATE
  );
  const { mutate: branchTemplate, isPending: isBranching } = usePost(
    selectedTemplateData?.id
      ? ENDPOINTS.templates.BRANCH(selectedTemplateData.id)
      : ""
  );
  const { mutate: sendBroadcast, isPending: isSending } = usePost(
    ENDPOINTS.broadcastSchedule.CREATE
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Added state for second modal
  const [templateName, setTemplateName] = useState("");
  const [checked, setChecked] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false); // Added for collapsible section

  const handleSaveTemplate = () => {
    setTemplateName(newTemplateName || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTemplateName("");
    setChecked(false);
  };

  const handleConfirm = () => {
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }

    const rawMailBody =
      editorRef?.current?.getCompiledHtml?.() ||
      editorRef?.current?.getHtml?.() ||
      "";
    const mailBody = rawMailBody ? prepareHtmlForEmail(rawMailBody) : "";
    const smsBody = textEditorInstanceRef?.current?.getHtml?.() || "";
    const mailAttachments = editorRef?.current?.getAttachments?.() || [];

    const channels = selectedModes
      .map((mode) => {
        const lowerMode = mode.toLowerCase();
        if (lowerMode === "mail") {
          return {
            methodType: "Mail",
            templateBody: mailBody,
            subjectLine: mailSubject || null,
            smsStandardText: null,
            attachments: mailAttachments
          };
        }
        if (lowerMode === "sms") {
          return {
            methodType: "SMS",
            templateBody: smsBody,
            subjectLine: null,
            smsStandardText: smsBody,
            attachments: []
          };
        }
        if (lowerMode === "voice") {
          return {
            methodType: "Voice",
            templateBody: "",
            subjectLine: null,
            smsStandardText: null,
            attachments: []
          };
        }
        return null;
      })
      .filter(Boolean);

    const body = {
      name: templateName,
      templateBody: mailBody || smsBody,
      subjectLine: mailSubject || null,
      smsStandardText: smsBody || null,
      messageTempLibId: null,
      actionItemTypeId: 1,
      actionItemTypeName: "Appointment Reminder",
      createdBy: "admin@example.com",
      channels
    };

    console.log("Before saveTemplate");

    saveTemplate(body, {
      onSuccess: (res) => {
        toast.success(res?.message || res?.data?.message);
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        setIsModalOpen(false);
        setTemplateName("");
        setChecked(false);
      }
    });

    console.log("After saveTemplate");
  };

  const handleSaveBranch = () => {
    if (!selectedTemplateData?.id) return;

    const rawMailBody =
      editorRef?.current?.getCompiledHtml?.() ||
      editorRef?.current?.getHtml?.() ||
      "";
    const mailBody = rawMailBody ? prepareHtmlForEmail(rawMailBody) : "";
    const smsBody = textEditorInstanceRef?.current?.getHtml?.() || "";
    const mailAttachments = editorRef?.current?.getAttachments?.() || [];

    const channels = selectedModes
      .map((mode) => {
        const lowerMode = mode.toLowerCase();
        if (lowerMode === "mail") {
          return {
            methodType: "Mail",
            templateBody: mailBody,
            subjectLine: mailSubject || null,
            smsStandardText: null,
            attachments: mailAttachments
          };
        }
        if (lowerMode === "sms") {
          return {
            methodType: "SMS",
            templateBody: smsBody,
            subjectLine: null,
            smsStandardText: smsBody,
            attachments: []
          };
        }
        if (lowerMode === "voice") {
          return {
            methodType: "Voice",
            templateBody: "",
            subjectLine: null,
            smsStandardText: null,
            attachments: []
          };
        }
        return null;
      })
      .filter(Boolean);

    const body = {
      name: newTemplateName || selectedTemplateData?.name || "",
      templateType: "OVERRIDE",
      templateBody: mailBody || smsBody,
      subjectLine: mailSubject || null,
      smsStandardText: smsBody || null,
      messageTempLibId: null,
      channels
    };

    branchTemplate(body, {
      onSuccess: (res) => {
        toast.success(
          res?.message || res?.data?.message || "Template saved successfully"
        );
        queryClient.invalidateQueries({ queryKey: ["templates"] });
      }
    });
  };

  const handleSendClick = () => {
    setIsConfirmModalOpen(true);
  };

  const isOffBusinessHours = (date) => {
    if (!date) return false;
    const hours = new Date(date).getHours();
    return hours >= 18 || hours < 6;
  };

  const isOffBusiness =
    sendType !== "immediately" && isOffBusinessHours(scheduleStartDateTime);

  const handleConfirmBroadcast = () => {
    const payload = {
      channels: selectedModes,
      category: categoryLabel,
      priority: priorityLabel,
      templateId: selectedTemplateData?.id ?? null,
      templateType: selectedTemplateData?.templateType ?? null,
      patientSelectionType: patientSelectionTypeMap[patientType] ?? patientType,
      ...(patientType === "targetRecipients" && {
        targetRecipientCriteria: {
          appointmentTypeIds: toArray(appointmentType),
          locationIds: toArray(location),
          providerIds: toArray(provider),
          appointmentStartDateTime: patientStartDateTime
            ? new Date(patientStartDateTime).toISOString()
            : null,
          appointmentEndDateTime: patientEndDateTime
            ? new Date(patientEndDateTime).toISOString()
            : null,
          includeOptOutPatients: includeOptOut,
          ageCriteriaId: ageFilter || null,
          ageYears: ageYear ? Number(ageYear) : null,
          ageMonths: ageMonth ? Number(ageMonth) : null,
          genderId: gender || null,
          modalityId: modality || null
        }
      }),
      sendMode: sendModeMap[sendType] ?? "Immediately",
      startDtTm: scheduleStartDateTime
        ? new Date(scheduleStartDateTime).toISOString()
        : new Date().toISOString(),
      createdById: 9
    };

    sendBroadcast(payload, {
      onSuccess: (res) => {
        toast.success(
          res?.message ||
            res?.data?.message ||
            "Broadcast confirmed and scheduled"
        );
        setIsConfirmModalOpen(false);
        onCancel?.();
      }
    });
  };

  const handleCancelBroadcast = () => {
    setIsConfirmModalOpen(false);
  };

  const toggleFilterExpansion = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const getModalTitle = () => {
    if (isOffBusiness) return "Send Now - Out of Business Hours Alert";
    switch (sendType) {
      case 3:
        return "Confirm Recurring Broadcast";
      case 2:
        return "Confirm Scheduled Broadcast";
      default:
        return "Confirm Immediate Broadcast";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(new Date(date));
  };

  const renderConfirmBody = () => {
    if (isOffBusiness) {
      return (
        <p className="confirmBroadcastModalText">
          This broadcast will be delivered outside of business hours and may{" "}
          <span className="bold">reach patients at late hours.</span>
          <br />
          <br />
          Are you sure you want to{" "}
          <span className="bold">send this broadcast now?</span> This message
          will be delivered immediately upon confirmation.
        </p>
      );
    }
    if (sendType === 3) {
      return (
        <p className="confirmBroadcastModalText">
          Are you sure you want to start this recurring broadcast on{" "}
          <span className="bold">{formatDate(scheduleStartDateTime)}</span>?
          <br />
          <br />
          It will repeat {frequency?.toLowerCase()}{" "}
          {scheduleEndDateTime ? (
            <>
              until{" "}
              <span className="bold">{formatDate(scheduleEndDateTime)}</span>
            </>
          ) : (
            "with no end date"
          )}
          .
          <br />
          <br />
          Once confirmed, this action cannot be undone.
        </p>
      );
    }
    if (sendType === 2) {
      return (
        <p className="confirmBroadcastModalText">
          Are you sure you want to schedule this broadcast for{" "}
          <span className="bold">{formatDate(scheduleStartDateTime)}</span>?
          <br />
          <br />
          Once confirmed, this action cannot be undone.
        </p>
      );
    }
    return (
      <p className="confirmBroadcastModalText">
        Are you sure you want to send this broadcast now?
        <br />
        <br />
        This message will be delivered immediately upon confirmation.
        <br />
        <br />
        Once confirmed, this action cannot be undone.
      </p>
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
          {selectedEmailTemplateType !== "blank" && (
            <ReusableButton
              label={isBranching ? "Saving…" : "Save"}
              variant="secondary"
              onClick={handleSaveBranch}
              disabled={disabled || !hasChanges || isBranching}
            />
          )}
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
        confirmText={isSaving ? "Saving…" : "Save"}
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
        confirmText={isSending ? "Scheduling…" : "Confirm & Schedule"}
        confirmDisabled={isSending}
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
                    <p>—</p>
                    {/* <img
                      src={externalLinkIcon}
                      alt="External link icon"
                      className="externalLinkIcon"
                    /> */}
                  </div>
                </div>

                {/* Appointment Type */}
                <div className="filterSection">
                  <p className="filterLabel">Appointment Type</p>
                  <div className="filterValue">
                    <p>{appointmentTypeLabels[0] || "—"}</p>
                    {appointmentTypeLabels.length > 1 && (
                      <ReusableToolTip
                        content={buildTooltipContent(appointmentTypeLabels)}
                        position="top"
                      >
                        <div className="badge" style={{ cursor: "pointer" }}>
                          +{appointmentTypeLabels.length - 1}
                        </div>
                      </ReusableToolTip>
                    )}
                  </div>
                </div>
              </div>

              <div className="Section">
                {/* Location */}
                <div className="filterSection">
                  <p className="filterLabel">Location</p>
                  <div className="filterValue">
                    <p>{locationLabels[0] || "—"}</p>
                    {locationLabels.length > 1 && (
                      <ReusableToolTip
                        content={buildTooltipContent(locationLabels)}
                        position="top"
                      >
                        <div className="badge" style={{ cursor: "pointer" }}>
                          +{locationLabels.length - 1}
                        </div>
                      </ReusableToolTip>
                    )}
                  </div>
                </div>

                {/* Provider */}
                <div className="filterSection">
                  <p className="filterLabel">Provider</p>
                  <div className="filterValue">
                    <p>{providerLabels[0] || "—"}</p>
                    {providerLabels.length > 1 && (
                      <ReusableToolTip
                        content={buildTooltipContent(providerLabels)}
                        position="top"
                      >
                        <div className="badge" style={{ cursor: "pointer" }}>
                          +{providerLabels.length - 1}
                        </div>
                      </ReusableToolTip>
                    )}
                  </div>
                </div>
              </div>

              <div className="Section">
                {/* Appointment Start Date/Time */}
                <div className="filterSection">
                  <p className="filterLabel">Appointment Start Date / Time</p>
                  <div className="filterValue">
                    <p>
                      {patientStartDateTime
                        ? new Date(patientStartDateTime).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Appointment End Date/Time */}
                <div className="filterSection">
                  <p className="filterLabel">Appointment End Date / Time</p>
                  <div className="filterValue">
                    <p>
                      {patientEndDateTime
                        ? new Date(patientEndDateTime).toLocaleString()
                        : "—"}
                    </p>
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
