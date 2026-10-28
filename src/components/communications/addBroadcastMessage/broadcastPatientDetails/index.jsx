import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useBroadcastForm } from "../../broadcastFormContext";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton/index";
import { useBroadcastConfigGet as useGet } from "../../../../hooks/useBroadcastConfigGet";
import { useToast } from "../../../../hooks/useToast";
import { ENDPOINTS } from "../../../../api/endpoints.js";
import { BROADCAST_CONFIG_HEADERS } from "../../../../api/api.jsx";
import "./style.scss";
import PatientUploadFile from "./patientUploadFile";
import OneTimeBroadcast from "./oneTimeBroadcast";
import TargetRecipients from "./targetRecipients";
import TargetViewList from "./targetViewList";
import OneTimeViewList from "./oneTimeViewList";
import UploadFileViewList from "./uploadFileViewList";
import { mockTargetPatients } from "./targetViewList/mockPatientData";
import { isError, parseUploadedFileToPatients } from "./uploadFileUtils";

const exportToExcel = (patients, sheetName, fileName) => {
  const rows = patients.map(
    ({
      firstName,
      lastName,
      dob,
      appointmentDateTime,
      phone,
      email,
      reason,
      group
    }) => {
      const row = {
        "First Name": firstName,
        "Last Name": lastName,
        "Date of Birth": dob,
        "Appointment Date/Time": appointmentDateTime,
        "Phone Number": phone,
        Email: email
      };
      if (reason !== undefined) row["Reason"] = reason === "-" ? "" : reason;
      if (group !== undefined) row["Group"] = group;
      return row;
    }
  );
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const mapApiPatient = (p) => ({
  firstName: p.firstName ?? "",
  lastName: p.lastName ?? "",
  dob: p.dateOfBirth
    ? new Date(p.dateOfBirth).toLocaleDateString("en-US")
    : "—",
  appointmentDateTime: p.appointmentDateTime
    ? new Date(p.appointmentDateTime).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    : "—",
  phone: p.phoneNumber ?? "—",
  email: p.emailAddress ?? "—"
});

const buildExportData = (
  patientType,
  includeOptOut,
  searchPatients = [],
  uploadedPatients = []
) => {
  if (patientType === "targetRecipients") {
    if (includeOptOut) {
      const combined = searchPatients.map((p) => ({
        ...mapApiPatient(p),
        group:
          p.isOptedOutEmail || p.isOptedOutSms ? "Opt Out" : "Patients Found"
      }));
      return {
        data: combined,
        sheet: "Patients",
        file: "Target_Recipients_Patients"
      };
    }
    return {
      data: searchPatients.map(mapApiPatient),
      sheet: "Patients",
      file: "Target_Recipients_Patients"
    };
  }
  if (patientType === "uploadFile") {
    return {
      data: uploadedPatients,
      sheet: "Patients",
      file: "Upload_File_Patients"
    };
  }
  if (patientType === "oneTimeBroadcast") {
    return {
      data: searchPatients.map(mapApiPatient),
      sheet: "Patients",
      file: "One_Time_Broadcast_Patients"
    };
  }
  return {
    data: mockTargetPatients,
    sheet: "Patients",
    file: "Target_Recipients_Patients"
  };
};

function BroadcastPatientDetails({
  patientType,
  setPatientType,
  onFileChange,
  broadcastStartDate,
  setBroadcastStartDate,
  broadcastEndDate,
  setBroadcastEndDate,
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  ageFilter,
  setAgeFilter,
  ageYear,
  setAgeYear,
  ageMonth,
  setAgeMonth,
  ageError,
  setAgeError
}) {
  const {
    appointmentType,
    setAppointmentType,
    location,
    setLocation,
    provider,
    setProvider,
    gender,
    setGender,
    modality,
    setModality,
    includeOptOut,
    setIncludeOptOut,
    patientsFoundForType,
    setPatientsFoundForType,
    uploadedFile,
    setTotalPatientsFound
  } = useBroadcastForm();

  const toast = useToast();

  const { data: patientTypesData } = useGet(
    ["patient-types"],
    ENDPOINTS.broadcastConfig.PATIENT_TYPES,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const patientTypes = (patientTypesData?.data ?? []).map((pt) => ({
    id: pt.id,
    label: pt.name,
    value: pt.name.toLowerCase().replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
  }));

  const [showViewList, setShowViewList] = useState(false);
  const [showOneTimeViewList, setShowOneTimeViewList] = useState(false);
  const [showUploadViewList, setShowUploadViewList] = useState(false);
  const [searchPatients, setSearchPatients] = useState([]);
  const [searchTotalCount, setSearchTotalCount] = useState(0);
  const [uploadedPatients, setUploadedPatients] = useState([]);

  useEffect(() => {
    let cancelled = false;
    parseUploadedFileToPatients(uploadedFile)
      .then((rows) => {
        if (!cancelled) setUploadedPatients(rows);
      })
      .catch(() => {
        if (!cancelled) setUploadedPatients([]);
      });
    return () => {
      cancelled = true;
    };
  }, [uploadedFile]);

  const uploadTotalCount = uploadedPatients.length;
  const uploadErrorCount = uploadedPatients.filter(isError).length;
  const uploadEligibleCount = uploadTotalCount - uploadErrorCount;

  const totalPatientsCount = useMemo(() => {
    if (patientType === "uploadFile") return uploadTotalCount;
    return searchTotalCount;
  }, [patientType, searchTotalCount, uploadTotalCount]);

  useEffect(() => {
    setTotalPatientsFound(totalPatientsCount);
  }, [totalPatientsCount, setTotalPatientsFound]);

  const handlePatientTypeChange = (newType) => {
    setPatientType(newType);
    setPatientsFoundForType(null);
    setSearchPatients([]);
    setSearchTotalCount(0);

    if (newType !== "targetRecipients") {
      setAppointmentType("");
      setLocation("");
      setProvider("");
      setGender("");
      setModality("");
      setIncludeOptOut(false);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      setStartDateTime(start);
      setEndDateTime(null);
      setAgeFilter("");
      setAgeYear("");
      setAgeMonth("");
      setAgeError("");
    }

    if (newType !== "oneTimeBroadcast") {
      const broadcastStart = new Date();
      broadcastStart.setHours(0, 0, 0, 0);
      setBroadcastStartDate(broadcastStart);
      setBroadcastEndDate(null);
    }

    if (newType !== "uploadFile") {
      onFileChange?.(null);
    }
  };

  const showPatientsFound = patientsFoundForType === patientType;

  return (
    <div className="broadcastPatientDetailsContainer">
      <div className="patientDetailsHeader">
        <h1>Patient Details</h1>
      </div>

      <div className="patientDetailsForm">
        <div className="patientTypeSection">
          <div className="patientDetailsLabel">
            <p>Patient Selection(s)</p>
            <span>*</span>
          </div>

          <div className="patientDetailsValue">
            {patientTypes.map((pt) => (
              <ReusableRadioButton
                key={pt.id}
                label={pt.label}
                value={pt.value}
                name="patientType"
                checked={patientType === pt.value}
                onChange={() => handlePatientTypeChange(pt.value)}
              />
            ))}
          </div>
        </div>

        {patientType === "uploadFile" && (
          <PatientUploadFile
            onFileChange={(file) => {
              onFileChange?.(file);
              setPatientsFoundForType(file ? "uploadFile" : null);
            }}
          />
        )}

        {patientType === "oneTimeBroadcast" && (
          <OneTimeBroadcast
            startDateTime={broadcastStartDate}
            setStartDateTime={setBroadcastStartDate}
            endDateTime={broadcastEndDate}
            setEndDateTime={setBroadcastEndDate}
            onSearch={(patients, totalCount) => {
              setSearchPatients(patients);
              setSearchTotalCount(totalCount);
              setPatientsFoundForType("oneTimeBroadcast");
            }}
          />
        )}

        {patientType === "targetRecipients" && (
          <TargetRecipients
            appointmentType={appointmentType}
            setAppointmentType={setAppointmentType}
            location={location}
            setLocation={setLocation}
            provider={provider}
            setProvider={setProvider}
            ageFilter={ageFilter}
            setAgeFilter={setAgeFilter}
            ageYear={ageYear}
            setAgeYear={setAgeYear}
            ageMonth={ageMonth}
            setAgeMonth={setAgeMonth}
            ageError={ageError}
            setAgeError={setAgeError}
            gender={gender}
            setGender={setGender}
            modality={modality}
            setModality={setModality}
            startDateTime={startDateTime}
            setStartDateTime={setStartDateTime}
            endDateTime={endDateTime}
            setEndDateTime={setEndDateTime}
            includeOptOut={includeOptOut}
            setIncludeOptOut={setIncludeOptOut}
            onSearch={(patients, totalCount) => {
              setSearchPatients(patients);
              setSearchTotalCount(totalCount);
              setPatientsFoundForType("targetRecipients");
            }}
          />
        )}
        {showPatientsFound && (
          <div className="patientsFoundContainer">
            <div className="patientsFoundHeading">
              <p>Patients Found</p>
              <div className="patientCountContainer">
                <ReusableButton
                  label="Export"
                  variant="primary"
                  greenDownloadImage={true}
                  onClick={() => {
                    const { data, sheet, file } = buildExportData(
                      patientType,
                      includeOptOut,
                      searchPatients,
                      uploadedPatients
                    );
                    if (!data || data.length === 0) {
                      toast.error(
                        "No patient records found for the selected criteria."
                      );
                      return;
                    }
                    exportToExcel(data, sheet, file);
                  }}
                />
                <ReusableButton
                  label="View"
                  variant="primary"
                  eyeImage={true}
                  onClick={() => {
                    if (patientType === "oneTimeBroadcast")
                      setShowOneTimeViewList(true);
                    else if (patientType === "uploadFile")
                      setShowUploadViewList(true);
                    else setShowViewList(true);
                  }}
                />
              </div>
            </div>
            <div className="patientsFoundDivider"></div>
            <div className="patientsFoundContent">
              {patientType === "targetRecipients" && (
                <>
                  {includeOptOut ? (
                    <>
                      <div className="patientsFound">
                        <p className="patientName">Patients Found</p>
                        <p className="patientCount">
                          {
                            searchPatients.filter(
                              (p) => !(p.isOptedOutEmail || p.isOptedOutSms)
                            ).length
                          }
                        </p>
                      </div>
                      <div className="patientsFound">
                        <p className="patientName">Opt Out Patients</p>
                        <p className="patientCount">
                          {
                            searchPatients.filter(
                              (p) => p.isOptedOutEmail || p.isOptedOutSms
                            ).length
                          }
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="patientsFound">
                      <p className="patientName">Total Patients</p>
                      <p className="patientCount">{searchTotalCount}</p>
                    </div>
                  )}
                </>
              )}

              {patientType === "uploadFile" && (
                <>
                  <div className="patientsFound">
                    <p className="patientName">Total Patients</p>
                    <p className="patientCount">{uploadTotalCount}</p>
                  </div>
                  <div className="patientsFound">
                    <p className="patientName">Eligible Patients</p>
                    <p className="patientCount">{uploadEligibleCount}</p>
                  </div>
                  <div className="patientsFound">
                    <p className="patientName">Error Patients</p>
                    <p className="patientCount">{uploadErrorCount}</p>
                  </div>
                </>
              )}

              {patientType === "oneTimeBroadcast" && (
                <div className="patientsFound">
                  <p className="patientName">Patients Found</p>
                  <p className="patientCount">{searchTotalCount}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TargetViewList
        isOpen={showViewList}
        onClose={() => setShowViewList(false)}
        includeOptOut={includeOptOut}
        patients={searchPatients}
      />

      <OneTimeViewList
        isOpen={showOneTimeViewList}
        onClose={() => setShowOneTimeViewList(false)}
        patients={searchPatients}
      />

      <UploadFileViewList
        isOpen={showUploadViewList}
        onClose={() => setShowUploadViewList(false)}
        patients={uploadedPatients}
        onPatientsChange={setUploadedPatients}
      />
    </div>
  );
}

export default BroadcastPatientDetails;
