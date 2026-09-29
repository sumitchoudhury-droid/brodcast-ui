import * as XLSX from "xlsx";

import "./style.scss";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import { ReusableUpload } from "../../../../reusableComponents/reusableUpload/index";
import { useToast } from "../../../../hooks/useToast";

const REQUIRED_COLUMNS = [
  "Patient First Name",
  "Patient Last Name",
  "Date of Birth (MM/DD/YYYY)",
  "Mobile Number",
  "Email",
  "Balance Amount ($)"
];

const readFileHeaderColumns = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {
          type: "array"
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const [headerRow = []] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          blankrows: false
        });
        resolve(headerRow.map((h) => String(h ?? "").trim()).filter(Boolean));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

const hasExactRequiredColumns = (headers) => {
  if (headers.length !== REQUIRED_COLUMNS.length) return false;
  const headerSet = new Set(headers);
  return REQUIRED_COLUMNS.every((col) => headerSet.has(col));
};

function PatientUploadFile({ onFileChange }) {
  const toast = useToast();

  const uploadFileData = [
    "Download the template provided and populate the patient list",
    "Only include the active patient that has been to the practice in past 12 months",
    "Only select patient aged 18 years and above",
    "Enter Mobile Number with following format - Eg. 9876543210",
    "If you have a big list, try to break it up into smaller batches (i.e if 5,000 in total, break it up into 2,500 patient.)",
    "If the uploaded file has missing entries/items, will be skipped while processing."
  ];

  const handleFileUpload = async (file) => {
    if (!file) {
      onFileChange?.(file);
      return;
    }
    try {
      const headers = await readFileHeaderColumns(file);
      if (!hasExactRequiredColumns(headers)) {
        toast.error(
          "Uploaded File Template is invalid. Please verify the template and upload again"
        );
        return;
      }
    } catch {
      toast.error(
        "Uploaded File Template is invalid. Please verify the template and upload again"
      );
      return;
    }
    onFileChange?.(file);
  };

  return (
    <div className="patientUploadFileContainer">
      <div>
        <ReusableButton
          label="Download Patient list Template"
          variant="secondary"
          downloadImage={true}
          onClick={() => {
            const link = document.createElement("a");
            link.href = "/sampleFiles/Broadcast PatientList.xlsx";
            link.download = "Broadcast PatientList.xlsx";
            link.click();
          }}
        />
      </div>
      <div className="patientUploadFileContent">
        <h1>Recommended Guidelines For Upload File :</h1>
        <div className="guidelineListContainer">
          {uploadFileData.map((item, index) => (
            <div key={index} className="guidelineItemContainer">
              {" "}
              {/* Added key prop */}
              <div className="guidelineNumber">
                <span></span> {/* Added number display */}
              </div>
              <p className="guidelineText">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="uploadComponentContainer">
        <ReusableUpload
          onChange={handleFileUpload}
          accept=".csv,.xlsx,.xls" // Specify accepted file types
          maxSize={650 * 1024}
        />
      </div>
    </div>
  );
}

export default PatientUploadFile;
