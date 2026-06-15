import { useState, useEffect, useRef, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ReusableCheckbox } from "../../../../reusableComponents/reusableCheckbox/index";
import ReusableToolTip from "../../../../reusableComponents/reusableToolTip/index.jsx";

import scheduledDailyIcon from "../../../../assets/boardCastTableIcons/scheduledDailyIcon.svg";
import completedIcon from "../../../../assets/boardCastTableIcons/completedIcon.svg";
import runningWeeklyIcon from "../../../../assets/boardCastTableIcons/runningWeekly.svg";
import broadcastIcon from "../../../../assets/boardCastTableIcons/broadcastIcon.svg";
import failedIcon from "../../../../assets/boardCastTableIcons/failedIcon.svg";
import cancelledIcon from "../../../../assets/boardCastTableIcons/cancelledIcon.svg";

import completedGreenIcon from "../../../../assets/boardCastTableIcons/completedGreenIcon.svg";
import failedRedIcon from "../../../../assets/boardCastTableIcons/failedRedIcon.svg";
import pendingYellowIcon from "../../../../assets/boardCastTableIcons/pendingYellowIcon.svg";
import cancelIcon from "../../../../assets/boardCastTableIcons/cancelIcon.svg";
import circleAlert from "../../../../assets/boardCastTableIcons/circleAlert.svg";
import tableMenuIcon from "../../../../assets/boardCastTableIcons/tableMenu.svg";

import searchGreenIcon from "../../../../assets/boardCastTableIcons/searchGreen.svg";
import settingsIcon from "../../../../assets/boardCastTableIcons/tableSettings.svg";

import CancelScheduleIcon from "../../../../assets/boardCastTableIcons/CancelScheduleIcon.svg";
import ReportIcon from "../../../../assets/boardCastTableIcons/ReportIcon.svg";
import ReprocessIcon from "../../../../assets/boardCastTableIcons/ReprocessIcon.svg";

import "./style.scss";
import { mockData } from "./mockData";
import TableSettings from "./tableSettings/index";
import { useToast } from "../../../../hooks/useToast";
import ReProcessBroadCast from "./reprocessBroadcast/index.jsx";
import CancelSchedule from "./cancelSchedule/index.jsx";
import TableBoardCastDetails from "./tableBoardCastDetails/index.jsx";
import StopScheduleBulk from "../stopScheduleBulk/index.jsx";

const DEFAULT_ORDER = [
  "mode",
  "template",
  "appointmentType",
  "location",
  "provider",
  "scheduledDateTime",
  "messageStatus",
  "broadcastStatus"
];

const DEFAULT_VISIBILITY = {
  mode: true,
  template: true,
  appointmentType: true,
  location: true,
  provider: true,
  scheduledDateTime: true,
  messageStatus: true,
  broadcastStatus: true
};

const getMenuOptions = (status) => {
  if (!status) return [];
  const lowerStatus = status.toLowerCase();

  if (
    lowerStatus.includes("scheduled") ||
    lowerStatus.includes("running") ||
    lowerStatus.includes("reprocess")
  ) {
    return [
      {
        label: "Cancel Schedule",
        action: "cancel",
        icon: CancelScheduleIcon
      },
      { label: "Reprocess", action: "reprocess", icon: ReprocessIcon },
      { label: "Report", action: "report", icon: ReportIcon }
    ];
  } else if (lowerStatus.includes("cancel")) {
    return [{ label: "Report", action: "report", icon: ReportIcon }];
  } else if (
    lowerStatus.includes("completed") ||
    lowerStatus.includes("failed")
  ) {
    return [
      { label: "Reprocess", action: "reprocess", icon: ReprocessIcon },
      { label: "Report", action: "report", icon: ReportIcon }
    ];
  }
  return [];
};

