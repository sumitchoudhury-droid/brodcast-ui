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

const computeReason = (patient) => {
  const missing = [];
  if (
    !patient.firstName ||
    !patient.firstName.trim() ||
    patient.firstName === "-"
  )
    missing.push("First Name");
  if (!patient.lastName || !patient.lastName.trim() || patient.lastName === "-")
    missing.push("Last Name");
  if (
    !patient.dob ||
    patient.dob === "-" ||
    patient.dob.replace(/\D/g, "").length < 8
  )
    missing.push("DOB");
  if (isPhoneInvalid(patient.phone)) missing.push("Phone");
  if (isEmailInvalid(patient.email)) missing.push("Email");
  return missing.length > 0 ? `Missing: ${missing.join(", ")}` : "-";
};

const isError = (patient) => patient.reason && patient.reason !== "-";

const formatDob = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

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
  phone: "",
  email: ""
};

const exportToExcel = (patients, fileName) => {
  const rows = patients.map(
    ({ firstName, lastName, dob, phone, email, reason }) => ({
      "First Name": firstName,
      "Last Name": lastName,
      "Date of Birth": dob,
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
    JSON.parse(JSON.stringify(mockUploadPatients)).map((p) => ({
      ...p,
      reason: computeReason(p)
    }))
  );
  const [editPatients, setEditPatients] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    dob: "",
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
        updated.reason = computeReason(updated);
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
      const updated = {
        ...prev,
        [field]:
          field === "dob"
            ? formatDob(value)
            : field === "phone"
              ? formatPhone(value)
              : value
      };
      updated.reason = computeReason(updated);
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
                  <span>Cancel</span>
                </button>
                <button className="saveEditBtn" onClick={handleSaveEdits}>
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
                    {["firstName", "lastName", "dob", "phone", "email"].map(
                      (field) => (
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
                      )
                    )}
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {isAddingRow &&
                  (() => {
                    const hasAddRowError =
                      !newPatient.firstName.trim() ||
                      !newPatient.lastName.trim() ||
                      !newPatient.dob ||
                      newPatient.dob.replace(/\D/g, "").length < 8 ||
                      (isPhoneInvalid(newPatient.phone) &&
                        isEmailInvalid(newPatient.email));
                    return (
                      <tr className="addNewRow">
                        <td></td>
                        <td className="editableCell">
                          <input
                            type="text"
                            placeholder="First Name"
                            value={newPatient.firstName}
                            onChange={(e) =>
                              handleNewPatientChange(
                                "firstName",
                                e.target.value
                              )
                            }
                            className={`editInput${!newPatient.firstName.trim() ? " editInput--invalid" : ""}`}
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
                            className={`editInput${!newPatient.lastName.trim() ? " editInput--invalid" : ""}`}
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
                            className={`editInput${newPatient.dob && newPatient.dob.replace(/\D/g, "").length < 8 ? " editInput--invalid" : ""}`}
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
                            className={`editInput${newPatient.phone && isPhoneInvalid(newPatient.phone) ? " editInput--invalid" : ""}`}
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
                              className={`confirmAddBtn${hasAddRowError ? " confirmAddBtn--disabled" : ""}`}
                              onClick={
                                hasAddRowError ? undefined : handleConfirmAddRow
                              }
                            >
                              <img src={circleChecked} alt="circleChecked" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })()}
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
                      colSpan={isEditMode ? "6" : "7"}
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
