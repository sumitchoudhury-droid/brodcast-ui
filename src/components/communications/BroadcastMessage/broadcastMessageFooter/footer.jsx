import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

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
import { htmlToSmsText } from "../../../../utils/htmlToSmsText";
// import externalLinkIcon from "../../../../assets/commonIcons/externalLinkIcon.svg";

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
// Empty UI selection means "no filter" — send every option instead.
const effectiveIds = (selected, all) => {
  const arr = toArray(selected);
  return arr.length > 0 ? arr : all;
};
// Preserve the wall-clock time the user picked — toISOString() would shift it to UTC
const toLocalISOString = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
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
    category,
    priority,
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
    allAppointmentTypeIds,
    allLocationIds,
    allProviderIds,
    broadcastStartDate,
    patientStartDateTime,
    patientEndDateTime,
    includeOptOut,
    ageFilter,
    ageYear,
    ageMonth,
    gender,
    modality,
    uploadedFile,
    setMailSubjectError,
    totalPatientsFound,
    isEmailEditorEmpty,
    isSmsEditorEmpty
  } = useBroadcastForm();
  const { mutate: saveTemplate, isPending: isSaving } = usePost(
    ENDPOINTS.templates.CREATE
  );
  const { mutate: saveEnterpriseTemplate, isPending: isSavingEnterprise } =
    usePost(ENDPOINTS.templates.CREATE_ENTERPRISE);
  const { mutate: branchTemplate, isPending: isBranching } = usePost(
    selectedTemplateData?.id
      ? ENDPOINTS.templates.BRANCH(selectedTemplateData.id)
      : ""
  );
  const { mutate: sendBroadcast, isPending: isSending } = usePost(
    ENDPOINTS.broadcastSchedule.CREATE
  );
  const {
    mutate: sendCustomRecipientsBroadcast,
    isPending: isSendingCustomRecipients
  } = usePost(ENDPOINTS.broadcastSchedule.CUSTOM_RECIPIENTS_UPLOAD);
  const { mutate: saveTemplateConfig, isPending: isSavingTemplateConfig } =
    usePost(ENDPOINTS.broadcastConfig.TEMPLATE_CONFIGURATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Added state for second modal
  const [templateName, setTemplateName] = useState("");
  const [checked, setChecked] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false); // Added for collapsible section

  const isMailMode = selectedModes.some((m) => m?.toLowerCase() === "mail");
  const isSmsMode = selectedModes.some((m) => m?.toLowerCase() === "sms");

  const hasMailContent = !isEmailEditorEmpty;
  const hasSmsContent = !isSmsEditorEmpty;

  const isSaveTemplateDisabled =
    isMailMode && isSmsMode ? !hasMailContent && !hasSmsContent : disabled;

  const isBroadcastInFlight =
    isSending ||
    isSendingCustomRecipients ||
    isSaving ||
    isSavingEnterprise ||
    isBranching ||
    isSavingTemplateConfig;

  const isSaveTemplateInFlight =
    isSaving || isSavingEnterprise || isSavingTemplateConfig;

  const validateMailSubject = () => {
    if (!isMailMode) return true;
    if (!mailSubject || !mailSubject.trim()) {
      setMailSubjectError(true);
      toast.error("Please enter Email Subject to continue");
      return false;
    }
    setMailSubjectError(false);
    return true;
  };

  const handleSaveTemplate = () => {
    if (isMailMode && isSmsMode) {
      if (hasMailContent && !hasSmsContent) {
        toast.error("No SMS content found. Add content to save template");
        return;
      }
      if (!hasMailContent && hasSmsContent) {
        toast.error("No Email content found. Add content to save template");
        return;
      }
    }
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
    const smsBody = htmlToSmsText(
      textEditorInstanceRef?.current?.getHtml?.() || ""
    );
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
      actionItemTypeId: 60,
      actionItemTypeName: "Broadcast Message Notification",
      createdBy: "admin@example.com",
      channels,
      ...(checked ? { templateType: "ENTERPRISE" } : {})
    };

    const mutation = checked ? saveEnterpriseTemplate : saveTemplate;
    mutation(body, {
      onSuccess: (res) => {
        toast.success(res?.message || res?.data?.message);
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        setIsModalOpen(false);
        setTemplateName("");
        setChecked(false);

        const templateId = res?.data?.messageTemplateLibId ?? res?.data?.id;
        if (templateId) {
          saveTemplateConfig(buildTemplateConfigPayload(templateId));
        }
      }
    });
  };

  const buildTemplateConfigPayload = (templateId) => ({
    templateId,
    category:
      category !== undefined && category !== null && category !== "select"
        ? String(category)
        : "",
    priority:
      priority !== undefined && priority !== null ? String(priority) : "",
    methodType: selectedModes.join(","),
    patientSelection: patientSelectionTypeMap[patientType] ?? patientType,
    appointmentTypeIds: effectiveIds(appointmentType, allAppointmentTypeIds),
    locationIds: effectiveIds(location, allLocationIds),
    providerIds: effectiveIds(provider, allProviderIds),
    ageCriteriaId: ageFilter || null,
    ageYears: ageYear ? Number(ageYear) : null,
    ageMonths: ageMonth ? Number(ageMonth) : null,
    genderId: gender && gender !== "all" ? gender : null,
    modalityIds: Array.isArray(modality)
      ? modality.filter(Boolean)
      : modality
        ? [modality]
        : [],
    appointmentStartDateTime: patientStartDateTime
      ? new Date(patientStartDateTime).toISOString()
      : null,
    appointmentEndDateTime: patientEndDateTime
      ? new Date(patientEndDateTime).toISOString()
      : null,
    oneTimeBroadcastDate:
      patientType === "oneTimeBroadcast" && broadcastStartDate
        ? new Date(broadcastStartDate).toISOString()
        : null,
    includeOptOutPatients: includeOptOut,
    scheduleType: sendModeMap[sendType] ?? "Immediately",
    scheduleDateTime:
      sendType !== 1 && scheduleStartDateTime
        ? toLocalISOString(scheduleStartDateTime)
        : null,
    recurrenceConfig: null,
    createdById: 9
  });

  const handleSaveBranch = () => {
    if (!selectedTemplateData?.id) return;

    const rawMailBody =
      editorRef?.current?.getCompiledHtml?.() ||
      editorRef?.current?.getHtml?.() ||
      "";
    const mailBody = rawMailBody ? prepareHtmlForEmail(rawMailBody) : "";
    const smsBody = htmlToSmsText(
      textEditorInstanceRef?.current?.getHtml?.() || ""
    );
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

        const newTemplateId = res?.data?.newTemplateId;
        if (newTemplateId) {
          saveTemplateConfig(buildTemplateConfigPayload(newTemplateId));
        }
      }
    });
  };

  const handleSendClick = () => {
    if (!validateMailSubject()) return;
    setIsConfirmModalOpen(true);
  };

  const isOffBusinessHours = (date) => {
    if (!date) return false;
    const hours = new Date(date).getHours();
    return hours >= 18 || hours < 6;
  };

  const isOffBusiness =
    sendType !== "immediately" && isOffBusinessHours(scheduleStartDateTime);

  const buildBroadcastPayload = (templateId) => ({
    channels: selectedModes,
    category: categoryLabel,
    priority: priorityLabel,
    templateId: templateId ?? null,
    templateType: selectedTemplateData?.templateType ?? null,
    patientSelectionType: patientSelectionTypeMap[patientType] ?? patientType,
    ...(patientType === "targetRecipients" && {
      targetRecipientCriteria: {
        appointmentTypeIds: effectiveIds(
          appointmentType,
          allAppointmentTypeIds
        ),
        locationIds: effectiveIds(location, allLocationIds),
        providerIds: effectiveIds(provider, allProviderIds),
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
    startDtTm: toLocalISOString(scheduleStartDateTime ?? new Date()),
    createdById: 9
  });

  const runSendBroadcast = (templateId) => {
    sendBroadcast(buildBroadcastPayload(templateId), {
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

  const toIsoDateOnly = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      const y = String(parsed.y).padStart(4, "0");
      const m = String(parsed.m).padStart(2, "0");
      const d = String(parsed.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    const str = String(value).trim();
    const parts = str.split("/");
    if (parts.length === 3) {
      const [mm, dd, yyyy] = parts;
      return `${yyyy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return str;
  };

  const parseUploadedRecipients = (file) =>
    new Promise((resolve, reject) => {
      if (!file) {
        resolve([]);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), {
            type: "array"
          });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
          const recipients = rows.map((r) => {
            const balance = r["Balance Amount ($)"];
            return {
              firstName: r["Patient First Name"] ?? "",
              lastName: r["Patient Last Name"] ?? "",
              dateOfBirth: toIsoDateOnly(r["Date of Birth (MM/DD/YYYY)"]),
              phoneNumber:
                r["Mobile Number"] !== undefined && r["Mobile Number"] !== ""
                  ? String(r["Mobile Number"])
                  : "",
              emailAddress: r["Email"] ?? "",
              balanceAmount:
                balance === "" || balance === null || balance === undefined
                  ? null
                  : Number(balance),
              isOptedOutEmail: false,
              isOptedOutSms: false
            };
          });
          resolve(recipients);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  const buildChannelsFromEditors = () => {
    const rawMailBody =
      editorRef?.current?.getCompiledHtml?.() ||
      editorRef?.current?.getHtml?.() ||
      "";
    const mailBody = rawMailBody ? prepareHtmlForEmail(rawMailBody) : "";
    const smsBody = htmlToSmsText(
      textEditorInstanceRef?.current?.getHtml?.() || ""
    );
    const mailAttachments = editorRef?.current?.getAttachments?.() || [];

    return selectedModes
      .map((mode) => {
        const lowerMode = mode.toLowerCase();
        if (lowerMode === "mail") {
          return {
            methodType: "Mail",
            subjectLine: mailSubject || null,
            templateBody: mailBody,
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
  };

  const buildCustomRecipientsPayload = ({
    templateId,
    newTemplate,
    recipients,
    fileName
  }) => ({
    fileName,
    patientSelectionType: patientSelectionTypeMap[patientType] ?? patientType,
    channels: selectedModes,
    category: categoryLabel,
    priority: priorityLabel,
    templateId: templateId ?? 0,
    ...(newTemplate ? { newTemplate } : {}),
    sendMode: sendModeMap[sendType] ?? "Immediately",
    startDtTm: scheduleStartDateTime
      ? new Date(scheduleStartDateTime).toISOString()
      : new Date().toISOString(),
    createdById: 9,
    broadcastSource: "Balance Payment Reminder",
    recipients
  });

  const runSendCustomRecipientsBroadcast = async () => {
    let recipients = [];
    try {
      recipients = await parseUploadedRecipients(uploadedFile);
    } catch {
      toast.error("Failed to read uploaded file");
      return;
    }

    const isBlank = selectedEmailTemplateType === "blank";
    const newTemplate = isBlank
      ? {
          name: newTemplateName || "",
          description: newTemplateName || "",
          channels: buildChannelsFromEditors(),
          actionItemTypeId: 60,
          actionItemTypeName: "Broadcast",
          messageTempLibId: null
        }
      : null;
    const templateId = isBlank ? 0 : (selectedTemplateData?.id ?? 0);

    const payload = buildCustomRecipientsPayload({
      templateId,
      newTemplate,
      recipients,
      fileName: uploadedFile?.name ?? ""
    });

    sendCustomRecipientsBroadcast(payload, {
      onSuccess: (res) => {
        toast.success(
          res?.message ||
            res?.data?.message ||
            "Broadcast confirmed and scheduled"
        );
        const createdTemplateId =
          res?.data?.templateId ??
          res?.data?.newTemplateId ??
          res?.data?.id ??
          res?.data?.messageTemplateLibId ??
          (isBlank ? null : selectedTemplateData?.id);
        if (createdTemplateId) {
          saveTemplateConfig(buildTemplateConfigPayload(createdTemplateId));
        }
        setIsConfirmModalOpen(false);
        onCancel?.();
      }
    });
  };

  const handleConfirmBroadcast = () => {
    if (patientType === "uploadFile") {
      runSendCustomRecipientsBroadcast();
      return;
    }
    if (selectedEmailTemplateType === "blank") {
      const rawMailBody =
        editorRef?.current?.getCompiledHtml?.() ||
        editorRef?.current?.getHtml?.() ||
        "";
      const mailBody = rawMailBody ? prepareHtmlForEmail(rawMailBody) : "";
      const smsBody = htmlToSmsText(
        textEditorInstanceRef?.current?.getHtml?.() || ""
      );
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

      const templatePayload = {
        name: newTemplateName || "",
        templateBody: mailBody || smsBody,
        subjectLine: mailSubject || null,
        smsStandardText: smsBody || null,
        messageTempLibId: null,
        actionItemTypeId: 60,
        actionItemTypeName: "Broadcast Message Notification",
        createdBy: "admin@example.com",
        channels
      };

      saveTemplate(templatePayload, {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: ["templates"] });
          const templateId =
            res?.data?.channels?.[0]?.legacyMessageTempLibId ??
            res?.data?.id ??
            res?.data?.messageTemplateLibId;
          if (!templateId) return;
          saveTemplateConfig(buildTemplateConfigPayload(templateId));
          runSendBroadcast(templateId);
        }
      });
      return;
    }

    runSendBroadcast(
      selectedTemplateData?.channels?.[0]?.legacyMessageTempLibId ??
        selectedTemplateData?.id ??
        null
    );
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
            disabled={isSaveTemplateDisabled}
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
        confirmText={isSaveTemplateInFlight ? "Saving…" : "Save"}
        confirmDisabled={isSaveTemplateInFlight}
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
        confirmText={isBroadcastInFlight ? "Scheduling…" : "Confirm & Schedule"}
        confirmDisabled={isBroadcastInFlight}
        cancelText="Back to Editing"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        onConfirm={handleConfirmBroadcast}
        onCancel={handleCancelBroadcast}
      >
        <div className="confirmBroadcastModal">
          {renderConfirmBody()}

          {/* Patient Filter Summary Section */}
          {patientType !== "uploadFile" && (
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
                      <p>{totalPatientsFound || "0"}</p>
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
                          ? new Date(patientStartDateTime).toLocaleString([], {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit"
                            })
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
                          ? new Date(patientEndDateTime).toLocaleString([], {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit"
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ReusableModal>
    </>
  );
}
