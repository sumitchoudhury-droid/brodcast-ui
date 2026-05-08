import { useState } from "react";
import "./style.scss";

export const TextDeviceSwitcher = ({
  handlePreview,
  isEditorEmpty,
  editorRef
}) => {
  const [activeDevice, setActiveDevice] = useState("desktop");

  const setDevice = (device) => {
    setActiveDevice(device);
    editorRef.current?.setDevice(device === "desktop" ? "Desktop" : "Mobile");
  };

  return (
    <div
      className="deviceSwitcherContainer"
      style={{ justifyContent: isEditorEmpty ? "flex-end" : "space-between" }}
    >
      {!isEditorEmpty && (
        <div className="deviceToggle">
          <button
            className={`deviceBtn ${activeDevice === "desktop" ? "active" : ""}`}
            onClick={() => setDevice("desktop")}
            disabled={isEditorEmpty}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </button>
          <button
            className={`deviceBtn ${activeDevice === "mobile" ? "active" : ""}`}
            onClick={() => setDevice("mobile")}
            disabled={isEditorEmpty}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      <button
        className="previewBtn"
        onClick={handlePreview}
        disabled={isEditorEmpty}
        style={{
          cursor: isEditorEmpty ? "not-allowed" : "pointer",
          opacity: isEditorEmpty ? 0.5 : 1
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M8.33333 10C8.33333 10.442 8.50893 10.866 8.82149 11.1785C9.13405 11.4911 9.55797 11.6667 10 11.6667C10.442 11.6667 10.866 11.4911 11.1785 11.1785C11.4911 10.866 11.6667 10.442 11.6667 10C11.6667 9.55797 11.4911 9.13405 11.1785 8.82149C10.866 8.50893 10.442 8.33333 10 8.33333C9.55797 8.33333 9.13405 8.50893 8.82149 8.82149C8.50893 9.13405 8.33333 9.55797 8.33333 10Z"
            stroke="#107A6C"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 10C15.5 13.3333 13 15 10 15C7 15 4.5 13.3333 2.5 10C4.5 6.66667 7 5 10 5C13 5 15.5 6.66667 17.5 10Z"
            stroke="#107A6C"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p>Preview</p>
      </button>
    </div>
  );
};
