import { useState, useRef, useCallback } from "react";
import BroadCastTableContainer from "./broadCastTableContainer/index.jsx";
import BroadCastTableHeader from "./broadCastTableHeader/index.jsx";
import BroadCastTablePagination from "./broadCastTablePagination/index.jsx";
import { useToast } from "../../../hooks/useToast";

import "./style.scss";
import { BroadcastMessage } from "../BroadcastMessage/index.jsx";

export default function BroadCastTable({
  addScheduleModal,
  setAddScheduleModal
}) {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [selectedBroadcasts, setSelectedBroadcasts] = useState([]);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [highlightFirstRow, setHighlightFirstRow] = useState(false);
  const highlightTimerRef = useRef(null);

  const handleScheduleConfirmed = useCallback(() => {
    setAddScheduleModal(false);
    setHighlightFirstRow(true);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(
      () => setHighlightFirstRow(false),
      3000
    );
  }, [setAddScheduleModal]);

  return (
    <>
      {addScheduleModal ? (
        <BroadcastMessage handleCancel={handleScheduleConfirmed} />
      ) : (
        <div className="broadcastTable">
          <div className="broadcastTableHeader">
            <BroadCastTableHeader
              handleAddSchedule={() => setAddScheduleModal(true)}
              selectedDateRange={selectedDateRange}
              onDateRangeChange={setSelectedDateRange}
              onTodayClick={() =>
                setSelectedDateRange({
                  startDate: new Date(),
                  endDate: new Date()
                })
              }
              selectedBroadcasts={selectedBroadcasts}
              onBulkCancel={() => setBulkCancelOpen(true)}
              onBulkReport={() => {
                toast.success(
                  "Report Generated",
                  `The summary report for ${selectedBroadcasts.length} selected broadcasts has been generated successfully.`
                );
              }}
            />
          </div>
          <div className="broadcastTableContainer">
            <BroadCastTableContainer
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              setTotalItems={setTotalItems}
              selectedDateRange={selectedDateRange}
              bulkCancelOpen={bulkCancelOpen}
              setBulkCancelOpen={setBulkCancelOpen}
              onSelectionChange={setSelectedBroadcasts}
              highlightFirstRow={highlightFirstRow}
            />
          </div>
          <div className="broadcastTablePagination">
            <BroadCastTablePagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      )}
    </>
  );
}
