import { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "../../../../../hooks/usePost";
import { useGet } from "../../../../../hooks/useGet";
import { useToast } from "../../../../../hooks/useToast";
import { ENDPOINTS } from "../../../../../api/endpoints.js";
import CloseButton from "../../../../../assets/commonIcons/CloseButton.svg";

// Message Status Icons
import broadcastIcon from "../../../../../assets/boardCastTableIcons/broadcastIcon.svg";
import completedGreenIcon from "../../../../../assets/boardCastTableIcons/completedGreenIcon.svg";
import failedRedIcon from "../../../../../assets/boardCastTableIcons/failedRedIcon.svg";
import pendingYellowIcon from "../../../../../assets/boardCastTableIcons/pendingYellowIcon.svg";

// Broadcast Status Icons
import completedIcon from "../../../../../assets/boardCastTableIcons/completedIcon.svg";
import scheduledDailyIcon from "../../../../../assets/boardCastTableIcons/scheduledDailyIcon.svg";
import runningWeeklyIcon from "../../../../../assets/boardCastTableIcons/runningWeekly.svg";
import failedIcon from "../../../../../assets/boardCastTableIcons/failedIcon.svg";
import cancelledIcon from "../../../../../assets/boardCastTableIcons/cancelledIcon.svg";
import xlsIcon from "../../../../../assets/commonIcons/xlsIcon.svg";
import downloadIcon2 from "../../../../../assets/commonIcons/downloadIcon 2.svg";
import uncheckedRadioIcon from "../../../../../assets/commonIcons/uncheckedRadioIcon.svg";
import checkedRadioIcon from "../../../../../assets/commonIcons/checkedRadioIcon.svg";

import "./style.scss";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton/index";
import { ReusableCheckbox } from "../../../../../reusableComponents/reusableCheckbox/index";
import { ReusableMulti } from "../../../../../reusableComponents/reusableMulti";

const dateOptions = [
  { label: "9 Mar 2026 - 6 Apr 2026", value: "1" },
  { label: "7 Apr 2026 - 4 May 2026", value: "2" },
  { label: "5 May 2026 - 2 Jun 2026", value: "3" }
];

const getModesList = (modeStr) => {
  if (!modeStr) return [];
  let list = modeStr
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m && m !== "...");

  if (modeStr.includes("...")) {
    const allPossible = ["SMS", "Mail", "Voice"];
    allPossible.forEach((p) => {
      if (!list.some((item) => item.toLowerCase() === p.toLowerCase())) {
        list.push(p);
      }
    });
  }
  return list;
};

const getModeSpecificStatus = (messageStatus, modesList) => {
  if (!messageStatus) return {};

  if (messageStatus.modes) {
    return messageStatus.modes;
  }

  const parseVal = (val) => {
    if (!val || val === "-") return 0;
    return parseInt(String(val).replace(/,/g, ""), 10) || 0;
  };

  const totalVal = parseVal(messageStatus.total);
  const deliveredVal = parseVal(messageStatus.delivered);
  const failedVal = parseVal(messageStatus.failed);
  const pendingVal = parseVal(messageStatus.pending);

  const numModes = modesList.length;
  if (numModes <= 1) {
    const singleMode = modesList[0] || "Message";
    return {
      [singleMode]: {
        total: messageStatus.total || "-",
        delivered: messageStatus.delivered || "-",
        failed: messageStatus.failed || "-",
        pending: messageStatus.pending || "-"
      }
    };
  }

  const modeCounts = {};
  let totalAllocated = 0;
  let deliveredAllocated = 0;
  let failedAllocated = 0;
  let pendingAllocated = 0;

  modesList.forEach((m, idx) => {
    let fraction = 1 / numModes;
    if (numModes === 2) {
      fraction = idx === 0 ? 0.6 : 0.4;
    } else if (numModes === 3) {
      fraction = idx === 0 ? 0.5 : idx === 1 ? 0.3 : 0.2;
    }

    const mTotal =
      idx === numModes - 1
        ? totalVal - totalAllocated
        : Math.round(totalVal * fraction);
    const mDelivered =
      idx === numModes - 1
        ? deliveredVal - deliveredAllocated
        : Math.round(deliveredVal * fraction);
    const mFailed =
      idx === numModes - 1
        ? failedVal - failedAllocated
        : Math.round(failedVal * fraction);
    const mPending =
      idx === numModes - 1
        ? pendingVal - pendingAllocated
        : Math.round(pendingVal * fraction);

    totalAllocated += mTotal;
    deliveredAllocated += mDelivered;
    failedAllocated += mFailed;
    pendingAllocated += mPending;

    const formatVal = (val, originalStr) => {
      if (
        originalStr === "-" ||
        originalStr === undefined ||
        originalStr === null
      ) {
        return "-";
      }
      if (val === 0) return "0";
      return val.toLocaleString("en-US");
    };

    modeCounts[m] = {
      total: formatVal(mTotal, messageStatus.total),
      delivered: formatVal(mDelivered, messageStatus.delivered),
      failed: formatVal(mFailed, messageStatus.failed),
      pending: formatVal(mPending, messageStatus.pending)
    };
  });

  return modeCounts;
};

