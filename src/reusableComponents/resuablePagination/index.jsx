import "./style.scss";

const LeftArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 18L9 12L15 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RightArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 18L15 12L9 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DownArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function ResuablePagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange = () => {},
  onItemsPerPageChange = () => {},
  itemsPerPageOptions = [10, 20, 30, 40, 50],
  itemName = "Items"
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages
    ];
  };

  const pageNumbers = getPageNumbers();

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="reusable-pagination-container">
      <div className="pagination-left">
        <div className="items-per-page-select">
          <span>{itemsPerPage}</span>
          <DownArrowIcon />
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <span className="pagination-info">
          of {totalItems} {itemName}
        </span>
      </div>

      <div className="pagination-right">
        <div
          className={`pagination-arrow ${currentPage === 1 ? "disabled" : ""}`}
          onClick={handlePrevPage}
        >
          <LeftArrowIcon />
        </div>

        <div className="pagination-numbers">
          {pageNumbers.map((page, index) => (
            <div
              key={index}
              className={`page-number ${page === currentPage ? "active" : ""} ${page === "..." ? "dots" : ""}`}
              onClick={() => typeof page === "number" && onPageChange(page)}
            >
              {page}
            </div>
          ))}
        </div>

        <div
          className={`pagination-arrow ${currentPage === totalPages ? "disabled" : ""}`}
          onClick={handleNextPage}
        >
          <RightArrowIcon />
        </div>
      </div>
    </div>
  );
}

export default ResuablePagination;
