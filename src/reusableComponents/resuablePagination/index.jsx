import { useState, useEffect, useRef } from "react";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const dropdownOptions = [10, 20, 50, 100];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(itemsPerPage);
  }, [itemsPerPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleOptionClick = (value) => {
    setInputValue(value);
    onItemsPerPageChange(value);
    setIsDropdownOpen(false);
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
        <div className="items-per-page-wrapper" ref={dropdownRef}>
          <input
            type="number"
            className="items-per-page-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={() => setIsDropdownOpen(true)}
            min="1"
          />
          <div
            className={`dropdown-arrow ${isDropdownOpen ? "rotated" : ""}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 7.5L10 12.5L5 7.5"
                stroke="#4D5761"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {isDropdownOpen && (
            <div className="pagination-dropdown-options">
              {dropdownOptions.map((option) => (
                <div
                  key={option}
                  className={`dropdown-option ${
                    option === itemsPerPage ? "selected" : ""
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
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
          <img src={ArrowLeftIcon} alt="Previous" />
        </div>
        <div className="pagination-numbers">
          {pageNumbers.map((page, index) => (
            <div
              key={index}
              className={`page-number ${page === currentPage ? "active" : ""} ${
                page === "..." ? "dots" : ""
              }`}
              onClick={() => typeof page === "number" && onPageChange(page)}
            >
              {page}
            </div>
          ))}
        </div>
        <div
          className={`pagination-arrow ${
            currentPage === totalPages ? "disabled" : ""
          }`}
          onClick={handleNextPage}
        >
          <img src={ArrowRightIcon} alt="Next" />
        </div>
      </div>
    </div>
  );
}

export default ResuablePagination;
