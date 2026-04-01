import { useRef, useState } from "react";
import uploadImage from "../../assets/commonIcons/uploadImage.svg";
import greenCrossIcon from "../../assets/commonIcons/greenCrossIcon.svg";
import fileIcon from "../../assets/commonIcons/fileIcon.svg";
import "./style.scss";

export const ReusableUpload = () => {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);

  /* ---------- FILE SELECT ---------- */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  /* ---------- DRAG DROP ---------- */
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  /* ---------- REMOVE FILE ---------- */
  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    inputRef.current.value = "";
  };

  return (
    <div className="uploadWrapper">
      {/* Header */}
      <div className="uploadHeader">
        <div className="uploadTitle">
          <p className="label">Upload File</p>
          <span className="required">*</span>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="uploadBox"
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" hidden onChange={handleFileChange} />

        <div className="uploadContent">
          <div className="uploadIcon">
            <img src={uploadImage} alt="uploadImage" />
          </div>

          <div>
            <p className="uploadText">
              Drag & drop your files here, or click to browse
            </p>
            <p className="uploadLimit">up to 5 MB.</p>
          </div>
        </div>
      </div>

      {/* Uploaded File */}
      {file && (
        <div className="uploadedSection">
          <p className="uploadedTitle">Uploaded File</p>

          <div className="fileCard">
            <div className="fileLeft">
              <div className="fileIcon">
                <img src={fileIcon} alt="fileIcon" />
              </div>

              <div style={{ gap: "4px" }}>
                <p className="fileName">{file.name}</p>
                <p className="fileSize">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <img
              src={greenCrossIcon}
              alt="greenCrossIcon"
              className="removeBtn"
              onClick={handleRemove}
            />
          </div>
        </div>
      )}
    </div>
  );
};