// Helper to format date string to matching layout e.g. "26 Feb 2026 at 10:30 AM"
const formatScheduleDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "26 Feb 2026 at 10:30 AM";
  try {
    const dateObj = new Date(dateTimeStr);
    if (isNaN(dateObj.getTime())) {
      return dateTimeStr;
    }
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateTimeStr;
  }
};

export function CancelSchedule({ isOpen, onClose, onConfirm, broadcastData }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { mutate: cancelBroadcast, isPending: isCancelling } = usePost(
    ENDPOINTS.broadcastSchedule.BULK_CANCEL
  );

  const modesList = useMemo(() => {
    return getModesList(broadcastData?.mode);
  }, [broadcastData]);

  const modeSpecificCounts = useMemo(() => {
    return getModeSpecificStatus(broadcastData?.messageStatus, modesList);
  }, [broadcastData?.messageStatus, modesList]);

  const [dateFilter, setDateFilter] = useState([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState("this");

  const [selectedModes, setSelectedModes] = useState(() => {
    const list = getModesList(broadcastData?.mode);
    const initial = {};
    list.forEach((m) => {
      initial[m] = true;
    });
    return initial;
  });

  const handleCheckboxChange = (m) => {
    setSelectedModes((prev) => ({
      ...prev,
      [m]: !prev[m]
    }));
  };

  const formattedDate = useMemo(() => {
    return formatScheduleDateTime(broadcastData?.scheduledDateTime);
  }, [broadcastData]);

  const patientCount = useMemo(() => {
    return broadcastData?.messageStatus?.total || "-";
  }, [broadcastData]);

  // Resolve Badge Icon and color class for Broadcast Status
  const getStatusDetails = (status) => {
    if (!status) return { className: "greenBadge", icon: completedIcon };
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("completed")) {
      return { className: "greenBadge", icon: completedIcon };
    } else if (lowerStatus.includes("scheduled")) {
      return { className: "purpleBadge", icon: scheduledDailyIcon };
    } else if (lowerStatus.includes("running")) {
      return { className: "blueBadge", icon: runningWeeklyIcon };
    } else if (lowerStatus.includes("in-progress")) {
      return { className: "blueBadge", icon: runningWeeklyIcon };
    } else if (lowerStatus.includes("failed")) {
      return { className: "redBadge", icon: failedIcon };
    } else if (lowerStatus.includes("cancel")) {
      return { className: "greyBadge", icon: cancelledIcon };
    }
    return { className: "greenBadge", icon: completedIcon };
  };

  const statusDetails = getStatusDetails(broadcastData?.broadcastStatus);

  const selectionTypeMap = {
    UploadFile: "uploadFile",
    TargetRecipients: "targetRecipients",
    OneTimeBroadcast: "oneTimeBroadcast"
  };
  const patientType =
    selectionTypeMap[broadcastData?.patientSelectionType] ?? "";

  const scheduleIds = broadcastData?.scheduleIds ?? [];

  const { data: uploadFileDetailsRes } = useGet(
    ["uploadFileDetails", scheduleIds],
    ENDPOINTS.broadcastSchedule.UPLOAD_FILE_DETAILS,
    { notificationScheduleIds: scheduleIds },
    {
      enabled: isOpen && patientType === "uploadFile" && scheduleIds.length > 0
    }
  );

  const uploadFileDetails =
    uploadFileDetailsRes?.data?.data ?? uploadFileDetailsRes?.data ?? {};
  const uploadedFile = uploadFileDetails?.files?.[0];
  const uploadedPatients = uploadFileDetails?.patients ?? [];

  const handleDownloadUploadedFile = () => {
    if (!uploadedPatients.length) return;
    const rows = uploadedPatients.map((p) => ({
      "Patient ID": p.pmsbcpPatientId ?? "",
      "First Name": p.firstName ?? "",
      "Last Name": p.lastName ?? "",
      "Date of Birth": p.dob ? new Date(p.dob).toLocaleDateString() : "",
      "Primary Phone": p.primaryPhoneNo ?? "",
      "Primary Email": p.primaryEmailId ?? ""
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    const fileName =
      uploadedFile?.sourceFileName?.replace(/\.xlsx?$/i, "") ||
      uploadedFile?.displayFileName?.replace(/\.xlsx?$/i, "") ||
      "patients";
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (!isOpen) return null;

  const formatModeList = (modes) => {
    if (modes.length === 0) return "all";
    const lower = modes.map((m) => m.toLowerCase());
    if (lower.length === 1) return lower[0];
    if (lower.length === 2) return `${lower[0]} and ${lower[1]}`;
    return lower.slice(0, -1).join(", ") + `, and ${lower[lower.length - 1]}`;
  };

  const selectedDateLabels = dateOptions
    .filter((opt) => dateFilter.includes(opt.value))
    .map((opt) => opt.label);

  const isRecurring = broadcastData?.sendMode === "Recurring";
  const modesPhrase = `${formatModeList(modesList)} messages`;

  const disclaimerText = (() => {
    if (selectedOccurrence === "this") {
      return `All scheduled ${modesPhrase} for ${formattedDate} will be cancelled.${isRecurring ? " Future occurrences will continue as scheduled." : ""}`;
    }
    if (selectedOccurrence === "specific") {
      const dateStr =
        selectedDateLabels.length > 0
          ? selectedDateLabels.join(" and ")
          : "the selected dates";
      return `All scheduled ${modesPhrase} for ${dateStr} will be cancelled. Other occurrences will continue as scheduled.`;
    }
    if (selectedOccurrence === "all") {
      return `All scheduled ${modesPhrase} for this and all future occurrences will be cancelled. This action cannot be undone.`;
    }
    return "";
  })();

  return ReactDOM.createPortal(
    <div className="cancelScheduleOverlay" onClick={onClose}>
      <div className="cancelScheduleModal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modalHeader">
          <h2 className="modalTitle">Confirm Cancel Schedule</h2>
          <button className="closeButton" onClick={onClose}>
            <img src={CloseButton} alt="Close" />
          </button>
        </div>

        {/* Content */}
        <div className="modalBody">
          <p className="confirmText">
            Are you sure you want to stop this broadcast scheduled on{" "}
            <span className="highlightText">{formattedDate}</span> to{" "}
            <span className="highlightText">{patientCount} Patients?</span>
          </p>

          <p className="warningText">
            Once confirmed, this action cannot be undone.
          </p>

          <div className="statementCard">
            <div className="topContent">
              <div className="header">
                <h2>Account Statement</h2>
                <div className={`statusBadge ${statusDetails.className}`}>
                  <img
                    src={statusDetails.icon}
                    alt={broadcastData?.broadcastStatus || "Completed"}
                  />
                  <span>{broadcastData?.broadcastStatus || "Completed"}</span>
                </div>
              </div>
              {broadcastData?.sendMode === "Recurring" && (
                <>
                  <p>Monthly on 2nd Monday, until Jul 30, 2026</p>
                  <p>
                    <span>Next Occurrence:</span> 9 Feb 2026 10:30 AM
                  </p>
                </>
              )}
            </div>
            {patientType === "uploadFile" && (
              <div className="excelCon">
                <div className="details">
                  <img src={xlsIcon} alt="xlsIcon" className="xlsIcon" />
                  <div className="xlsDetails">
                    <p>{uploadedFile?.sourceFileName || "—"}</p>
                    <span>
                      {uploadedPatients.length
                        ? `${uploadedPatients.length} patients`
                        : ""}
                    </span>
                  </div>
                </div>
                <img
                  src={downloadIcon2}
                  alt="downloadIcon2"
                  className="downloadIcon"
                  onClick={handleDownloadUploadedFile}
                  style={
                    !uploadedPatients.length
                      ? { opacity: 0.5, cursor: "not-allowed" }
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          <div className="cancelCard">
            {broadcastData?.sendMode === "Recurring" && (
              <div className="cancelCardDetail">
                <h4>Cancel by Occurrence</h4>

                <div
                  className={`occurrenceSelector${selectedOccurrence === "this" ? " selected" : ""}`}
                  onClick={() => setSelectedOccurrence("this")}
                >
                  <img
                    src={
                      selectedOccurrence === "this"
                        ? checkedRadioIcon
                        : uncheckedRadioIcon
                    }
                    alt="radioIcon"
                    className="radioIcon"
                  />
                  <div className="occurrenceDetails">
                    <p>Only this occurrence (9 Feb 2026)</p>
                    <span>Future occurrences will continue as scheduled.</span>
                  </div>
                </div>

                <div
                  className={`occurrenceSelector${selectedOccurrence === "specific" ? " selected" : ""}`}
                  onClick={() => setSelectedOccurrence("specific")}
                >
                  <img
                    src={
                      selectedOccurrence === "specific"
                        ? checkedRadioIcon
                        : uncheckedRadioIcon
                    }
                    alt="radioIcon"
                    className="radioIcon"
                  />
                  <div className="occurrenceDetails">
                    <p>A specific upcoming occurrence</p>
                    <span>
                      Pick any future date in the series to skip. Others
                      continue.
                    </span>
                    {selectedOccurrence === "specific" && (
                      <ReusableMulti
                        greenIcon={false}
                        placeholder="Select Filter"
                        options={dateOptions}
                        value={dateFilter}
                        onChange={(val) => setDateFilter(val)}
                      />
                    )}
                  </div>
                </div>

                <div
                  className={`occurrenceSelector${selectedOccurrence === "all" ? " selected" : ""}`}
                  onClick={() => setSelectedOccurrence("all")}
                >
                  <img
                    src={
                      selectedOccurrence === "all"
                        ? checkedRadioIcon
                        : uncheckedRadioIcon
                    }
                    alt="radioIcon"
                    className="radioIcon"
                  />
                  <div className="occurrenceDetails">
                    <p>This and all future occurrences</p>
                    <span>Ends the entire series. Cannot be restarted.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="cancelCardDetail">
              <h4>Cancel by Mode</h4>

              {modesList.length > 0 ? (
                modesList.map((m) => {
                  const counts = modeSpecificCounts[m] || {};
                  return (
                    <div key={m} className="modeRow">
                      <ReusableCheckbox
                        label={m}
                        name="cancelMode"
                        checked={!!selectedModes[m]}
                        onChange={() => handleCheckboxChange(m)}
                      />
                      <div className="messageStatusContainer">
                        <div className="statusItem blue">
                          <img src={broadcastIcon} alt="total" />
                          <span>{counts.total || "-"}</span>
                        </div>
                        <div className="statusItem green">
                          <img src={completedGreenIcon} alt="delivered" />
                          <span>{counts.delivered || "-"}</span>
                        </div>
                        <div className="statusItem red">
                          <img src={failedRedIcon} alt="failed" />
                          <span>{counts.failed || "-"}</span>
                        </div>
                        <div className="statusItem yellow">
                          <img src={pendingYellowIcon} alt="pending" />
                          <span>{counts.pending || "-"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="modeRow">
                  <span className="detailValue">
                    {broadcastData?.mode || "Mail"}
                  </span>
                  <div className="messageStatusContainer">
                    <div className="statusItem blue">
                      <img src={broadcastIcon} alt="total" />
                      <span>{broadcastData?.messageStatus?.total || "-"}</span>
                    </div>
                    <div className="statusItem green">
                      <img src={completedGreenIcon} alt="delivered" />
                      <span>
                        {broadcastData?.messageStatus?.delivered || "-"}
                      </span>
                    </div>
                    <div className="statusItem red">
                      <img src={failedRedIcon} alt="failed" />
                      <span>{broadcastData?.messageStatus?.failed || "-"}</span>
                    </div>
                    <div className="statusItem yellow">
                      <img src={pendingYellowIcon} alt="pending" />
                      <span>
                        {broadcastData?.messageStatus?.pending || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {disclaimerText && <p className="disclaimerPara">{disclaimerText}</p>}
        </div>

        {/* Footer */}
        <div className="modalFooter">
          <ReusableButton variant="primary" onClick={onClose} label="Cancel" />
          <ReusableButton
            variant="secondary"
            disabled={
              isCancelling ||
              (selectedOccurrence === "specific" && dateFilter.length === 0) ||
              (modesList.length > 0 &&
                !Object.values(selectedModes).some(Boolean))
            }
            onClick={() => {
              const activeModes = Object.keys(selectedModes).filter(
                (k) => selectedModes[k]
              );
              const selectedDateLabels = dateOptions
                .filter((opt) => dateFilter.includes(opt.value))
                .map((opt) => opt.label);

              const rowScheduleIds = broadcastData?.scheduleIds ?? [];
              const selectedScheduleIds = rowScheduleIds.filter(
                (_, i) => selectedModes[modesList[i]]
              );

              const body = {
                scheduleIds: selectedScheduleIds,
                cancelledById: 9,
                modifiedDateTime: new Date().toISOString().slice(0, 19)
              };

              cancelBroadcast(body, {
                onSuccess: (res) => {
                  toast.success(
                    res?.message ||
                      res?.data?.message ||
                      "Schedule cancelled successfully"
                  );
                  queryClient.invalidateQueries({
                    queryKey: ["broadcast-schedules"]
                  });
                  onConfirm({
                    selectedOccurrence,
                    selectedDates: selectedDateLabels,
                    selectedModes: activeModes
                  });
                }
              });
            }}
            label={isCancelling ? "Cancelling…" : "Confirm"}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CancelSchedule;
