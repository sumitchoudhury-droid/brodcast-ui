import { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import "./style.scss";

import { ReusableCheckbox } from "../../../../../reusableComponents/reusableCheckbox/index";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton";
import ResuablePagination from "../../../../../reusableComponents/resuablePagination/index.jsx";
import { useToast } from "../../../../../hooks/useToast";
import CloseButton from "../../../../../assets/commonIcons/CloseButton.svg";
import circleCross from "../../../../../assets/commonIcons/circleCross.svg";
import circleChecked from "../../../../../assets/commonIcons/circleChecked.svg";
import editIcon from "../../../../../assets/boardCastTableIcons/editIcon.svg";
import searchGreenIcon from "../../../../../assets/boardCastTableIcons/searchGreen.svg";

import { mockUploadPatients } from "./mockUploadPatients";

const isEmailInvalid = (email) => {
  if (!email || email === "-") return true;
  return !email.includes("@") || !email.includes(".");
};

const isPhoneInvalid = (phone) => {
  if (!phone || phone === "-") return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length !== 10;
};

const isError = (patient) => patient.reason && patient.reason !== "-";

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
    ({
      firstName,
      lastName,
      dob,
      appointmentDateTime,
      phone,
      email,
      reason
    }) => ({
      "First Name": firstName,
      "Last Name": lastName,
      "Date of Birth": dob,
      "Appointment Date/Time": appointmentDateTime,
      "Phone Number": phone,
      Email: email,
      Reason: reason === "-" ? "" : reason
    })
  );
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Patients");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const UploadFileViewList = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [patients, setPatients] = useState(() =>
    JSON.parse(JSON.stringify(mockUploadPatients))
  );
  const [editPatients, setEditPatients] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    appointmentDateTime: "",
    phone: "",
    email: "",
    reason: "-"
  });
  const [showErrorOnly, setShowErrorOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [filters, setFilters] = useState(emptyFilters);
  const [showSearch, setShowSearch] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const currentPatientsList = isEditMode ? editPatients : patients;

  const errorCount = useMemo(() => patients.filter(isError).length, [patients]);

  const handleStartEdit = () => {
    setEditPatients(JSON.parse(JSON.stringify(patients)));
    setIsEditMode(true);
  };

  const handleSaveEdits = () => {
    setPatients(editPatients);
    setIsEditMode(false);
    toast.success(
      "Changes Saved",
      "The patient records have been updated successfully."
    );
  };

  const handleCancelEdits = () => {
    setEditPatients([]);
    setIsEditMode(false);
  };

  const handleCellEdit = (id, field, value) => {
    setEditPatients((prev) =>
      prev.map((patient) => {
        if (patient.id !== id) return patient;
        const updated = { ...patient, [field]: value };
        const emailErr = isEmailInvalid(updated.email);
        const phoneErr = isPhoneInvalid(updated.phone);
        if (!emailErr && !phoneErr) {
          updated.reason = "-";
        } else if (emailErr && !phoneErr) {
          updated.reason = "Invalid Email";
        } else if (!emailErr && phoneErr) {
          updated.reason = "Invalid Number";
        }
        return updated;
      })
    );
  };

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

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = (list) => {
    const ids = list.map((p) => p.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allSelected
        ? ids.forEach((id) => next.delete(id))
        : ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleNewPatientChange = (field, value) => {
    setNewPatient((prev) => {
      const updated = { ...prev, [field]: value };
      const emailErr = isEmailInvalid(updated.email);
      const phoneErr = isPhoneInvalid(updated.phone);
      if (!emailErr && !phoneErr) updated.reason = "-";
      else if (emailErr && !phoneErr) updated.reason = "Invalid Email";
      else if (!emailErr && phoneErr) updated.reason = "Invalid Number";
      else updated.reason = "-";
      return updated;
    });
  };

  const handleConfirmAddRow = () => {
    const id = `uf${Date.now()}`;
    setPatients((prev) => [{ ...newPatient, id }, ...prev]);
    setNewPatient({
      firstName: "",
      lastName: "",
      dob: "",
      appointmentDateTime: "",
      phone: "",
      email: "",
      reason: "-"
    });
    setIsAddingRow(false);
  };

  const handleCancelAddRow = () => {
    setNewPatient({
      firstName: "",
      lastName: "",
      dob: "",
      appointmentDateTime: "",
      phone: "",
      email: "",
      reason: "-"
    });
    setIsAddingRow(false);
  };

  const baseList = useMemo(
    () =>
      showErrorOnly ? currentPatientsList.filter(isError) : currentPatientsList,
    [showErrorOnly, currentPatientsList]
  );

  const filteredPatients = useMemo(() => {
    return baseList.filter((patient) =>
      Object.entries(filters).every(([field, query]) => {
        if (!query) return true;
        const val = patient[field];
        return (
          val != null && String(val).toLowerCase().includes(query.toLowerCase())
        );
      })
    );
  }, [baseList, filters]);

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
    <div className="uploadFileViewListOverlay" onClick={onClose}>
      <div
        className="uploadFileViewListContainer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawerHeader">
          <div className="headerTitle">
            <h2>
              Patients List <span>({patients.length})</span>
            </h2>
          </div>
          <div className="headerRight">
            <button className="drawerCloseBtn" onClick={onClose}>
              <img src={CloseButton} alt="Close" />
            </button>
          </div>
        </div>

        {/* Sub-header */}
        <div className="drawerSubHeader">
          <div className="leftSide">
            <span>Show {errorCount} Error Patients</span>
            <div
              className={`toggleSwitch ${showErrorOnly ? "checked" : ""}`}
              onClick={() => {
                setShowErrorOnly((prev) => !prev);
                setCurrentPage(1);
              }}
              role="switch"
              aria-checked={showErrorOnly}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowErrorOnly((prev) => !prev);
                  setCurrentPage(1);
                }
              }}
            >
              <div className="toggleThumb" />
            </div>
          </div>
          <div className="rightSide">
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
            ) : selectedIds.size > 0 ? (
              <>
                <ReusableButton
                  label="Delete"
                  variant="primary"
                  deleteImage={true}
                />
                <ReusableButton
                  label="Export"
                  variant="primary"
                  greenDownloadImage={true}
                  onClick={() =>
                    exportToExcel(
                      sortedPatients.filter((p) => selectedIds.has(p.id)),
                      "Selected_Patients"
                    )
                  }
                />
              </>
            ) : (
              <>
                <ReusableButton
                  label="Add Patients"
                  variant="primary"
                  addImage2={true}
                  onClick={() => setIsAddingRow(true)}
                />
                <button className="editPatientsBtn" onClick={handleStartEdit}>
                  <img
                    src={editIcon}
                    alt="Edit"
                    style={{ width: "20px", height: "20px" }}
                  />
                  <span>Edit</span>
                </button>
                <ReusableButton
                  label="Export"
                  variant="primary"
                  greenDownloadImage={true}
                  onClick={() =>
                    exportToExcel(
                      sortedPatients,
                      showErrorOnly ? "Error_Patients" : "Patients_List"
                    )
                  }
                />
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="drawerContent">
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
                      <SortIcon columnKey="firstName" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("lastName")}>
                    <div className="headerCell">
                      Last Name{" "}
                      <SortIcon columnKey="lastName" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("dob")}>
                    <div className="headerCell">
                      Date of Birth{" "}
                      <SortIcon columnKey="dob" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("appointmentDateTime")}>
                    <div className="headerCell">
                      Appointment Date/Time{" "}
                      <SortIcon
                        columnKey="appointmentDateTime"
                        sortConfig={sortConfig}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSort("phone")}>
                    <div className="headerCell">
                      Phone Number{" "}
                      <SortIcon columnKey="phone" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("email")}>
                    <div className="headerCell">
                      Email{" "}
                      <SortIcon columnKey="email" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th>
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
                    {!isEditMode && <th></th>}
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
                {isAddingRow && (
                  <tr className="addNewRow">
                    <td></td>
                    <td className="editableCell">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={newPatient.firstName}
                        onChange={(e) =>
                          handleNewPatientChange("firstName", e.target.value)
                        }
                        className="editInput"
                      />
                    </td>
                    <td className="editableCell">
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={newPatient.lastName}
                        onChange={(e) =>
                          handleNewPatientChange("lastName", e.target.value)
                        }
                        className="editInput"
                      />
                    </td>
                    <td className="editableCell">
                      <input
                        type="text"
                        placeholder="MM/DD/YYYY"
                        value={newPatient.dob}
                        onChange={(e) =>
                          handleNewPatientChange("dob", e.target.value)
                        }
                        className="editInput"
                      />
                    </td>
                    <td className="editableCell">
                      <input
                        type="text"
                        placeholder="M/D/YYYY, H:MM:SS AM/PM"
                        value={newPatient.appointmentDateTime}
                        onChange={(e) =>
                          handleNewPatientChange(
                            "appointmentDateTime",
                            e.target.value
                          )
                        }
                        className="editInput"
                      />
                    </td>
                    <td
                      className={`editableCell ${isPhoneInvalid(newPatient.phone) && newPatient.phone ? "invalidCell" : ""}`}
                    >
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={newPatient.phone}
                        onChange={(e) =>
                          handleNewPatientChange("phone", e.target.value)
                        }
                        className="editInput"
                      />
                    </td>
                    <td
                      className={`editableCell ${isEmailInvalid(newPatient.email) && newPatient.email ? "invalidCell" : ""}`}
                    >
                      <input
                        type="text"
                        placeholder="Email"
                        value={newPatient.email}
                        onChange={(e) =>
                          handleNewPatientChange("email", e.target.value)
                        }
                        className="editInput"
                      />
                    </td>
                    <td>
                      <div className="addRowActions">
                        <div
                          className="cancelAddBtn"
                          onClick={handleCancelAddRow}
                        >
                          <img src={circleCross} alt="circleCross" />
                        </div>
                        <div
                          className="confirmAddBtn"
                          onClick={handleConfirmAddRow}
                        >
                          <img src={circleChecked} alt="circleChecked" />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
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
                      <td>
                        {highlightText(
                          patient.appointmentDateTime,
                          filters.appointmentDateTime
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
                          highlightText(patient.phone, filters.phone)
                        )}
                      </td>
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
                          highlightText(patient.email, filters.email)
                        )}
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

export default UploadFileViewList;
