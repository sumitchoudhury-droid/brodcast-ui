import { memo, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ReusableRightDrawer from "../../../../reusableComponents/reusabeleRightDrawer/index";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import { usePost } from "../../../../hooks/usePost";
import { useToast } from "../../../../hooks/useToast";
import { ENDPOINTS } from "../../../../api/endpoints.js";
import "./style.scss";

const RenderSortIcon = ({ columnKey, sortConfig }) => {
  const isCurrent = sortConfig.key === columnKey;
  const upColor =
    isCurrent && sortConfig.direction === "asc" ? "#107A6C" : "#77C1B6";
  const downColor =
    isCurrent && sortConfig.direction === "desc" ? "#107A6C" : "#77C1B6";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="sortIcon"
    >
      <path
        d="M13.2352 7.94118H4.76465L8.99994 3L13.2352 7.94118Z"
        fill={upColor}
      />
      <path
        d="M13.2352 10.0586H4.76465L8.99994 14.9998L13.2352 10.0586Z"
        fill={downColor}
      />
    </svg>
  );
};

export const StopScheduleBulk = memo(function StopScheduleBulk({
  isOpen,
  onClose,
  onConfirm,
  selectedBroadcasts = []
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { mutate: bulkCancel, isPending: isCancelling } = usePost(
    ENDPOINTS.broadcastSchedule.BULK_CANCEL
  );

  const count = selectedBroadcasts.length;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc"
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedBroadcasts = useMemo(() => {
    if (!sortConfig.key) return selectedBroadcasts;

    return [...selectedBroadcasts].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      const strA = String(valA);
      const strB = String(valB);

      const comparison = strA.localeCompare(strB, undefined, {
        numeric: true,
        sensitivity: "base"
      });
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [selectedBroadcasts, sortConfig]);

  return (
    <ReusableRightDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="800px"
      title="Confirm Cancel Schedule"
      className="stopScheduleBulkDrawer"
      footer={
        <div className="drawerFooterBtn">
          <ReusableButton variant="primary" onClick={onClose} label="Cancel" />
          <ReusableButton
            variant="secondary"
            disabled={isCancelling}
            onClick={() => {
              const scheduleIds = selectedBroadcasts
                .flatMap((b) =>
                  Array.isArray(b.scheduleIds) && b.scheduleIds.length
                    ? b.scheduleIds
                    : [b.id]
                )
                .map(Number)
                .filter((n) => !Number.isNaN(n));

              const payload = {
                scheduleIds: scheduleIds,
                cancelledById: 9,
                modifiedDateTime: new Date().toISOString()
              };

              bulkCancel(payload, {
                onSuccess: (res) => {
                  toast.success(
                    res?.message ||
                      res?.data?.message ||
                      "Bulk cancel completed"
                  );
                  queryClient.invalidateQueries({
                    queryKey: ["broadcast-schedules"]
                  });
                  onConfirm();
                }
              });
            }}
            label={isCancelling ? "Cancelling…" : "Confirm"}
          />
        </div>
      }
    >
      <div className="drawerContentBody">
        <p className="confirmText">
          Are you sure you want to{" "}
          <strong>
            stop {count > 1 ? "these" : "this"} {count}{" "}
            {count > 1 ? "broadcasts" : "broadcast"}?
          </strong>
        </p>

        <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("mode")}>
                  <div className="headerContent">
                    Mode{" "}
                    <RenderSortIcon columnKey="mode" sortConfig={sortConfig} />
                  </div>
                </th>
                <th onClick={() => handleSort("template")}>
                  <div className="headerContent">
                    Template{" "}
                    <RenderSortIcon
                      columnKey="template"
                      sortConfig={sortConfig}
                    />
                  </div>
                </th>
                <th onClick={() => handleSort("appointmentType")}>
                  <div className="headerContent">
                    Appointment Type{" "}
                    <RenderSortIcon
                      columnKey="appointmentType"
                      sortConfig={sortConfig}
                    />
                  </div>
                </th>
                <th onClick={() => handleSort("location")}>
                  <div className="headerContent">
                    Location{" "}
                    <RenderSortIcon
                      columnKey="location"
                      sortConfig={sortConfig}
                    />
                  </div>
                </th>
                <th onClick={() => handleSort("provider")}>
                  <div className="headerContent">
                    Provider{" "}
                    <RenderSortIcon
                      columnKey="provider"
                      sortConfig={sortConfig}
                    />
                  </div>
                </th>
                <th onClick={() => handleSort("scheduledDateTime")}>
                  <div className="headerContent">
                    Scheduled Date/Time{" "}
                    <RenderSortIcon
                      columnKey="scheduledDateTime"
                      sortConfig={sortConfig}
                    />
                  </div>
                </th>
                <th onClick={() => handleSort("broadcastStatus")}>
                  <div className="headerContent">
                    Broadcast Status{" "}
                    <RenderSortIcon
                      columnKey="broadcastStatus"
                      sortConfig={sortConfig}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBroadcasts.map((broadcast) => {
                const apptNames = broadcast.appointmentTypeNames ?? [];
                const locNames = broadcast.locationNames ?? [];
                const provNames = broadcast.providerNames ?? [];
                return (
                  <tr key={broadcast.id}>
                    <td>{broadcast.mode || "-"}</td>
                    <td>{broadcast.template || "-"}</td>
                    <td>
                      <div className="cellWithPill">
                        <span className="cellText">{apptNames[0] || "-"}</span>
                        {apptNames.length > 1 && (
                          <span className="countPill">
                            +{apptNames.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cellWithPill">
                        <span className="cellText">{locNames[0] || "-"}</span>
                        {locNames.length > 1 && (
                          <span className="countPill">
                            +{locNames.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cellWithPill">
                        <span className="cellText">{provNames[0] || "-"}</span>
                        {provNames.length > 1 && (
                          <span className="countPill">
                            +{provNames.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{broadcast.scheduledDateTime || "-"}</td>
                    <td>{broadcast.broadcastStatus || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ReusableRightDrawer>
  );
});

export default StopScheduleBulk;
