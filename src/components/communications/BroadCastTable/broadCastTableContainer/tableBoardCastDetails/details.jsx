import * as XLSX from "xlsx";

import { useGet } from "../../../../../hooks/useGet";
import { ENDPOINTS } from "../../../../../api/endpoints";
import circleAlert from "../../../../../assets/boardCastTableIcons/circleAlert.svg";
import completedGreenIcon from "../../../../../assets/boardCastTableIcons/completedGreenIcon.svg";
import failedRedIcon from "../../../../../assets/boardCastTableIcons/failedRedIcon.svg";
import pendingYellowIcon from "../../../../../assets/boardCastTableIcons/pendingYellowIcon.svg";
import broadcastIcon from "../../../../../assets/boardCastTableIcons/broadcastIcon.svg";
import fileIcon from "../../../../../assets/commonIcons/fileIcon.svg";

import scheduledDailyIcon from "../../../../../assets/boardCastTableIcons/scheduledDailyIcon.svg";
import completedIcon from "../../../../../assets/boardCastTableIcons/completedIcon.svg";
import runningWeeklyIcon from "../../../../../assets/boardCastTableIcons/runningWeekly.svg";
import failedIcon from "../../../../../assets/boardCastTableIcons/failedIcon.svg";
import cancelledIcon from "../../../../../assets/boardCastTableIcons/cancelledIcon.svg";
import cancelIcon from "../../../../../assets/boardCastTableIcons/cancelIcon.svg";
import warningRedIcon from "../../../../../assets/commonIcons/warningRedIcon.svg";
import cancelRedIcon from "../../../../../assets/commonIcons/cancelRedIcon.svg";
import emailIcon from "../../../../../assets/existingTemplate/mail.svg";
import textIcon from "../../../../../assets/existingTemplate/message.svg";
import voiceIcon from "../../../../../assets/existingTemplate/phone.svg";

import "./style.scss";

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

const formatCount = (val) => {
  if (val === undefined || val === null) return "-";
  return typeof val === "number" ? val.toLocaleString("en-US") : String(val);
};

// Per-mode counts now come as flat fields on broadcastData (emailEligibleCount,
// smsSuccessCount, etc.). Extract them for the requested mode.
const getModeCounts = (modeName, data) => {
  const key = modeName?.toLowerCase();
  const prefix =
    key === "mail" || key === "email"
      ? "email"
      : key === "sms"
        ? "sms"
        : key === "voice"
          ? "voice"
          : null;

  if (!prefix) return {};

  return {
    total: formatCount(data[`${prefix}EligibleCount`]),
    delivered: formatCount(data[`${prefix}SuccessCount`]),
    failed: formatCount(data[`${prefix}FailedCount`]),
    pending: formatCount(data[`${prefix}PendingCount`]),
    cancelled: formatCount(data[`${prefix}CancelledCount`])
  };
};

