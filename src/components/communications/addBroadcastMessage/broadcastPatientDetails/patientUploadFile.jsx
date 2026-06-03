import "./style.scss";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import { ReusableUpload } from "../../../../reusableComponents/reusableUpload/index";

function PatientUploadFile({ onFileChange }) {
  const uploadFileData = [
    "Download the template provided and populate the patient list",
    "Only include the active patient that has been to the practice in past 12 months",
    "Only select patient aged 18 years and above",
    "Enter Mobile Number with following format - Eg. 9876543210",
    "If you have a big list, try to break it up into smaller batches (i.e if 5,000 in total, break it up into 2,500 patient.)",
    "If the uploaded file has missing entries/items, will be skipped while processing.",
    "To upload the new file, please remove the current active file first and then upload the new one."
  ];

  const handleFileUpload = (file) => {
    onFileChange?.(file);
  };

  return (
    <div className="patientUploadFileContainer">
      <div>
        <ReusableButton
          label="Download Sample Template File"
          variant="secondary"
          downloadImage={true}
          onClick={() => {
            const link = document.createElement("a");
            link.href = "/sampleFiles/sampleTemplateFile.xls";
            link.download = "sampleTemplateFile.xls";
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
        />
      </div>
    </div>
  );
}

export default PatientUploadFile;
