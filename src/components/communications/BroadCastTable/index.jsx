import { useState } from "react";
import BroadCastTableContainer from "./broadCastTableContainer/index.jsx";
import BroadCastTableHeader from "./broadCastTableHeader/index.jsx";
import BroadCastTablePagination from "./broadCastTablePagination/index.jsx";

import "./style.scss";
import { BroadcastMessage } from "../BroadcastMessage/index.jsx";

export default function BroadCastTable({
  addScheduleModal,
  setAddScheduleModal
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: null,
    endDate: null
  });

  return (
    <>
      {addScheduleModal ? (
        <BroadcastMessage handleCancel={() => setAddScheduleModal(false)} />
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
            />
          </div>
          <div className="broadcastTableContainer">
            <BroadCastTableContainer
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              setTotalItems={setTotalItems}
              selectedDateRange={selectedDateRange}
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
