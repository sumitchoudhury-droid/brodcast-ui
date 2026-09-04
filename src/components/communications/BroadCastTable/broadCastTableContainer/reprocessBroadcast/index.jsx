import { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { ReusableCheckbox } from "../../../../../reusableComponents/reusableCheckbox/index";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton/index.jsx";
import ResuablePagination from "../../../../../reusableComponents/resuablePagination/index.jsx";
import { useToast } from "../../../../../hooks/useToast";

import CloseButton from "../../../../../assets/commonIcons/CloseButton.svg";
import editIcon from "../../../../../assets/commonIcons/editIcon.svg";
import searchGreenIcon from "../../../../../assets/boardCastTableIcons/searchGreen.svg";
import sortIcon from "../../../../../assets/boardCastTableIcons/sortIcon.svg";

import { mockFailedPatients } from "./mockPatientData";
import ConfirmReprocessModal from "./confirmReprocessModal";
import "./style.scss";

// Simple validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmailInvalid = (email) => {
  if (!email || email === "-") return true;
  return !EMAIL_REGEX.test(email);
};

const isPhoneInvalid = (phone) => {
  if (!phone || phone === "-") return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length !== 10;
};

const highlightText = (text, query) => {
  if (!text || text === "-") return "";
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

export function ReProcessBroadCast({ isOpen, onClose, onReprocess }) {
  const toast = useToast();
  const [patients, setPatients] = useState(() =>
    JSON.parse(JSON.stringify(mockFailedPatients))
  );
  const [editPatients, setEditPatients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Search and filter states
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
    phone: "",
    reason: ""
  });
  const [showSearch, setShowSearch] = useState(false);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset page to 1 on filter
  };

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Active list based on mode
  const currentPatientsList = isEditMode ? editPatients : patients;

  // Handle start edit mode
  const handleStartEdit = () => {
    setEditPatients(JSON.parse(JSON.stringify(patients)));
    setIsEditMode(true);
  };

  // Handle save edits
  const handleSaveEdits = () => {
    if (hasEditFormatErrors) {
      toast.error(
        "Invalid Email",
        "Email format is not correct. Please fix it before saving."
      );
      return;
    }
    setPatients(editPatients);
    setIsEditMode(false);
    toast.success(
      "Changes Saved",
      "The patient records have been updated successfully."
    );
  };

  // Handle cancel edits
  const handleCancelEdits = () => {
    setEditPatients([]);
    setIsEditMode(false);
  };

  // Handle individual patient inline edits
  const handleCellEdit = (id, field, value) => {
    setEditPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === id) {
          const updatedPatient = { ...patient, [field]: value };

          // Dynamically clear/update failure reason if both fields become valid
          const emailErr = isEmailInvalid(updatedPatient.email);
          const phoneErr = isPhoneInvalid(updatedPatient.phone);

          if (!emailErr && !phoneErr) {
            updatedPatient.reason = "-";
          } else if (emailErr && !phoneErr) {
            updatedPatient.reason = "Invalid Email";
          } else if (!emailErr && phoneErr) {
            updatedPatient.reason = "Invalid Number";
          }

          return updatedPatient;
        }
        return patient;
      })
    );
  };

  // Row selection handler
  const handleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Master selection handler
  const handleSelectAll = (filteredList) => {
    const filteredIds = filteredList.map((p) => p.id);
    const allFilteredSelected = filteredIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        // Deselect all filtered patients
        filteredIds.forEach((id) => next.delete(id));
      } else {
        // Select all filtered patients
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Sort handler
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter patients based on column search filters
  const filteredPatients = useMemo(() => {
    return currentPatientsList.filter((patient) => {
      return Object.entries(filters).every(([field, query]) => {
        if (!query) return true;
        const val = patient[field];
        if (val !== undefined && val !== null) {
          return String(val).toLowerCase().includes(query.toLowerCase());
        }
        return true;
      });
    });
  }, [currentPatientsList, filters]);

  // Sort filtered patients
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

  // Paginate sorted patients
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedPatients, currentPage, itemsPerPage]);

  const hasSelectedErrors = useMemo(() => {
    return patients
      .filter((p) => selectedIds.has(p.id))
      .some((p) => isEmailInvalid(p.email) || isPhoneInvalid(p.phone));
  }, [patients, selectedIds]);

  const hasEditFormatErrors = editPatients.some(
    (p) => p.email && p.email !== "-" && !EMAIL_REGEX.test(p.email)
  );

  const allPatientsValid = useMemo(() => {
    return patients.every(
      (p) => !isEmailInvalid(p.email) && !isPhoneInvalid(p.phone)
    );
  }, [patients]);

  const reprocessStats = useMemo(() => {
    const selectedPatients =
      selectedIds.size === 0
        ? patients
        : patients.filter((p) => selectedIds.has(p.id));
    return {
      email: selectedPatients.filter((p) => p.notificationMethod === "Email")
        .length,
      text: selectedPatients.filter((p) => p.notificationMethod === "SMS")
        .length,
      voice: selectedPatients.filter((p) => p.notificationMethod === "Voice")
        .length,
      total: selectedPatients.length
    };
  }, [patients, selectedIds]);

  const handleReprocessSubmit = () => {
    if (selectedIds.size === 0 && !allPatientsValid) {
      toast.error(
        "Reprocess Failed",
        "Please select at least one patient to reprocess."
      );
      return;
    }

    // If nothing selected but all are valid, reprocess all patients
    const selectedPatients =
      selectedIds.size === 0
        ? patients
        : patients.filter((p) => selectedIds.has(p.id));
    const hasErrors = selectedPatients.some(
      (p) => isEmailInvalid(p.email) || isPhoneInvalid(p.phone)
    );

    if (hasErrors && isEditMode) {
      toast.error(
        "Reprocess Failed",
        "Please correct the highlighted errors before reprocessing."
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmReprocess = () => {
    setShowConfirmModal(false);
    const selectedPatients =
      selectedIds.size === 0
        ? patients
        : patients.filter((p) => selectedIds.has(p.id));

    if (onReprocess) {
      onReprocess(selectedPatients);
    }
    toast.success(
      "Patients Reprocessed Successfully",
      `Reprocessing has been started for the ${selectedPatients.length} patients.`
    );
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div className="reprocessDrawerOverlay" onClick={onClose}>
        <div
          className="reprocessDrawerContainer"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="drawerHeader">
            <div className="headerTitle">
              <h2>
                Reprocess Broadcast <span>({patients.length})</span>
              </h2>
            </div>
            <button className="drawerCloseBtn" onClick={onClose}>
              <img src={CloseButton} alt="Close" />
            </button>
          </div>

          {/* Content Area */}
          <div className="drawerContent">
            <div className="failedListHeader">
              <h3>Failed Patients List</h3>
              {isEditMode ? (
                <div className="editModeActions">
                  <button className="cancelEditBtn" onClick={handleCancelEdits}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M15 5L5 15M5 5L15 15"
                        stroke="#198D85"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Cancel</span>
                  </button>
                  <button className="saveEditBtn" onClick={handleSaveEdits}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M14.167 2.78259C15.4239 3.50831 16.4694 4.5497 17.2002 5.80368C17.9309 7.05766 18.3215 8.48074 18.3332 9.93204C18.3449 11.3833 17.9774 12.8126 17.267 14.0782C16.5566 15.3438 15.528 16.4019 14.283 17.1479C13.038 17.8938 11.6198 18.3016 10.1687 18.331C8.71768 18.3603 7.28412 18.0102 6.00995 17.3153C4.73579 16.6204 3.66522 15.6047 2.90421 14.3689C2.14321 13.133 1.71817 11.7199 1.67116 10.2693L1.66699 9.99926L1.67116 9.72926C1.71783 8.29008 2.13662 6.88756 2.88669 5.65842C3.63677 4.42928 4.69254 3.41547 5.95107 2.71583C7.2096 2.01619 8.62795 1.65459 10.0678 1.66629C11.5077 1.67799 12.92 2.06259 14.167 2.78259ZM13.0895 7.74343C12.946 7.59995 12.7551 7.51375 12.5526 7.50102C12.35 7.48829 12.1498 7.54988 11.9895 7.67426L11.9112 7.74343L9.16699 10.4868L8.08949 9.41009L8.01116 9.34093C7.85081 9.21664 7.65064 9.15511 7.44816 9.16789C7.24569 9.18066 7.05483 9.26686 6.91138 9.41031C6.76792 9.55377 6.68173 9.74462 6.66895 9.9471C6.65618 10.1496 6.71771 10.3497 6.84199 10.5101L6.91116 10.5884L8.57783 12.2551L8.65616 12.3243C8.8023 12.4376 8.98202 12.4992 9.16699 12.4992C9.35197 12.4992 9.53168 12.4376 9.67783 12.3243L9.75616 12.2551L13.0895 8.92176L13.1587 8.84343C13.283 8.68309 13.3446 8.48288 13.3319 8.28036C13.3192 8.07784 13.233 7.88692 13.0895 7.74343Z"
                        fill="white"
                      />
                    </svg>
                    <span>Save</span>
                  </button>
                </div>
              ) : (
                <button className="editPatientsBtn" onClick={handleStartEdit}>
                  <img src={editIcon} alt="Edit" />
                  <span>Edit Patients</span>
                </button>
              )}
            </div>

            {/* Table Container */}
            <div className="drawerTableWrapper">
              <table>
                <thead>
                  <tr>
                    {!isEditMode && (
                      <th style={{ width: "40px" }}>
                        <ReusableCheckbox
                          checked={
                            filteredPatients.length > 0 &&
                            filteredPatients.every((p) => selectedIds.has(p.id))
                          }
                          onChange={() => handleSelectAll(filteredPatients)}
                        />
                      </th>
                    )}
                    <th onClick={() => handleSort("firstName")}>
                      <div className="headerCell">
                        First Name{" "}
                        <img src={sortIcon} alt="Sort" className="sortIcon" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("lastName")}>
                      <div className="headerCell">
                        Last Name{" "}
                        <img src={sortIcon} alt="Sort" className="sortIcon" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("dob")}>
                      <div className="headerCell">
                        Date of Birth{" "}
                        <img src={sortIcon} alt="Sort" className="sortIcon" />
                      </div>
                    </th>
                    <th onClick={() => handleSort("email")}>
                      <div className="headerCell">
                        Email{" "}
                        <img src={sortIcon} alt="Sort" className="sortIcon" />
                      </div>
                    </th>
                    <th>Phone Number</th>
                    <th onClick={() => handleSort("reason")}>
                      <div className="headerCell">
                        Reason{" "}
                        <img src={sortIcon} alt="Sort" className="sortIcon" />
                      </div>
                    </th>
                    <th style={{ width: "50px" }}>
                      <img
                        src={searchGreenIcon}
                        alt="Search"
                        className="tableSearchIcon"
                        onClick={() => {
                          if (showSearch) {
                            setFilters({
                              firstName: "",
                              lastName: "",
                              dob: "",
                              email: "",
                              phone: "",
                              reason: ""
                            });
                          }
                          setShowSearch(!showSearch);
                        }}
                      />
                    </th>
                  </tr>
                  {showSearch && (
                    <tr className="search-filters-row">
                      {!isEditMode && <th></th>}
                      <th>
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={filters.firstName}
                            onChange={(e) =>
                              handleFilterChange("firstName", e.target.value)
                            }
                          />
                        </div>
                      </th>
                      <th>
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={filters.lastName}
                            onChange={(e) =>
                              handleFilterChange("lastName", e.target.value)
                            }
                          />
                        </div>
                      </th>
                      <th>
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={filters.dob}
                            onChange={(e) =>
                              handleFilterChange("dob", e.target.value)
                            }
                          />
                        </div>
                      </th>
                      <th>
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={filters.email}
                            onChange={(e) =>
                              handleFilterChange("email", e.target.value)
                            }
                          />
                        </div>
                      </th>
                      <th>
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={filters.phone}
                            onChange={(e) =>
                              handleFilterChange("phone", e.target.value)
                            }
                          />
                        </div>
                      </th>
                      <th>
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={filters.reason}
                            onChange={(e) =>
                              handleFilterChange("reason", e.target.value)
                            }
                          />
                        </div>
                      </th>
                      <th></th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {paginatedPatients.map((patient) => {
                    const emailErr = isEmailInvalid(patient.email);
                    const phoneErr = isPhoneInvalid(patient.phone);

                    return (
                      <tr
                        key={patient.id}
                        className={
                          selectedIds.has(patient.id) ? "rowSelected" : ""
                        }
                      >
                        {!isEditMode && (
                          <td>
                            <ReusableCheckbox
                              checked={selectedIds.has(patient.id)}
                              onChange={() => handleSelectRow(patient.id)}
                            />
                          </td>
                        )}
                        <td>
                          {highlightText(patient.firstName, filters.firstName)}
                        </td>
                        <td>
                          {highlightText(patient.lastName, filters.lastName)}
                        </td>
                        <td>{highlightText(patient.dob, filters.dob)}</td>
                        <td
                          className={`${emailErr ? "invalidCell" : ""} ${isEditMode ? "editableCell" : ""}`}
                        >
                          {isEditMode ? (
                            <input
                              type="text"
                              value={patient.email === "-" ? "" : patient.email}
                              onChange={(e) =>
                                handleCellEdit(
                                  patient.id,
                                  "email",
                                  e.target.value
                                )
                              }
                              className="editInput"
                            />
                          ) : (
                            highlightText(patient.email, filters.email)
                          )}
                        </td>
                        <td
                          className={`${phoneErr ? "invalidCell" : ""} ${isEditMode ? "editableCell" : ""}`}
                        >
                          {isEditMode ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={patient.phone === "-" ? "" : patient.phone}
                              onChange={(e) =>
                                handleCellEdit(
                                  patient.id,
                                  "phone",
                                  e.target.value.replace(/\D/g, "").slice(0, 10)
                                )
                              }
                              className="editInput"
                            />
                          ) : (
                            highlightText(patient.phone, filters.phone)
                          )}
                        </td>
                        <td className="reasonCell">
                          {highlightText(patient.reason, filters.reason)}
                        </td>
                        <td></td>
                      </tr>
                    );
                  })}
                  {paginatedPatients.length === 0 && (
                    <tr>
                      <td
                        colSpan={isEditMode ? "7" : "8"}
                        style={{
                          textAlign: "center",
                          padding: "24px",
                          color: "#6b7280"
                        }}
                      >
                        No failed patients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="drawerFooter">
            {/* Pagination Controls */}
            {sortedPatients.length > 0 && (
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
            )}

            <div className="drawerFooterBtn">
              <ReusableButton
                label="Cancel"
                variant="primary"
                onClick={onClose}
              />
              <ReusableButton
                label="Reprocess"
                variant="secondary"
                onClick={handleReprocessSubmit}
                disabled={
                  isEditMode ||
                  (!allPatientsValid && selectedIds.size === 0) ||
                  hasSelectedErrors
                }
              />
            </div>
          </div>
        </div>
      </div>
      {showConfirmModal && (
        <ConfirmReprocessModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmReprocess}
          patientCount={reprocessStats.total}
          stats={reprocessStats}
          reprocessDateTime={new Date()}
        />
      )}
    </>,
    document.body
  );
}

export default ReProcessBroadCast;
