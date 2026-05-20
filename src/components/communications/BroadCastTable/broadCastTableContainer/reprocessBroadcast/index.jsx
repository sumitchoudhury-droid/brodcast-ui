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
import "./style.scss";

// Simple validation helpers
const isEmailInvalid = (email) => {
  if (!email || email === "-") return true;
  return !email.includes("@") || !email.includes(".");
};

const isPhoneInvalid = (phone) => {
  if (!phone || phone === "-") return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length !== 10;
};

export function ReProcessBroadCast({ isOpen, onClose, onReprocess }) {
  const toast = useToast();
  const [patients, setPatients] = useState(() =>
    JSON.parse(JSON.stringify(mockFailedPatients))
  );
  const [editPatients, setEditPatients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(mockFailedPatients.map((p) => p.id))
  );
  const [isEditMode, setIsEditMode] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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

  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery) return currentPatientsList;
    const lowerQuery = searchQuery.toLowerCase();
    return currentPatientsList.filter(
      (patient) =>
        patient.firstName.toLowerCase().includes(lowerQuery) ||
        patient.lastName.toLowerCase().includes(lowerQuery) ||
        patient.email.toLowerCase().includes(lowerQuery) ||
        patient.phone.toLowerCase().includes(lowerQuery) ||
        patient.reason.toLowerCase().includes(lowerQuery)
    );
  }, [currentPatientsList, searchQuery]);

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

  const handleReprocessSubmit = () => {
    if (selectedIds.size === 0) {
      toast.error(
        "Reprocess Failed",
        "Please select at least one patient to reprocess."
      );
      return;
    }

    // Verify if any selected patient still has validation errors
    const selectedPatients = patients.filter((p) => selectedIds.has(p.id));
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

    // Success flow
    if (onReprocess) {
      onReprocess(selectedPatients);
    }
    toast.success(
      "Reprocess Initiated",
      `Reprocessing broadcast for ${selectedIds.size} selected patients.`
    );
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
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
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                      stroke="#107a6c"
                      strokeWidth="1.66667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Cancel</span>
                </button>
                <button className="saveEditBtn" onClick={handleSaveEdits}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                      stroke="white"
                      strokeWidth="1.66667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
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

          {/* Search bar inside drawer table if active */}
          {showSearch && (
            <div className="drawerSearchWrapper">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset page to 1 on search
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  className="clearSearchBtn"
                  onClick={() => setSearchQuery("")}
                >
                  ✖
                </button>
              )}
            </div>
          )}

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
                  <th style={{ width: "40px", textAlign: "right" }}>
                    <img
                      src={searchGreenIcon}
                      alt="Search"
                      className="tableSearchIcon"
                      onClick={() => setShowSearch(!showSearch)}
                    />
                  </th>
                </tr>
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
                      <td>{patient.firstName}</td>
                      <td>{patient.lastName}</td>
                      <td>{patient.dob}</td>
                      <td
                        className={`${emailErr ? "invalidCell" : ""} ${isEditMode ? "editableCell" : ""}`}
                      >
                        {isEditMode ? (
                          <input
                            type="text"
                            value={patient.email}
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
                          patient.email
                        )}
                      </td>
                      <td
                        className={`${phoneErr ? "invalidCell" : ""} ${isEditMode ? "editableCell" : ""}`}
                      >
                        {isEditMode ? (
                          <input
                            type="text"
                            value={patient.phone}
                            onChange={(e) =>
                              handleCellEdit(
                                patient.id,
                                "phone",
                                e.target.value
                              )
                            }
                            className="editInput"
                          />
                        ) : (
                          patient.phone
                        )}
                      </td>
                      <td className="reasonCell">{patient.reason}</td>
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
              disabled={isEditMode || selectedIds.size === 0}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ReProcessBroadCast;
