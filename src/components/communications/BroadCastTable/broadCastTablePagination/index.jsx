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
      <div className="copyRight">
        <p className="copyRightOne">© 2026 • Checkin Asyst</p>
        <p className="copyRightOne">02/27/2026 • 09:30 AM</p>
      </div>
    </div>
  );
}
