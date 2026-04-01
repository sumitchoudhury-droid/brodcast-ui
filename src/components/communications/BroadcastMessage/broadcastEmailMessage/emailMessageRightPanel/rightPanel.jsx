import { useState, useEffect, useRef } from "react";

import "./style.scss";
import PreviewModal from "../emailMessagePreviewModal/previewModal";
import SignatureSection from "./signatureSection/SignatureSection";
import LayoutContainer from "./layoutContainer/layoutContainer";
import { DeviceSwitcher } from "./deviceSwitch/DeviceSwitcher";
import { BackgroundContainer } from "./backgroundContainer/backgroundContainer";
import { TextStyleContainer } from "./textStyleContainer/textStyleContainer";

export default function RightPanel({ editorRef, isEditorEmpty }) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [selectedComp, setSelectedComp] = useState(null);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [textColor, setTextColor] = useState("#000000");
  const [bgImage, setBgImage] = useState("");
  const [bgRepeat, setBgRepeat] = useState("no-repeat");
  const [bgSize, setBgSize] = useState("contain");
  const [borderWidth, setBorderWidth] = useState("0");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderRadius, setBorderRadius] = useState("0");

  const [typography, setTypography] = useState({
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: "14",
    textAlign: "left"
  });

  const colorInputRef = useRef(null);
  const textColorInputRef = useRef(null);
  const bgImageInputRef = useRef(null);
  const borderColorInputRef = useRef(null);

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
        setBgRepeat(style["background-repeat"] || "no-repeat");
        const currentSize = style["background-size"] || "contain";
        setBgSize(currentSize === "100% 100%" ? "fill" : currentSize);

        // Sync Border
        const border = style["border"] || "0px solid #000000";
        const borderParts = border.split(" ");
        if (borderParts.length >= 3) {
          setBorderWidth(borderParts[0].replace("px", ""));
          setBorderStyle(borderParts[1]);
          setBorderColor(borderParts[2]);
        }
        setBorderRadius(style["border-radius"]?.replace("px", "") || "0");

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
        selected.parent()?.append(content, {
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
        "background-size": "contain",
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

  const handleBgRepeatChange = (repeat) => {
    setBgRepeat(repeat);
    if (selectedComp) {
      selectedComp.addStyle({ "background-repeat": repeat });
    }
  };

  const handleBgSizeChange = (size) => {
    const finalSize = size === "fill" ? "100% 100%" : size;
    setBgSize(size);
    if (selectedComp) {
      selectedComp.addStyle({ "background-size": finalSize });
    }
  };

  const handleBorderChange = (key, value) => {
    let newWidth = borderWidth;
    let newStyle = borderStyle;
    let newColor = borderColor;

    if (key === "width") {
      newWidth = value;
      setBorderWidth(value);
    } else if (key === "style") {
      newStyle = value;
      setBorderStyle(value);
    } else if (key === "color") {
      newColor = value;
      setBorderColor(value);
    }

    if (selectedComp) {
      selectedComp.addStyle({
        border: `${newWidth}px ${newStyle} ${newColor}`
      });
    }
  };

  const handleBorderRadiusChange = (radius) => {
    setBorderRadius(radius);
    if (selectedComp) {
      selectedComp.addStyle({ "border-radius": `${radius}px` });
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

      <div className="panelSections">
        <SignatureSection />

        {/* Layout Section */}
        <LayoutContainer handleAddLayout={handleAddLayout} />

        {/* Background Section */}
        <BackgroundContainer
          bgColor={bgColor}
          handleBgColorChange={handleBgColorChange}
          bgImage={bgImage}
          removeBgImage={removeBgImage}
          bgImageInputRef={bgImageInputRef}
          handleBgImageUpload={handleBgImageUpload}
          colorInputRef={colorInputRef}
          bgRepeat={bgRepeat}
          handleBgRepeatChange={handleBgRepeatChange}
          bgSize={bgSize}
          handleBgSizeChange={handleBgSizeChange}
          borderWidth={borderWidth}
          borderStyle={borderStyle}
          borderColor={borderColor}
          borderRadius={borderRadius}
          handleBorderChange={handleBorderChange}
          handleBorderRadiusChange={handleBorderRadiusChange}
          borderColorInputRef={borderColorInputRef}
        />

        {/* Text Section / Font Settings */}
        {selectedComp &&
          (selectedComp.is("mj-text") || selectedComp.is("mj-button")) && (
            <TextStyleContainer
              typography={typography}
              handleTypographyChange={handleTypographyChange}
              textColor={textColor}
              handleTextColorChange={handleTextColorChange}
              textColorInputRef={textColorInputRef}
            />
          )}
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
