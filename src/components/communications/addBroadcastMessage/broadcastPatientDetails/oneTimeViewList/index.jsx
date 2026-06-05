import { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import "./style.scss";

import { ReusableButton } from "../../../../../reusableComponents/resuableButton";
import ResuablePagination from "../../../../../reusableComponents/resuablePagination/index.jsx";
import CloseButton from "../../../../../assets/commonIcons/CloseButton.svg";
import searchGreenIcon from "../../../../../assets/boardCastTableIcons/searchGreen.svg";

import { mockTargetPatients } from "../targetViewList/mockPatientData";

const SortIcon = ({ columnKey, sortConfig }) => {
  const isActive = sortConfig.key === columnKey;
  const direction = isActive ? sortConfig.direction : null;

  const upColor = direction === "asc" ? "#107A6C" : "#77C1B6";
  const downColor = direction === "desc" ? "#107A6C" : "#77C1B6";

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

const emptyFilters = {
  firstName: "",
  lastName: "",
  dob: "",
  appointmentDateTime: "",
  phone: "",
  email: ""
};

const exportToExcel = (patients, fileName) => {
  const rows = patients.map(
    ({ firstName, lastName, dob, appointmentDateTime, phone, email }) => ({
      "First Name": firstName,
      "Last Name": lastName,
      "Date of Birth": dob,
      "Appointment Date/Time": appointmentDateTime,
      "Phone Number": phone,
      Email: email
    })
  );
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Patients");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const OneTimeViewList = ({ isOpen, onClose }) => {
  const [filters, setFilters] = useState(emptyFilters);
  const [showSearch, setShowSearch] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  const filteredPatients = useMemo(() => {
    return mockTargetPatients.filter((patient) =>
      Object.entries(filters).every(([field, query]) => {
        if (!query) return true;
        const val = patient[field];
        return (
          val != null && String(val).toLowerCase().includes(query.toLowerCase())
        );
      })
    );
  }, [filters]);

  const sortedPatients = useMemo(() => {
    if (!sortConfig.key) return filteredPatients;
    return [...filteredPatients].sort((a, b) => {
      const aVal = String(a[sortConfig.key] || "").toLowerCase();
      const bVal = String(b[sortConfig.key] || "").toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredPatients, sortConfig]);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPatients.slice(start, start + itemsPerPage);
  }, [sortedPatients, currentPage, itemsPerPage]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="oneTimeViewListOverlay" onClick={onClose}>
      <div
        className="oneTimeViewListContainer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawerHeader">
          <div className="headerTitle">
            <h2>
              Patients List <span>({mockTargetPatients.length})</span>
            </h2>
          </div>
          <div className="headerRight">
            <ReusableButton
              label="Export"
              variant="primary"
              greenDownloadImage={true}
              onClick={() => exportToExcel(sortedPatients, "Patients_List")}
            />
            <button className="drawerCloseBtn" onClick={onClose}>
              <img src={CloseButton} alt="Close" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="drawerContent">
          <div className="drawerTableWrapper">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort("firstName")}>
                    <div className="headerCell">
                      First Name
                      <SortIcon columnKey="firstName" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("lastName")}>
                    <div className="headerCell">
                      Last Name
                      <SortIcon columnKey="lastName" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("dob")}>
                    <div className="headerCell">
                      Date of Birth
                      <SortIcon columnKey="dob" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("appointmentDateTime")}>
                    <div className="headerCell">
                      Appointment Date/Time
                      <SortIcon
                        columnKey="appointmentDateTime"
                        sortConfig={sortConfig}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSort("phone")}>
                    <div className="headerCell">
                      Phone Number
                      <SortIcon columnKey="phone" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("email")}>
                    <div className="headerCell">
                      Email
                      <SortIcon columnKey="email" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th style={{ width: "50px" }}>
                    <img
                      src={searchGreenIcon}
                      alt="Search"
                      className="tableSearchIcon"
                      onClick={() => {
                        if (showSearch) setFilters(emptyFilters);
                        setShowSearch((prev) => !prev);
                      }}
                    />
                  </th>
                </tr>
                {showSearch && (
                  <tr className="search-filters-row">
                    {[
                      "firstName",
                      "lastName",
                      "dob",
                      "appointmentDateTime",
                      "phone",
                      "email"
                    ].map((field) => (
                      <th key={field}>
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={filters[field]}
                            onChange={(e) =>
                              handleFilterChange(field, e.target.value)
                            }
                          />
                        </div>
                      </th>
                    ))}
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      {highlightText(patient.firstName, filters.firstName)}
                    </td>
                    <td>{highlightText(patient.lastName, filters.lastName)}</td>
                    <td>{highlightText(patient.dob, filters.dob)}</td>
                    <td>
                      {highlightText(
                        patient.appointmentDateTime,
                        filters.appointmentDateTime
                      )}
                    </td>
                    <td>{highlightText(patient.phone, filters.phone)}</td>
                    <td>{highlightText(patient.email, filters.email)}</td>
                    <td></td>
                  </tr>
                ))}
                {paginatedPatients.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "#6b7280"
                      }}
                    >
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        {sortedPatients.length > 0 && (
          <div className="drawerFooter">
            <div className="drawerPagination">
              <ResuablePagination
                currentPage={currentPage}
                totalItems={sortedPatients.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(val) => {
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                itemName="Patients"
              />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default OneTimeViewList;
