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

export default function Details({ broadcastData }) {
  const {
    mode = "SMS",
    template = "Weekly",
    hasError = false,
    broadcastStatus = "",
    scheduledDateTime = "",
    messageStatus = {},
    appointmentTypeNames = [],
    locationNames = [],
    providerNames = [],
    patientSelectionType = ""
  } = broadcastData || {};

  const isFailed = broadcastStatus.toLowerCase() === "failed" || hasError;
  const isCancelled = broadcastStatus.toLowerCase().includes("cancel");

  const showUploadFileLayout = patientSelectionType === "UploadFile";

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

  // Derive schedule type & repeat details based on broadcastStatus
  const isRecurring =
    broadcastStatus.toLowerCase().includes("daily") ||
    broadcastStatus.toLowerCase().includes("weekly") ||
    broadcastStatus.toLowerCase().includes("monthly") ||
    broadcastStatus.toLowerCase().includes("running") ||
    broadcastStatus.toLowerCase() === "in-progress";
  const scheduleType = isRecurring ? "Recurring" : "One-time";

  const getRepeatText = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("daily")) return "Everyday";
    if (lowerStatus.includes("weekly")) return "Every Monday";
    if (lowerStatus.includes("monthly")) return "First Monday of the Month";
    return "Every Monday, Wednesday, and Friday"; // default
  };

  const repeatText = getRepeatText(broadcastStatus);

  const modesList = getModesList(mode);
  const modeSpecificCounts = getModeSpecificStatus(messageStatus, modesList);

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
                    <span className="fileName">Patients List.xlsx</span>
                    <span className="fileSize">2.5 MB</span>
                  </div>
                </div>
                <button className="downloadBtn" title="Download File">
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
            <div className="valueCol">3/01/2026 04:32:00 PM</div>
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
            const counts = modeSpecificCounts[modeName] || {};
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
                    <div className="statusValue">{counts.pending || "-"}</div>
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
