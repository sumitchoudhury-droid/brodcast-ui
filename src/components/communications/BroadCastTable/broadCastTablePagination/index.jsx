import ResuablePagination from "../../../../reusableComponents/resuablePagination/index.jsx";

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
      <ResuablePagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
        itemName={itemName}
      />
    </div>
  );
}
