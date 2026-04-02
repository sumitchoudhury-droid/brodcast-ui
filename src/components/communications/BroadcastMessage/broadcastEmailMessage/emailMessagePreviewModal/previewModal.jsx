import { useState, useEffect, useRef } from "react";

import deviceDesktop from "../../../../../assets/mainScreen/deviceDesktop.svg";
import deviceMobile from "../../../../../assets/mainScreen/deviceMobile.svg";

import "./style.scss";

const PreviewModal = ({ isOpen, onClose, html }) => {
  const [selectedDevice, setSelectedDevice] = useState("Desktop");
  const iframeRef = useRef(null);

  const getSrcDoc = () => {
    if (!html) return "";
    const trimmed = html.trim();
    if (
      trimmed.toLowerCase().startsWith("<!doctype") ||
      trimmed.startsWith("<html")
    ) {
      return trimmed;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; overflow: hidden; height: auto; }
    #preview-root { width: 100%; height: auto; display: inline-block; vertical-align: top; }
  </style>
</head>
<body><div id="preview-root">${trimmed}</div></body>
</html>`;
  };

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !html || !iframeRef.current) return;

    const iframe = iframeRef.current;
    let observer = null;

    const resizeIframe = () => {
      try {
        const doc = iframe.contentWindow?.document;
        if (!doc) return;
        const root = doc.getElementById("preview-root");
        if (!root) return;
        const height = root.offsetHeight || 600;
        if (Math.abs(parseInt(iframe.style.height) - height) > 2) {
          iframe.style.height = `${height}px`;
        }
      } catch {
        // cross-origin safety
      }
    };

    iframe.onload = () => {
      resizeIframe();
      try {
        const root =
          iframe.contentWindow?.document?.getElementById("preview-root");
        if (root) {
          observer = new ResizeObserver(resizeIframe);
          observer.observe(root);
        }
      } catch {
        // Fallback for ResizeObserver support/safety
      }
    };

    const timer = setTimeout(resizeIframe, 300);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [isOpen, html, selectedDevice]);

  return (
    <div
      className={`previewDrawerOverlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
    >
      <div
        className={`previewDrawerContainer ${isOpen ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="previewDrawerHeader">
          <div className="headerLeft">
            <h3>Mail Preview</h3>
            <div className="deviceToggle">
              <button
                className={`toggleBtn ${selectedDevice === "Desktop" ? "active" : ""}`}
                onClick={() => setSelectedDevice("Desktop")}
              >
                <img
                  src={deviceDesktop}
                  alt="deviceDesktop"
                  width="20"
                  height="20"
                />
              </button>
              <button
                className={`toggleBtn ${selectedDevice === "Mobile" ? "active" : ""}`}
                onClick={() => setSelectedDevice("Mobile")}
              >
                <img
                  src={deviceMobile}
                  alt="deviceMobile"
                  width="20"
                  height="20"
                />
              </button>
            </div>
          </div>
          <button className="closeBtn" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="#606E80"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="previewDrawerContent">
          <div className={`previewFrame ${selectedDevice.toLowerCase()}`}>
            <div
              className={`iframeWrapper ${selectedDevice === "Mobile" ? "mobile-scroll" : ""}`}
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
                  minHeight: "200px",
                  height: "auto",
                  transition: "height 0.2s ease",
                  border: "none"
                }}
                scrolling={selectedDevice === "Mobile" ? "no" : "auto"}
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
            </div>
          </div>
        </div>

        <div className="previewDrawerFooter">
          <button type="button" onClick={onClose} className="footerBtn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