const highlightText = (text, query) => {
  if (!text) return "";
  if (!query) return text;

  const stringText = String(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = stringText.split(new RegExp(`(${escapedQuery})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const getPlaceholder = (columnId) => {
  switch (columnId) {
    case "mode":
      return "Sea...";
    case "template":
      return "Search Template...";
    case "appointmentType":
      return "Search Appointment...";
    case "location":
      return "Search Location";
    case "provider":
      return "Search Provider";
    case "scheduledDateTime":
      return "Search Date/Time";
    case "messageStatus":
      return "Search M...";
    case "broadcastStatus":
      return "Search Broadcast...";
    default:
      return "Search...";
  }
};

const RenderSortIcon = ({ isSorted }) => {
  const upColor = isSorted === "asc" ? "#107A6C" : "#77C1B6";
  const downColor = isSorted === "desc" ? "#107A6C" : "#77C1B6";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="sort-icon"
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

function BroadCastTableContainer({
  currentPage = 1,
  itemsPerPage = 10,
  setTotalItems,
  selectedDateRange,
  bulkCancelOpen,
  setBulkCancelOpen,
  onSelectionChange
}) {
  const toast = useToast();
  const [data, setData] = useState(mockData);
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showReprocessDrawer, setShowReprocessDrawer] = useState(false);
  const [selectedCancelRow, setSelectedCancelRow] = useState(null);
  const [selectedDetailsRow, setSelectedDetailsRow] = useState(null);
  const [showStopScheduleBulk, setShowStopScheduleBulk] = useState(false);
  const menuRef = useRef(null);
  const settingsRef = useRef(null);
  const settingsButtonRef = useRef(null);

  // selectedBroadcasts definition moved below after filteredData

  // selectedRowsCount will be defined after selectedBroadcasts

  const handleConfirmStopScheduleBulk = () => {
    const hasIdNine = selectedBroadcasts.some((b) => b.id === "9");

    if (hasIdNine) {
      toast.error(
        "Failed to Stop Broadcasts",
        `The ${selectedRowsCount} selected broadcasts could not be stopped. Please try again.`
      );
    } else {
      const selectedIds = new Set(selectedBroadcasts.map((b) => b.id));
      setData((prevData) =>
        prevData.map((item) =>
          selectedIds.has(item.id)
            ? {
                ...item,
                broadcastStatus: "Cancelled",
                isDisabled: true
              }
            : item
        )
      );

      toast.success(
        "Broadcasts Stopped Successfully",
        `All ${selectedRowsCount} scheduled broadcasts have been successfully stopped.`
      );

      setRowSelection({});
    }

    setShowStopScheduleBulk(false);
    if (setBulkCancelOpen) {
      setBulkCancelOpen(false);
    }
  };

  const handleCloseStopScheduleBulk = () => {
    setShowStopScheduleBulk(false);
    if (setBulkCancelOpen) {
      setBulkCancelOpen(false);
    }
  };

  const [dataColumnOrder, setDataColumnOrder] = useState(DEFAULT_ORDER);
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_VISIBILITY);
  const [showSettings, setShowSettings] = useState(false);

  const columnOrder = useMemo(() => {
    return ["select", ...dataColumnOrder, "actions"];
  }, [dataColumnOrder]);

  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState({
    mode: "",
    template: "",
    appointmentType: "",
    location: "",
    provider: "",
    scheduledDateTime: "",
    messageStatus: "",
    broadcastStatus: ""
  });
  const handleFilterChange = (columnId, value) => {
    setFilters((prev) => ({
      ...prev,
      [columnId]: value
    }));
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Date Range Filter
      const { startDate, endDate } = selectedDateRange || {};
      const dateStr = row.scheduledDateTime;
      if (dateStr) {
        const [datePart] = dateStr.split(" ");
        const [month, day, year] = datePart.split("/").map(Number);
        const rowDate = new Date(year, month - 1, day);

        if (startDate || endDate) {
          if (startDate) {
            const startMidnight = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate()
            );
            if (rowDate < startMidnight) return false;
          }

          if (endDate) {
            const endMidnight = new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate()
            );
            if (rowDate > endMidnight) return false;
          }
        } else {
          // Default to today's date
          const today = new Date();
          const todayMidnight = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          if (rowDate.getTime() !== todayMidnight.getTime()) {
            return false;
          }
        }
      }

      // 2. Column filters
      return Object.entries(filters).every(([columnId, query]) => {
        if (!query) return true;

        if (columnId === "messageStatus") {
          const { total, delivered, failed, pending } = row.messageStatus || {};
          const combined =
            `${total || ""} ${delivered || ""} ${failed || ""} ${pending || ""}`.toLowerCase();
          return combined.includes(query.toLowerCase());
        }

        const value = row[columnId];
        if (value !== undefined && value !== null) {
          return String(value).toLowerCase().includes(query.toLowerCase());
        }

        return true;
      });
    });
  }, [data, filters, selectedDateRange]);

  // Compute selected broadcasts based on rowSelection and filteredData
  const selectedBroadcasts = useMemo(() => {
    const selectedIds = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    return filteredData.filter((item) => selectedIds.includes(item.id));
  }, [rowSelection, filteredData]);

  const selectedRowsCount = selectedBroadcasts.length;

  // Sync selectedBroadcasts back to parent component
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedBroadcasts);
    }
  }, [selectedBroadcasts, onSelectionChange]);

  // Sync bulk cancel modal trigger from parent
  useEffect(() => {
    if (bulkCancelOpen) {
      setShowStopScheduleBulk(true);
    }
  }, [bulkCancelOpen]);

  useEffect(() => {
    if (setTotalItems) {
      setTotalItems(filteredData.length);
    }
  }, [filteredData.length, setTotalItems]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target)
      ) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <ReusableCheckbox
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <ReusableCheckbox
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      {
        accessorKey: "mode",
        header: ({ column }) => (
          <div className="header-content">
            Mode <RenderSortIcon isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="mode-cell">
            <span className="mode-text">
              {highlightText(row.original.mode, filters.mode)}
            </span>
            {row.original.hasError && (
              <ReusableToolTip
                content={{ label: "Failed Reason", value: "Network Outage" }}
                position="top"
              >
                <img
                  src={circleAlert}
                  alt="alert"
                  className="error-icon"
                  style={{ cursor: "pointer" }}
                />
              </ReusableToolTip>
            )}
          </div>
        )
      },
      {
        accessorKey: "template",
        header: ({ column }) => (
          <div className="header-content">
            Template <RenderSortIcon isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => {
          return highlightText(row.original.template, filters.template);
        }
      },
      {
        accessorKey: "appointmentType",
        header: ({ column }) => (
          <div className="header-content">
            Appointment Type <RenderSortIcon isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-with-pill">
            <span className="cell-text" title={row.original.appointmentType}>
              {highlightText(
                row.original.appointmentType,
                filters.appointmentType
              )}
            </span>
            <ReusableToolTip
              content={[
                "GHC-A General Health Check",
                "VAC-A Vaccination Appointment",
                "ECG-A ECG Screening",
                "FUP-A Follow-Up Consultation",
                "BPC-A Blood Pressure Check",
                "DER-A Dermatology Consultation",
                "DBC-A Diabetes Check",
                "+ 100"
              ]}
              position="top"
            >
              <span className="count-pill" style={{ cursor: "pointer" }}>
                +{row.original.appointmentCount}
              </span>
            </ReusableToolTip>
          </div>
        )
      },
      {
        accessorKey: "location",
        header: ({ column }) => (
          <div className="header-content">
            Location <RenderSortIcon isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-with-pill">
            <span className="cell-text" title={row.original.location}>
              {highlightText(row.original.location, filters.location)}
            </span>
            <ReusableToolTip
              content={[
                "Sunnyvale Medical Center,",
                "Riverbend Urgent Care,",
                "Eastside Urgent Care,",
                "Riverbend Urgent Care,",
                "Greenwood Health Clinic,",
                "Maplewood Family Practice."
              ]}
              position="top"
            >
              <span className="count-pill" style={{ cursor: "pointer" }}>
                +{row.original.locationCount}
              </span>
            </ReusableToolTip>
          </div>
        )
      },
      {
        accessorKey: "provider",
        header: ({ column }) => (
          <div className="header-content">
            Provider <RenderSortIcon isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-with-pill">
            <span className="cell-text" title={row.original.provider}>
              {highlightText(row.original.provider, filters.provider)}
            </span>
            <ReusableToolTip
              content={[
                "Olivia Smith,",
                "Ethan Brown,",
                "Sophia Green,",
                "Liam Carter,",
                "Olivia White,",
                "Noah Harris."
              ]}
              position="top"
            >
              <span className="count-pill" style={{ cursor: "pointer" }}>
                +{row.original.providerCount}
              </span>
            </ReusableToolTip>
          </div>
        )
      },
      {
        accessorKey: "scheduledDateTime",
        sortingFn: (rowA, rowB, columnId) => {
          const dateA = new Date(rowA.getValue(columnId));
          const dateB = new Date(rowB.getValue(columnId));
          return dateA.getTime() - dateB.getTime();
        },
        header: ({ column }) => (
          <div className="header-content">
            Scheduled Date/Time{" "}
            <RenderSortIcon isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => {
          return highlightText(
            row.original.scheduledDateTime,
            filters.scheduledDateTime
          );
        }
      },
      {
        accessorKey: "messageStatus",
        sortingFn: (rowA, rowB, columnId) => {
          const parseTotal = (val) => {
            if (!val || val === "-") return 0;
            return parseFloat(String(val).replace(/,/g, "")) || 0;
          };
          const totalA = parseTotal(rowA.getValue(columnId)?.total);
          const totalB = parseTotal(rowB.getValue(columnId)?.total);
          return totalA - totalB;
        },
        header: ({ column }) => (
          <div className="header-content">
            Message Status <RenderSortIcon isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => {
          const { total, delivered, failed, pending } =
            row.original.messageStatus;
          const isCancelled = row.original.broadcastStatus === "Cancelled";
          return (
            <div className="message-status-cell">
              <div className="status-row">
                <ReusableToolTip content="Total Messages" position="top">
                  <div
                    className="status-item blue"
                    style={{ cursor: "pointer" }}
                  >
                    <img src={broadcastIcon} alt="total" /> <span>{total}</span>
                  </div>
                </ReusableToolTip>
                <ReusableToolTip content="Success" position="top">
                  <div
                    className="status-item green"
                    style={{ cursor: "pointer" }}
                  >
                    <img src={completedGreenIcon} alt="delivered" />{" "}
                    <span>{delivered}</span>
                  </div>
                </ReusableToolTip>
              </div>
              <div className="status-row">
                <ReusableToolTip content="Failed" position="top">
                  <div
                    className="status-item red"
                    style={{ cursor: "pointer" }}
                  >
                    <img src={failedRedIcon} alt="failed" />{" "}
                    <span>{failed}</span>
                  </div>
                </ReusableToolTip>
                {isCancelled ? (
                  <ReusableToolTip content="Cancelled" position="top">
                    <div
                      className="status-item grey"
                      style={{ cursor: "pointer" }}
                    >
                      <img src={cancelIcon} alt="cancelled" />{" "}
                      <span>{pending}</span>
                    </div>
                  </ReusableToolTip>
                ) : (
                  <ReusableToolTip content="Pending" position="top">
                    <div
                      className="status-item yellow"
                      style={{ cursor: "pointer" }}
                    >
                      <img src={pendingYellowIcon} alt="pending" />{" "}
                      <span>{pending}</span>
                    </div>
                  </ReusableToolTip>
                )}
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: "broadcastStatus",
        header: ({ column }) => (
          <div className="header-content">
            Broadcast Status <RenderSortIcon isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => {
          const status = row.original.broadcastStatus;
          let colorClass = "";
          let iconSrc = null;

          if (status.includes("Scheduled")) {
            colorClass = "purple";
            iconSrc = scheduledDailyIcon;
          } else if (status === "Completed") {
            colorClass = "green";
            iconSrc = completedIcon;
          } else if (status.includes("Running")) {
            colorClass = "blue";
            iconSrc = runningWeeklyIcon;
          } else if (status === "Failed") {
            colorClass = "red";
            iconSrc = failedIcon;
          } else if (status === "Cancelled") {
            colorClass = "grey";
            iconSrc = cancelledIcon;
          } else if (status === "In-progress") {
            colorClass = "blue";
            iconSrc = runningWeeklyIcon;
          }

          const badgeContent = (
            <div
              className={`status-badge ${colorClass}`}
              style={{ cursor: status === "Cancelled" ? "pointer" : "default" }}
            >
              {iconSrc && (
                <img
                  src={iconSrc}
                  alt={status}
                  style={{ width: "12px", height: "12px" }}
                />
              )}
              {highlightText(status, filters.broadcastStatus)}
            </div>
          );

          if (status === "Cancelled") {
            return (
              <ReusableToolTip content="Cancelled" position="top">
                {badgeContent}
              </ReusableToolTip>
            );
          }

          return badgeContent;
        }
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => (
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              paddingRight: "8px",
              color: "#10B981",
              alignItems: "center",
              position: "relative"
            }}
          >
            <img
              src={searchGreenIcon}
              alt="search"
              style={{
                width: "20px",
                height: "20px",
                minWidth: "20px",
                minHeight: "20px",
                maxWidth: "20px",
                maxHeight: "20px",
                flexShrink: 0,
                cursor: "pointer"
              }}
              onClick={() => setShowSearch(!showSearch)}
            />
            <div
              ref={settingsButtonRef}
              style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
            >
              <img
                src={settingsIcon}
                alt="settings"
                style={{
                  minWidth: "28px",
                  minHeight: "28px",
                  flexShrink: 0,
                  cursor: "pointer"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings((prev) => !prev);
                }}
              />
            </div>
            {showSettings && (
              <div ref={settingsRef} style={{ position: "absolute" }}>
                <TableSettings
                  columnOrder={dataColumnOrder}
                  columnVisibility={columnVisibility}
                  onApply={(newOrder, newVisibility) => {
                    try {
                      setDataColumnOrder(newOrder);
                      setColumnVisibility(newVisibility);
                      toast.success(
                        "Table Settings Applied",
                        "Your table preferences have been updated successfully."
                      );
                    } catch {
                      toast.error(
                        "Failed to Apply Table Settings",
                        "Your table settings could not be applied. Please try again."
                      );
                    }
                  }}
                  onReset={() => {
                    try {
                      setDataColumnOrder(DEFAULT_ORDER);
                      setColumnVisibility(DEFAULT_VISIBILITY);
                      toast.success(
                        "Settings Reset Successfully",
                        "The table has been restored to its default settings."
                      );
                    } catch {
                      toast.error(
                        "Reset Failed",
                        "An error occurred while resetting the table settings. Please retry."
                      );
                    }
                  }}
                  onClose={() => setShowSettings(false)}
                />
              </div>
            )}
          </div>
        ),
        cell: ({ row, table }) => {
          const isMenuOpen = activeMenuId === row.original.id;
          const options = getMenuOptions(row.original.broadcastStatus);
          const rowIndex = table
            .getRowModel()
            .rows.findIndex((r) => r.id === row.id);
          const dropdownPositionClass =
            rowIndex >= 5 ? "position-top" : "position-bottom";

          return (
            <div className="actions-cell">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(isMenuOpen ? null : row.original.id);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <img src={tableMenuIcon} alt="menu" />
              </button>
              {isMenuOpen && options.length > 0 && (
                <div
                  className={`menu-dropdown ${dropdownPositionClass}`}
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  {options.map((option) => (
                    <button
                      key={option.label}
                      className="menu-item"
                      onClick={() => {
                        console.log(
                          `Action clicked: ${option.action} for row ${row.original.id}`
                        );
                        if (option.action === "reprocess") {
                          setShowReprocessDrawer(true);
                        } else if (option.action === "cancel") {
                          setSelectedCancelRow(row.original);
                        } else if (option.action === "report") {
                          window.open("https://google.com", "_blank");
                        }
                        setActiveMenuId(null);
                      }}
                    >
                      <span className="menu-item-icon">
                        <img src={option.icon} alt={option.label} />
                      </span>
                      <span className="menu-item-label">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }
      }
    ],
    [
      filters,
      activeMenuId,
      showSearch,
      showSettings,
      dataColumnOrder,
      columnVisibility,
      toast,
      setDataColumnOrder,
      setColumnVisibility,
      setActiveMenuId,
      setShowReprocessDrawer,
      setSelectedCancelRow,
      setShowSettings
    ]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
    state: {
      rowSelection,
      columnVisibility,
      columnOrder,
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: itemsPerPage
      }
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setDataColumnOrder,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="broadcast-table-container">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSortable = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    className={`col-${header.column.id} ${
                      header.column.id === "actions" && showSettings
                        ? "settings-open"
                        : ""
                    }`}
                    onClick={
                      isSortable
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    style={{ cursor: isSortable ? "pointer" : "default" }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={`search-${headerGroup.id}`}
              className={`search-filters-row ${showSearch ? "visible" : "hidden"}`}
            >
              {headerGroup.headers.map((header) => {
                const columnId = header.column.id;
                if (columnId === "select" || columnId === "actions") {
                  return (
                    <th
                      key={`search-cell-${header.id}`}
                      className={`col-${columnId}`}
                    ></th>
                  );
                }
                const placeholder = getPlaceholder(columnId);
                return (
                  <th
                    key={`search-cell-${header.id}`}
                    className={`col-${columnId}`}
                  >
                    <div className="search-input-wrapper">
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={filters[columnId] || ""}
                        onChange={(e) =>
                          handleFilterChange(columnId, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.target.blur();
                          }
                        }}
                        tabIndex={showSearch ? 0 : -1}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr className="empty-row">
              <td
                colSpan={table.getVisibleLeafColumns().length}
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: "#6b7280",
                  height: "100%"
                }}
              >
                No data found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`${row.original.hasError ? "row-error" : ""} ${
                  row.original.isDisabled ? "row-disabled" : ""
                } ${activeMenuId === row.original.id ? "row-active-menu" : ""}`}
              >
                {row.getVisibleCells().map((cell) => {
                  const isInteractiveColumn =
                    cell.column.id === "select" || cell.column.id === "actions";
                  return (
                    <td
                      key={cell.id}
                      className={`col-${cell.column.id}`}
                      onClick={
                        !isInteractiveColumn
                          ? () => setSelectedDetailsRow(row.original)
                          : undefined
                      }
                      style={
                        !isInteractiveColumn ? { cursor: "pointer" } : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showReprocessDrawer && (
        <ReProcessBroadCast
          isOpen={showReprocessDrawer}
          onClose={() => setShowReprocessDrawer(false)}
          onReprocess={(selectedPatients) => {
            console.log("Reprocessing patients:", selectedPatients);
          }}
        />
      )}

      {selectedCancelRow && (
        <CancelSchedule
          isOpen={!!selectedCancelRow}
          onClose={() => setSelectedCancelRow(null)}
          broadcastData={selectedCancelRow}
          onConfirm={() => {
            const formattedDate = ((dateTimeStr) => {
              if (!dateTimeStr) return "26 Feb 2026 at 10:30 AM";
              try {
                const dateObj = new Date(dateTimeStr);
                if (isNaN(dateObj.getTime())) return dateTimeStr;
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
            })(selectedCancelRow.scheduledDateTime);

            const patientCount =
              selectedCancelRow.messageStatus?.total || "428";

            // If it's the specific Row ID 9, simulate cancellation failure
            if (selectedCancelRow.id === "9") {
              toast.error(
                "Failed to Cancel Schedule",
                `The broadcast scheduled for ${formattedDate} could not be cancelled. Please try again.`
              );
            } else {
              // Simulate success and update local state to "Cancelled"
              setData((prevData) =>
                prevData.map((item) =>
                  item.id === selectedCancelRow.id
                    ? {
                        ...item,
                        broadcastStatus: "Cancelled",
                        isDisabled: true
                      }
                    : item
                )
              );
              toast.success(
                "Schedule Cancelled Successfully",
                `The broadcast scheduled for ${formattedDate} to ${patientCount} patients has been cancelled.`
              );
            }
            setSelectedCancelRow(null);
          }}
        />
      )}

      {selectedDetailsRow && (
        <TableBoardCastDetails
          isOpen={!!selectedDetailsRow}
          onClose={() => setSelectedDetailsRow(null)}
          broadcastData={selectedDetailsRow}
        />
      )}

      {showStopScheduleBulk && (
        <StopScheduleBulk
          isOpen={showStopScheduleBulk}
          onClose={handleCloseStopScheduleBulk}
          onConfirm={handleConfirmStopScheduleBulk}
          selectedBroadcasts={selectedBroadcasts}
        />
      )}
    </div>
  );
}

export default BroadCastTableContainer;
