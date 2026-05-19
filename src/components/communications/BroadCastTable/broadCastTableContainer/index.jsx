import { useState, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable
} from "@tanstack/react-table";
import {
  ChevronsUpDown,
  CircleAlert,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  PlayCircle,
  Ban,
  MoreVertical,
  Search,
  Settings
} from "lucide-react";
import "./style.scss";
import { mockData } from "./mockData";

function BroadCastTableContainer({
  currentPage = 1,
  itemsPerPage = 10,
  setTotalItems
}) {
  const [data] = useState(mockData);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    if (setTotalItems) {
      setTotalItems(data.length);
    }
  }, [data, setTotalItems]);

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        </div>
      )
    },
    {
      accessorKey: "mode",
      header: () => (
        <div className="header-content">
          Mode <ChevronsUpDown className="sort-icon" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="mode-cell">
          {row.original.mode}
          {row.original.hasError && <CircleAlert className="error-icon" />}
        </div>
      )
    },
    {
      accessorKey: "template",
      header: () => (
        <div className="header-content">
          Template <ChevronsUpDown className="sort-icon" />
        </div>
      )
    },
    {
      accessorKey: "appointmentType",
      header: () => (
        <div className="header-content">
          Appointment Type <ChevronsUpDown className="sort-icon" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-with-pill">
          {row.original.appointmentType}
          <span className="count-pill">+{row.original.appointmentCount}</span>
        </div>
      )
    },
    {
      accessorKey: "location",
      header: () => (
        <div className="header-content">
          Location <ChevronsUpDown className="sort-icon" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-with-pill">
          {row.original.location}
          <span className="count-pill">+{row.original.locationCount}</span>
        </div>
      )
    },
    {
      accessorKey: "provider",
      header: () => (
        <div className="header-content">
          Provider <ChevronsUpDown className="sort-icon" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-with-pill">
          {row.original.provider}
          <span className="count-pill">+{row.original.providerCount}</span>
        </div>
      )
    },
    {
      accessorKey: "scheduledDateTime",
      header: () => (
        <div className="header-content">
          Scheduled Date/Time <ChevronsUpDown className="sort-icon" />
        </div>
      )
    },
    {
      accessorKey: "messageStatus",
      header: () => <div className="header-content">Message Status</div>,
      cell: ({ row }) => {
        const { total, delivered, failed, pending } =
          row.original.messageStatus;
        return (
          <div className="message-status-cell">
            <div className="status-row">
              <div className="status-item blue">
                <MessageSquare /> <span>{total}</span>
              </div>
              <div className="status-item green">
                <CheckCircle2 /> <span>{delivered}</span>
              </div>
            </div>
            <div className="status-row">
              <div className="status-item red">
                <XCircle /> <span>{failed}</span>
              </div>
              <div className="status-item yellow">
                <RefreshCw /> <span>{pending}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "broadcastStatus",
      header: () => <div className="header-content">Broadcast Status</div>,
      cell: ({ row }) => {
        const status = row.original.broadcastStatus;
        let colorClass = "";
        let Icon = null;

        if (status.includes("Scheduled")) {
          colorClass = "purple";
          Icon = Clock;
        } else if (status === "Completed") {
          colorClass = "green";
          Icon = CheckCircle2;
        } else if (status.includes("Running")) {
          colorClass = "blue";
          Icon = PlayCircle; // Or another appropriate icon
        } else if (status === "Failed") {
          colorClass = "red";
          Icon = XCircle;
        } else if (status === "Cancelled") {
          colorClass = "grey";
          Icon = Ban;
        }

        return (
          <div className={`status-badge ${colorClass}`}>
            {Icon && <Icon />}
            {status}
          </div>
        );
      }
    },
    {
      id: "actions",
      header: () => (
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            paddingRight: "8px",
            color: "#10B981"
          }}
        >
          <Search size={18} />
          <Settings size={18} />
        </div>
      ),
      cell: () => (
        <div className="actions-cell">
          <button>
            <MoreVertical size={18} />
          </button>
        </div>
      )
    }
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: itemsPerPage
      }
    },
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
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={`${row.original.hasError ? "row-error" : ""} ${
                row.original.isDisabled ? "row-disabled" : ""
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BroadCastTableContainer;
