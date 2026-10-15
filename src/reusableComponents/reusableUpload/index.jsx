import { useRef, useState } from "react";
import uploadImage from "../../assets/commonIcons/uploadImage.svg";
import greenCrossIcon from "../../assets/commonIcons/greenCrossIcon.svg";
// import imgfileIcon from "../../assets/commonIcons/fileIcon.svg";
import xlsfileIcon from "../../assets/commonIcons/xlsIcon.svg";
import "./style.scss";

export function ReusableUpload({
  onChange,
  accept,
  maxSize = 10 * 1024 * 1024,
  noLimit = false
}) {
  const maxSizeLabel =
    maxSize >= 1024 * 1024
      ? `${(maxSize / (1024 * 1024)).toFixed(0)}MB`
      : `${(maxSize / 1024).toFixed(0)}KB`;
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [sizeError, setSizeError] = useState("");

  const applyFile = (selectedFile) => {
    if (!noLimit && selectedFile.size > maxSize) {
      setSizeError(`File size exceeds the limit of ${maxSizeLabel}.`);
      inputRef.current.value = "";
      return;
    }
    setSizeError("");
    setFile(selectedFile);
    onChange?.(selectedFile);
  };

  /* ---------- FILE SELECT ---------- */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) applyFile(selectedFile);
  };

  /* ---------- DRAG DROP ---------- */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) applyFile(droppedFile);
  };

  /* ---------- REMOVE FILE ---------- */
  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setSizeError("");
    inputRef.current.value = "";
    onChange?.(null);
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
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={handleFileChange}
          accept={accept}
        />

        <div className="uploadContent">
          <div className="uploadIcon">
            <img src={uploadImage} alt="uploadImage" />
          </div>

          <div>
            <p className="uploadText">
              Drag & drop your files here, or click to browse
            </p>
            {!noLimit && <p className="uploadLimit">up to {maxSizeLabel}.</p>}
          </div>
        </div>
      </div>

      {sizeError && <p className="uploadErrorText">{sizeError}</p>}

      {/* Uploaded File */}
      {file && (
        <div className="uploadedSection">
          <p className="uploadedTitle">Uploaded File</p>

          <div className="fileCard">
            <div className="fileLeft">
              <div className="fileIcon">
                <img src={xlsfileIcon} alt="fileIcon" />
              </div>

              <div style={{ gap: "4px" }}>
                <p className="fileName">{file.name}</p>
                <p className="fileSize">{(file.size / 1024).toFixed(1)} KB</p>
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
}
