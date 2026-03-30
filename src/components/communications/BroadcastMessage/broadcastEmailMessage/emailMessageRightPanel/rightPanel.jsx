import { useState, useEffect, useRef } from "react";

import "./style.scss";
import PreviewModal from "../emailMessagePreviewModal/previewModal";

const DeviceSwitcher = ({ handlePreview, isEditorEmpty, editorRef }) => {
  const [activeDevice, setActiveDevice] = useState("desktop");

  const setDevice = (device) => {
    setActiveDevice(device);
    editorRef.current?.setDevice(device === "desktop" ? "Desktop" : "Mobile");
  };

  return (
    <div className="deviceSwitcherContainer">
      <div className="deviceToggle">
        <button
          className={`deviceBtn ${activeDevice === "desktop" ? "active" : ""}`}
          onClick={() => setDevice("desktop")}
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
      <button
        className="previewBtn"
        onClick={handlePreview}
        disabled={isEditorEmpty}
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

const SectionHeader = ({ title, icon, onIconClick }) => (
  <div className="section-header">
    <span>{title}</span>
    {icon && (
      <div className="header-icon" onClick={onIconClick}>
        {icon}
      </div>
    )}
  </div>
);

export default function RightPanel({ editorRef, isEditorEmpty }) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [selectedComp, setSelectedComp] = useState(null);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [textColor, setTextColor] = useState("#000000");
  const [bgImage, setBgImage] = useState("");
  const [typography, setTypography] = useState({
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: "14",
    textAlign: "left"
  });

  const colorInputRef = useRef(null);
  const textColorInputRef = useRef(null);
  const bgImageInputRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    const updateState = () => {
      const selected = editor.getSelected();
      setSelectedComp(selected);

      if (selected) {
        const style = selected.getStyle();
        // const attrs = selected.getAttributes();

        // Sync Background
        setBgColor(style["background-color"] || "#FFFFFF");
        setBgImage(
          style["background-image"]?.match(/url\((['"]?)(.*?)\1\)/)?.[2] || ""
        );

        // Sync Typography/Color
        if (selected.is("mj-text") || selected.is("mj-button")) {
          setTextColor(style["color"] || "#000000");
          setTypography({
            fontFamily: style["font-family"]?.replace(/['"]/g, "") || "Inter",
            fontWeight: style["font-weight"] || "400",
            fontSize: style["font-size"]?.replace("px", "") || "14",
            textAlign: style["text-align"] || "left"
          });
        }
      }
    };

    editor.on("component:selected", updateState);
    editor.on("component:update:style", updateState);

    return () => {
      editor.off("component:selected", updateState);
      editor.off("component:update:style", updateState);
    };
  }, [editorRef]);

  const handleAddLayout = (layoutType) => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    let content = "";
    switch (layoutType) {
      case "1-col":
        content = `<mj-section><mj-column padding="20px" background-color="#ffffff"></mj-column></mj-section>`;
        break;
      case "2-col":
        content = `<mj-section><mj-column width="50%" padding="20px"></mj-column><mj-column width="50%" padding="20px"></mj-column></mj-section>`;
        break;
      case "3-col":
        content = `<mj-section><mj-column width="33.33%" padding="10px"></mj-column><mj-column width="33.33%" padding="10px"></mj-column><mj-column width="33.33%" padding="10px"></mj-column></mj-section>`;
        break;
      case "30-70":
        content = `<mj-section><mj-column width="30%" padding="10px"></mj-column><mj-column width="70%" padding="10px"></mj-column></mj-section>`;
        break;
      case "70-30":
        content = `<mj-section><mj-column width="70%" padding="10px"></mj-column><mj-column width="30%" padding="10px"></mj-column></mj-section>`;
        break;
      case "2-row":
        content = `<mj-section padding="0"><mj-column padding="10px"></mj-column></mj-section><mj-section padding="0"><mj-column padding="10px"></mj-column></mj-section>`;
        break;
      default:
        break;
    }

    if (content) {
      const selected = editor.getSelected();
      if (selected) {
        selected
          .parent()
          ?.append(content, {
            at: selected.parent().components().indexOf(selected) + 1
          });
      } else {
        editor.addComponents(content);
      }
    }
  };

  const handleBgColorChange = (newColor) => {
    setBgColor(newColor);
    if (selectedComp) {
      selectedComp.addStyle({ "background-color": newColor });
    }
  };

  const handleTextColorChange = (newColor) => {
    setTextColor(newColor);
    if (
      selectedComp &&
      (selectedComp.is("mj-text") || selectedComp.is("mj-button"))
    ) {
      selectedComp.addStyle({ color: newColor });
    }
  };

  const handleBgImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedComp) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target.result;
      setBgImage(url);
      selectedComp.addStyle({
        "background-image": `url(${url})`,
        "background-repeat": "no-repeat",
        "background-size": "cover",
        "background-position": "center"
      });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const removeBgImage = () => {
    setBgImage("");
    if (selectedComp) {
      selectedComp.addStyle({ "background-image": "none" });
    }
  };

  const handleTypographyChange = (key, value) => {
    const newTypos = { ...typography, [key]: value };
    setTypography(newTypos);
    if (
      selectedComp &&
      (selectedComp.is("mj-text") || selectedComp.is("mj-button"))
    ) {
      const styleKey =
        key === "fontFamily"
          ? "font-family"
          : key === "fontWeight"
            ? "font-weight"
            : key === "fontSize"
              ? "font-size"
              : "text-align";
      const finalValue = key === "fontSize" ? `${value}px` : value;
      selectedComp.addStyle({ [styleKey]: finalValue });
    }
  };

  const handleSendTestMail = () => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    const mjmlCode = editor.getHtml();
    const compiledHtml = editorRef.current?.getCompiledHtml?.() || "";
    const css = editor.getCss();

    const payload = {
      to: ["venkatasiva@sketchbrahma.com"],
      cc: [],
      bcc: [],
      subject: "Test Broadcast Message",
      template: {
        templateName: "test_broadcast",
        version: 1,
        mjml: mjmlCode,
        html: compiledHtml,
        css: css
      },
      variables: {
        username: "Siva",
        company: "Sketch Brahma"
      },
      attachments: [],
      metadata: {
        createdBy: "admin_user",
        source: "email-builder"
      }
    };

    console.log("Payload to backend:", payload);
    alert("Template has been sent to venkatasiva@sketchbrahma.com");
  };

  const handlePreview = () => {
    try {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;

      let htmlContent = editorRef.current?.getCompiledHtml?.() || "";
      if (!htmlContent) {
        const rawHtml = editor.getHtml();
        if (
          rawHtml &&
          !rawHtml.includes("<mj-") &&
          !rawHtml.includes("<mjml")
        ) {
          htmlContent = rawHtml;
        }
      }

      if (!htmlContent) {
        alert("Could not compile MJML to HTML.");
        return;
      }

      setPreviewHtml(htmlContent);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  return (
    <div className="rightPanel">
      <DeviceSwitcher
        handlePreview={handlePreview}
        isEditorEmpty={isEditorEmpty}
        editorRef={editorRef}
      />

      <div className="panel-sections">
        {/* Layout Section */}
        <div className="panel-section">
          <SectionHeader title="Layout" />
          <div className="layout-grid">
            <button
              className="layout-icon-btn"
              onClick={() => handleAddLayout("2-col")}
              title="2-column"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="3" x2="12" y2="21"></line>
              </svg>
            </button>
            <button
              className="layout-icon-btn"
              onClick={() => handleAddLayout("3-col")}
              title="3-column"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="8" y1="3" x2="8" y2="21"></line>
                <line x1="16" y1="3" x2="16" y2="21"></line>
              </svg>
            </button>
            <button
              className="layout-icon-btn"
              onClick={() => handleAddLayout("1-col")}
              title="1-column"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
            <button
              className="layout-icon-btn"
              onClick={() => handleAddLayout("30-70")}
              title="30/70"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="6" height="18" rx="1"></rect>
                <rect x="11" y="3" width="10" height="18" rx="1"></rect>
              </svg>
            </button>
            <button
              className="layout-icon-btn"
              onClick={() => handleAddLayout("70-30")}
              title="70/30"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="10" height="18" rx="1"></rect>
                <rect x="15" y="3" width="6" height="18" rx="1"></rect>
              </svg>
            </button>
            <button
              className="layout-icon-btn"
              onClick={() => handleAddLayout("2-row")}
              title="2-row Stacked"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="8" rx="1"></rect>
                <rect x="3" y="13" width="18" height="8" rx="1"></rect>
              </svg>
            </button>
          </div>
        </div>

        {/* Background Section */}
        <div className="panel-section">
          <SectionHeader title="Background" />
          <div className="background-controls">
            <div className="color-control-wrapper">
              <div
                className="color-control"
                onClick={() => colorInputRef.current?.click()}
              >
                <div
                  className="color-preview"
                  style={{ backgroundColor: bgColor }}
                ></div>
                <span className="hex-value">{bgColor.toUpperCase()}</span>
                <span className="opacity-value">100%</span>
                <input
                  type="color"
                  ref={colorInputRef}
                  className="hidden-color-input"
                  value={bgColor.match(/^#[0-9a-f]{6}$/i) ? bgColor : "#FFFFFF"}
                  onChange={(e) => handleBgColorChange(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-image-actions">
              {bgImage ? (
                <div className="bg-image-preview">
                  <div
                    className="image-thumb"
                    style={{ backgroundImage: `url(${bgImage})` }}
                  ></div>
                  <span className="file-name">BG Image</span>
                  <button
                    className="icon-btn small"
                    onClick={removeBgImage}
                    title="Remove Background Image"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  className="add-bg-img-btn"
                  onClick={() => bgImageInputRef.current?.click()}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span>Add BG Image</span>
                  <input
                    type="file"
                    ref={bgImageInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleBgImageUpload}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Text Section / Font Settings */}
        {selectedComp &&
          (selectedComp.is("mj-text") || selectedComp.is("mj-button")) && (
            <div className="panel-section">
              <SectionHeader title="Text" />
              <div className="text-controls">
                <div className="dropdown-control full-width">
                  <select
                    value={typography.fontFamily}
                    onChange={(e) =>
                      handleTypographyChange("fontFamily", e.target.value)
                    }
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>
                </div>
                <div className="dropdown-row">
                  <div className="dropdown-control flex-1">
                    <select
                      value={typography.fontWeight}
                      onChange={(e) =>
                        handleTypographyChange("fontWeight", e.target.value)
                      }
                    >
                      <option value="400">Regular</option>
                      <option value="500">Medium</option>
                      <option value="600">SemiBold</option>
                      <option value="700">Bold</option>
                    </select>
                  </div>
                  <div className="dropdown-control flex-1">
                    <input
                      type="number"
                      value={typography.fontSize}
                      onChange={(e) =>
                        handleTypographyChange("fontSize", e.target.value)
                      }
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        outline: "none"
                      }}
                    />
                    <span>px</span>
                  </div>
                </div>

                <div className="text-style-actions">
                  <div className="color-control-wrapper tiny">
                    <div
                      className="color-control mini"
                      onClick={() => textColorInputRef.current?.click()}
                    >
                      <div
                        className="color-preview"
                        style={{ backgroundColor: textColor }}
                      ></div>
                      <span className="hex-value">
                        {textColor.toUpperCase()}
                      </span>
                      <input
                        type="color"
                        ref={textColorInputRef}
                        className="hidden-color-input"
                        value={
                          textColor.match(/^#[0-9a-f]{6}$/i)
                            ? textColor
                            : "#000000"
                        }
                        onChange={(e) => handleTextColorChange(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="alignment-toggle">
                    <button
                      className={
                        typography.textAlign === "left" ? "active" : ""
                      }
                      onClick={() =>
                        handleTypographyChange("textAlign", "left")
                      }
                    >
                      L
                    </button>
                    <button
                      className={
                        typography.textAlign === "center" ? "active" : ""
                      }
                      onClick={() =>
                        handleTypographyChange("textAlign", "center")
                      }
                    >
                      C
                    </button>
                    <button
                      className={
                        typography.textAlign === "right" ? "active" : ""
                      }
                      onClick={() =>
                        handleTypographyChange("textAlign", "right")
                      }
                    >
                      R
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Stroke Section (Placeholder) */}
        <div className="panel-section">
          <SectionHeader
            title="Stroke"
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            }
          />
        </div>
      </div>

      <div className="actionFooter">
        <button className="sendTestBtn" onClick={handleSendTestMail}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M8.33315 11.6667L17.4998 2.5M8.33315 11.6667L11.2498 17.5C11.2864 17.5798 11.3451 17.6474 11.4189 17.6948C11.4928 17.7422 11.5787 17.7674 11.6665 17.7674C11.7542 17.7674 11.8402 17.7422 11.914 17.6948C11.9879 17.6474 12.0466 17.5798 12.0831 17.5L17.4998 2.5M8.33315 11.6667L2.49981 8.75C2.42003 8.71344 2.35242 8.65474 2.30502 8.58088C2.25762 8.50701 2.23242 8.4211 2.23242 8.33333C2.23242 8.24557 2.25762 8.15965 2.30502 8.08579C2.35242 8.01193 2.42003 7.95323 2.49981 7.91667L17.4998 2.5"
              stroke="white"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>Send Test Mail</p>
        </button>
      </div>

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        html={previewHtml}
      />
    </div>
  );
}
