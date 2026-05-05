import { useState, useEffect, useRef } from "react";

import { ReusableButton } from "../../../../../reusableComponents/resuableButton";

import deleteIcon from "../../../../../assets/commonIcons/deleteIcon.svg";
import menuIcon from "../../../../../assets/commonIcons/menuIcon.svg";
import trashIcon from "../../../../../assets/commonIcons/trashIcon.svg";
import backIcon from "../../../../../assets/commonIcons/backIcon.svg";

import "./style.scss";

const PreviewModal = ({ isOpen, onClose, html }) => {
  const [selectedDevice, setSelectedDevice] = useState("Desktop");
  const iframeRef = useRef(null);

  const getSrcDoc = () => {
    if (!html) return "";

    const scrollbarStyle = `
  <style>
    /* Hide scrollbar for Chrome, Safari and Opera */
    ::-webkit-scrollbar {
      display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    html, body {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  </style>`;

    try {
      const trimmed = html.trim();
      if (
        trimmed.toLowerCase().startsWith("<!doctype") ||
        trimmed.startsWith("<html")
      ) {
        if (trimmed.includes("</head>")) {
          return trimmed.replace("</head>", scrollbarStyle + "\n</head>");
        }
        return trimmed + scrollbarStyle;
      }
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #fff;
      padding: 0;
      margin: 0;
    }
    img { 
      max-width: 100%; 
      height: auto; 
    }
    .attachment-container {
      width: 60% !important;
      margin-left: 0;
      margin-right: auto;
    }
    @media only screen and (max-width: 480px) {
      .attachment-container {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  </style>
  ${scrollbarStyle}
</head>
<body>
  ${trimmed}
</body>
</html>`;
    } catch (error) {
      console.error("Error processing HTML:", error);
      return `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body><div style="padding:20px;color:red;font-family:sans-serif;">Error loading preview content</div></body></html>`;
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="previewDrawerOverlay" onClick={onClose}>
      <div
        className="previewDrawerContainer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="previewDrawerHeader">
          <div className="headerLeft">
            <h3>Mail Preview</h3>
            <div className="deviceToggle">
              <button
                className={`toggleBtn ${selectedDevice === "Desktop" ? "active" : ""}`}
                onClick={() => setSelectedDevice("Desktop")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M8 20H16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 16V20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Desktop</span>
              </button>
              <button
                className={`toggleBtn ${selectedDevice === "Mobile" ? "active" : ""}`}
                onClick={() => setSelectedDevice("Mobile")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="5"
                    y="2"
                    width="14"
                    height="20"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M12 18H12.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Mobile</span>
              </button>
            </div>
          </div>
          <button className="closeBtn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Content Area */}
        <div
          className="previewDrawerContent"
          style={
            selectedDevice === "Desktop" ? { border: "1px solid #EAEDF2" } : {}
          }
        >
          {/* Email Header Info - Only for Desktop */}
          {selectedDevice === "Desktop" && (
            <div className="emailHeaderInfo">
              <div className="avatar">MH</div>
              <div className="emailDetails">
                <p className="subject">Appointment Rescheduled</p>
                <p className="from">
                  Manipal Hospitals &lt;noreply@manipalhospitals.com&gt;
                </p>
                <p className="to">To: patient@email.com</p>
              </div>
            </div>
          )}

          {/* Device Frame */}
          <div className={`deviceFrame ${selectedDevice.toLowerCase()}`}>
            {selectedDevice === "Mobile" && (
              <>
                <div className="mobileDynamicIsland"></div>
                <div className="mobileStatusBar">
                  <span className="time">9:41</span>
                  <div className="statusIcons">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>
              </>
            )}
            {selectedDevice === "Mobile" && (
              <>
                <div className="mobileHeader">
                  <img
                    src={backIcon}
                    alt="backIcon"
                    style={{ height: "15px", width: "15px" }}
                  />
                  <div className="mobileHeaderIcons">
                    <img
                      src={trashIcon}
                      alt="trashIcon"
                      style={{ height: "15px", width: "15px" }}
                    />
                    <img
                      src={deleteIcon}
                      alt="deleteIcon"
                      style={{ height: "15px", width: "15px" }}
                    />
                    <img
                      src={menuIcon}
                      alt="menuIcon"
                      style={{ height: "15px", width: "15px" }}
                    />
                  </div>
                </div>
              </>
            )}
            <div
              className={`iframeWrapper ${selectedDevice === "Mobile" ? "mobile-scroll" : "desktop-scroll"}`}
            >
              <iframe
                ref={iframeRef}
                key={`${selectedDevice}-${isOpen}`}
                title={`${selectedDevice} Preview`}
                srcDoc={getSrcDoc()}
                frameBorder="0"
                width="100%"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  border: "none",
                  background: "#fff"
                }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
              />
            </div>

            {selectedDevice === "Mobile" && <div className="homeIndicator" />}
          </div>
        </div>

        {/* Footer */}
        <div className="previewDrawerFooter">
          <ReusableButton label="Close" variant="secondary" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