export default function Details({ broadcastData }) {
  const data = broadcastData || {};
  const {
    mode = "SMS",
    template = "Weekly",
    hasError = false,
    broadcastStatus = "",
    scheduledDateTime = "",
    sendType = "",
    appointmentTypeNames = [],
    locationNames = [],
    providerNames = [],
    patientSelectionType = "",
    scheduleIds = []
  } = data;

  const isFailed = broadcastStatus.toLowerCase() === "failed" || hasError;
  const isCancelled = broadcastStatus.toLowerCase().includes("cancel");

  const showUploadFileLayout = patientSelectionType === "UploadFile";

  const { data: uploadFileDetailsRes } = useGet(
    ["uploadFileDetails", scheduleIds],
    ENDPOINTS.broadcastSchedule.UPLOAD_FILE_DETAILS,
    { notificationScheduleIds: scheduleIds },
    { enabled: showUploadFileLayout && scheduleIds.length > 0 }
  );

  const uploadFileDetails =
    uploadFileDetailsRes?.data?.data ?? uploadFileDetailsRes?.data ?? {};
  const uploadedFile = uploadFileDetails?.files?.[0];
  const uploadedPatients = uploadFileDetails?.patients ?? [];

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

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

  // Resolve Broadcast Status Badge details
  const getBadgeDetails = (status) => {
    let colorClass = "";
    let iconSrc = null;

    if (!status) return { colorClass, iconSrc };
    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes("scheduled")) {
      colorClass = "purple";
      iconSrc = scheduledDailyIcon;
    } else if (lowerStatus.includes("completed")) {
      colorClass = "green";
      iconSrc = completedIcon;
    } else if (
      lowerStatus.includes("running") ||
      lowerStatus === "in-progress"
    ) {
      colorClass = "blue";
      iconSrc = runningWeeklyIcon;
    } else if (lowerStatus.includes("failed")) {
      colorClass = "red";
      iconSrc = failedIcon;
    } else if (lowerStatus.includes("cancel")) {
      colorClass = "grey";
      iconSrc = cancelledIcon;
    }
    return { colorClass, iconSrc };
  };

  const { colorClass, iconSrc } = getBadgeDetails(broadcastStatus);

  // Schedule type comes from sendType (Immediately / NotifyLater / Recurring).
  const sendTypeLabelMap = {
    Immediately: "Immediately",
    NotifyLater: "Scheduled",
    Recurring: "Recurring"
  };
  const isRecurring = sendType === "Recurring";
  const scheduleType = sendTypeLabelMap[sendType] || sendType || "—";

  const getRepeatText = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("daily")) return "Everyday";
    if (lowerStatus.includes("weekly")) return "Every Monday";
    if (lowerStatus.includes("monthly")) return "First Monday of the Month";
    return "Every Monday, Wednesday, and Friday"; // default
  };

  const repeatText = getRepeatText(broadcastStatus);

  const modesList = getModesList(mode);

  return (
    <div className="tabContentDetails">
      {/* Mode */}
      <h3>CONFIGURATIONS</h3>
      <div className="detailRow">
        <div className="labelCol">Mode</div>
        <div className="valueCol modeVal">
          <span>{mode}</span>
          {isFailed && (
            <img src={circleAlert} alt="Failed Icon" className="alertIcon" />
          )}
        </div>
      </div>

      {/* Template */}
      <div className="detailRow">
        <div className="labelCol">Template</div>
        <div className="valueCol">{template}</div>
      </div>

      {/* Failed Reason (Only show if broadcast failed) */}
      {isFailed && (
        <div className="detailRow failedReasonRow">
          <div className="labelCol">Failed Reason</div>
          <div className="valueCol failedReasonText">
            <p>
              The broadcast could not be delivered due to one or more of the
              following reasons:
            </p>
            <ul className="failedReasonList">
              <li>Carrier rejection or unreachable mobile numbers</li>
              <li>Email server rejection or spam filtering</li>
              <li>Network connectivity issues during delivery</li>
            </ul>
          </div>
        </div>
      )}

      {/* Patient Type */}
      <div className="detailRow">
        <div className="labelCol">Patient Selection(s)</div>
        <div className="valueCol">
          {showUploadFileLayout ? "Upload File" : "Target Recipients"}
        </div>
      </div>

      {showUploadFileLayout ? (
        /* UPLOAD FILE LAYOUT */
        <>
          {/* Upload File Status */}
          <div className="detailRow">
            <div className="labelCol">Upload File Status</div>
            <div className="valueCol fileStatusVal">
              <img
                src={completedGreenIcon}
                alt="Check"
                className="statusIcon"
              />
              <span>Sent</span>
            </div>
          </div>

          {/* Uploaded File */}
          <div className="detailRow">
            <div className="labelCol">Uploaded File</div>
            <div className="valueCol">
              <div className="uploadedFileCard">
                <div className="fileLeft">
                  <img src={fileIcon} alt="File" className="fileIcon" />
                  <div className="fileTextDetails">
                    <span className="fileName">
                      {uploadedFile?.sourceFileName || "—"}
                    </span>
                    <span className="fileSize">
                      {uploadedFile?.fileSize
                        ? `${(uploadedFile.fileSize / 1024).toFixed(1)} KB`
                        : ""}
                    </span>
                  </div>
                </div>
                <button
                  className="downloadBtn"
                  title="Download File"
                  onClick={handleDownloadUploadedFile}
                  disabled={!uploadedPatients.length}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M3.33337 14.1673V15.834C3.33337 16.276 3.50897 16.6999 3.82153 17.0125C4.13409 17.3251 4.55801 17.5007 5.00004 17.5007H15C15.4421 17.5007 15.866 17.3251 16.1786 17.0125C16.4911 16.6999 16.6667 16.276 16.6667 15.834V14.1673M14.1667 9.16732L10 13.334L5.83337 9.16732M10 13.334V3.33398"
                      stroke="#606E80"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* File Created on */}
          <div className="detailRow">
            <div className="labelCol">File Created on</div>
            <div className="valueCol">
              {formatDateTime(uploadedFile?.fileUploadedDtTm)}
            </div>
          </div>
        </>
      ) : (
        /* TARGET RECIPIENTS LAYOUT */
        <>
          {/* Appointment Type Scroll List */}
          <div className="detailRow listRow">
            <div className="labelCol">Appointment Type</div>
            <div className="valueCol countHeader">
              {appointmentTypeNames.length} Appointments
            </div>
          </div>
          <div className="listScrollBox">
            <div className="gridList">
              {appointmentTypeNames.map((item, idx) => (
                <div key={idx} className="listItem">
                  <span className="bulletDot"></span>
                  <span className="itemText">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location Scroll List */}
          <div className="detailRow listRow">
            <div className="labelCol">Location</div>
            <div className="valueCol countHeader">
              {locationNames.length} Locations
            </div>
          </div>
          <div className="listScrollBox">
            <div className="gridList">
              {locationNames.map((item, idx) => (
                <div key={idx} className="listItem">
                  <span className="bulletDot"></span>
                  <span className="itemText">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Scroll List */}
          <div className="detailRow listRow">
            <div className="labelCol">Provider</div>
            <div className="valueCol countHeader">
              {providerNames.length} Providers
            </div>
          </div>
          <div className="listScrollBox">
            <div className="gridList">
              {providerNames.map((item, idx) => (
                <div key={idx} className="listItem">
                  <span className="bulletDot"></span>
                  <span className="itemText">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <hr />

      <h3>SCHEDULE</h3>

      {/* Schedule Type */}
      <div className="detailRow">
        <div className="labelCol">Schedule Type</div>
        <div className="valueCol">{scheduleType}</div>
      </div>

      {/* Repeat */}
      {isRecurring && (
        <div className="detailRow">
          <div className="labelCol">Repeat</div>
          <div className="valueCol">{repeatText}</div>
        </div>
      )}

      {/* Schedule Start Date/Time */}
      <div className="detailRow">
        <div className="labelCol">Schedule Start Date/Time</div>
        <div className="valueCol">{scheduledDateTime}</div>
      </div>

      {/* Schedule End Date */}
      {isRecurring && (
        <div className="detailRow">
          <div className="labelCol">Schedule End Date</div>
          <div className="valueCol">5/31/2026</div>
        </div>
      )}

      {isCancelled && (
        <>
          <div className="occurCancelled">
            <div className="topLayer">
              <img src={warningRedIcon} alt="warningRedIcon" />
              <span>2 Occurrences Cancelled</span>
            </div>
            <p>
              <span>
                Only Mail and Voice messages are cancelled for the selected
                occurrences.
              </span>{" "}
              SMS messages will still be sent, and all three modes will continue
              as scheduled for subsequent occurrences.
            </p>
          </div>

          <div className="cancelledCard">
            <div className="left">
              <div className="topLeft">
                <img src={cancelRedIcon} alt="cancelRedIcon" />
                <p className="dateP">2 Mar 2026, 10:30 AM</p>
              </div>
              <p>
                Mail and Voice messages were cancelled for this occurrence. SMS
                messages will be sent as scheduled.
              </p>
            </div>
            <div className="right">
              {[
                { icon: emailIcon, label: "Mail" },
                { icon: textIcon, label: "SMS" },
                { icon: voiceIcon, label: "Voice" }
              ].map(({ icon, label }) => (
                <div key={label} className="modeCard">
                  <img src={icon} alt={label} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {isRecurring && (
        <div className="detailRow">
          <div className="labelCol">Next Occurrence:</div>
          <div className="valueCol">2 May 2026 10:30 AM</div>
        </div>
      )}

      <hr />

      <h3>STATUS</h3>

      {/* Broadcast Status */}
      <div className="detailRow">
        <div className="labelCol">Broadcast Status</div>
        <div className="valueCol">
          {broadcastStatus && (
            <div className={`status-badge ${colorClass}`}>
              {iconSrc && (
                <img
                  src={iconSrc}
                  alt={broadcastStatus}
                  style={{ width: "12px", height: "12px" }}
                />
              )}
              {broadcastStatus}
            </div>
          )}
        </div>
      </div>

      {/* Message Status */}
      <div className="statusListRow">
        <div className="labelCol">Message Status</div>
        <div className="valueCol messageStatusList">
          {modesList.map((modeName) => {
            const counts = getModeCounts(modeName, data);
            const trailingCount = isCancelled
              ? counts.cancelled
              : counts.pending;
            return (
              <div key={modeName} className="modeStatusGroup">
                <div className="modeStatusHeader">{modeName}</div>
                <div className="statusItem">
                  <div className="statusLabel">
                    <img src={broadcastIcon} alt="Total" />
                    <div className="statusValue">{counts.total || "-"}</div>
                  </div>

                  <div className="statusLabel">
                    <img src={completedGreenIcon} alt="Success" />
                    <div className="statusValue">{counts.delivered || "-"}</div>
                  </div>

                  <div className="statusLabel">
                    <img src={failedRedIcon} alt="Failed" />
                    <div className="statusValue">{counts.failed || "-"}</div>
                  </div>

                  <div className="statusLabel">
                    {isCancelled ? (
                      <img src={cancelIcon} alt="Cancelled" />
                    ) : (
                      <img src={pendingYellowIcon} alt="Pending" />
                    )}
                    <div className="statusValue">{trailingCount || "-"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
