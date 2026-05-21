import { useState, useEffect } from "react";

import ArrowRightIcon from "../../assets/pagination/rightArrowIcon.svg";
import ArrowLeftIcon from "../../assets/pagination/leftArrowIcon.svg";

import "./style.scss";

function ResuablePagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange = () => {},
  onItemsPerPageChange = () => {},
  itemName = "Items"
}) {
  const [inputValue, setInputValue] = useState(itemsPerPage);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(itemsPerPage);
  }, [itemsPerPage]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onItemsPerPageChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setInputValue(itemsPerPage);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
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
        <input
          type="number"
          className="items-per-page-input"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          min="1"
        />
        <span className="pagination-info">
          of {totalItems} {itemName}
        </span>
      </div>

      <div className="pagination-right">
        <div
          className={`pagination-arrow ${currentPage === 1 ? "disabled" : ""}`}
          onClick={handlePrevPage}
        >
          <img src={ArrowLeftIcon} alt="Previous" />
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
          <img src={ArrowRightIcon} alt="Next" />
        </div>
      </div>
    </div>
  );
}

export default ResuablePagination;
