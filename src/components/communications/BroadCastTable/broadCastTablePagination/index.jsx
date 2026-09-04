import ResuablePagination from "../../../../reusableComponents/resuablePagination/index.jsx";

import "./style.scss";

export default function BroadCastTablePagination({
  totalItems = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  onItemsPerPageChange,
  itemName = "Broadcasts"
}) {
  // const currentYear = new Date().getFullYear();

  // const formatCurrentDateTime = () => {
  //   const now = new Date();
  //   const dateStr = new Intl.DateTimeFormat("en-US", {
  //     month: "2-digit",
  //     day: "2-digit",
  //     year: "numeric"
  //   }).format(now);
  //   const timeStr = new Intl.DateTimeFormat("en-US", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     hour12: true
  //   }).format(now);
  //   return `${dateStr} • ${timeStr}`;
  // };

  return (
    <div className="broadCastTablePagination">
      <div className="paginationContainer">
        <ResuablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          itemName={itemName}
        />
      </div>
      {/* <div className="copyRight">
        <p className="copyRightOne">© {currentYear} • Checkin Asyst</p>
        <p className="copyRightOne">{formatCurrentDateTime()}</p>
      </div> */}
    </div>
  );
}
