import { useState } from "react";
import leftPanelTemplate from "../../../../../assets/leftPanel/leftPanelTemplate.svg";
import leftPanelBlock from "../../../../../assets/leftPanel/leftPanelBlock.svg";
import leftPanelSearch from "../../../../../assets/leftPanel/leftPanelSearch.svg";
import leftPanelAttachment from "../../../../../assets/leftPanel/leftPanelAttachment.svg";
import leftPanelColumn from "../../../../../assets/leftPanel/leftPanelColumn.svg";
import leftPanelHeading from "../../../../../assets/leftPanel/leftPanelHeading.svg";
import leftPanelLink from "../../../../../assets/leftPanel/leftPanelLink.svg";
import leftPanelPhoto from "../../../../../assets/leftPanel/leftPanelPhoto.svg";
import leftPanelText from "../../../../../assets/leftPanel/leftPanelText.svg";
import leftPanelRow from "../../../../../assets/leftPanel/leftPanelRow.svg";
import leftPanelCAT from "../../../../../assets/leftPanel/leftPanelCAT.svg";
import leftPanelContent from "../../../../../assets/leftPanel/leftPanelContent.svg";
import leftPanelFeatures from "../../../../../assets/leftPanel/leftPanelFeatures.svg";
import leftPanelFooter from "../../../../../assets/leftPanel/leftPanelFooter.svg";
import leftPanelHeader from "../../../../../assets/leftPanel/leftPanelHeader.svg";
import leftPanelPlaceholders from "../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import "./style.scss";

export default function LeftPanel({
  editorRef,
  showPlaceholders,
  setShowPlaceholders
}) {
  const [tab, setTab] = useState("blocks");

  const handleDragStart = (blockId) => (e) => {
    e.dataTransfer.setData("text/plain", blockId);

    // Create a transparent 1x1 pixel image to hide the browser's default drag ghost
    // which often gets stuck at (0,0) when using GrapesJS's manual startDrag.
    const img = new Image();
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);

    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const block = editor.BlockManager.get(blockId);
    if (block) editor.BlockManager.startDrag(block, e.nativeEvent);
  };

  const handleDragEnd = () => {
    const editor = editorRef?.current?.getEditor?.();
    if (editor?.BlockManager?.endDrag) editor.BlockManager.endDrag();
  };

  const getIcon = (blockId) => {
    switch (blockId) {
      case "row":
        return (
          <img src={leftPanelRow} alt="leftPanelRow" className="icon"></img>
        );
      case "column":
        return (
          <img
            src={leftPanelColumn}
            alt="leftPanelColumn"
            className="icon"
          ></img>
        );
      case "heading":
        return (
          <img
            src={leftPanelHeading}
            alt="leftPanelHeading"
            className="icon"
          ></img>
        );
      case "paragraph":
        return (
          <img src={leftPanelText} alt="leftPanelText" className="icon"></img>
        );
      case "image":
        return (
          <img src={leftPanelPhoto} alt="leftPanelPhoto" className="icon"></img>
        );
      case "button":
        return (
          <img src={leftPanelLink} alt="leftPanelLink" className="icon"></img>
        );
      case "Attachment":
        return (
          <img
            src={leftPanelAttachment}
            alt="leftPanelAttachment"
            className="icon"
          ></img>
        );
      case "customPlaceholders":
        return (
          <img
            src={leftPanelPlaceholders}
            alt="leftPanelPlaceholders"
            className="ComponentIcon"
          ></img>
        );
      case "customHeader":
        return (
          <img
            src={leftPanelHeader}
            alt="leftPanelHeader"
            className="ComponentIcon"
          ></img>
        );
      case "customContent":
        return (
          <img
            src={leftPanelContent}
            alt="leftPanelContent"
            className="ComponentIcon"
          ></img>
        );
      case "customFeatures":
        return (
          <img
            src={leftPanelFeatures}
            alt="leftPanelFeatures"
            className="ComponentIcon"
          ></img>
        );
      case "customFooter":
        return (
          <img
            src={leftPanelFooter}
            alt="leftPanelFooter"
            className="ComponentIcon"
          ></img>
        );
      case "customCTA":
        return (
          <img
            src={leftPanelCAT}
            alt="leftPanelCAT"
            className="ComponentIcon"
          ></img>
        );
      default:
        return (
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
    }
  };

  const createBlockItem = (
    blockId,
    title,
    desc,
    onClick,
    isDraggable = true
  ) => (
    <div
      key={blockId + title}
      className={`customBlock ${blockId === "customPlaceholders" && showPlaceholders ? "active" : ""}`}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart(blockId) : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      onClick={onClick}
    >
      {getIcon(blockId)}
      <div className="info">
        <div className="title">{title}</div>
        {desc && <div className="desc">{desc}</div>}
      </div>
    </div>
  );

  return (
    <div className="leftPanel">
      {/* ── Tab switcher ── */}
      <div className="tabSwitcher">
        <button
          className={`tab-btn ${tab === "templates" ? "active" : ""}`}
          onClick={() => setTab("templates")}
        >
          <img
            src={leftPanelTemplate}
            alt="leftPanelTemplate"
            className="tabIcon"
          />
          Templates
        </button>
        <button
          className={`tab-btn ${tab === "blocks" ? "active" : ""}`}
          onClick={() => setTab("blocks")}
        >
          <img src={leftPanelBlock} alt="leftPanelBlock" className="tabIcon" />
          Blocks
        </button>
      </div>

      {/* ── Search ── */}
      <div className="searchContainer">
        <img
          src={leftPanelSearch}
          alt="leftPanelSearch"
          className="searchIcon"
        />
        <input
          className="searchInput"
          placeholder="Search Blocks, Content, Com..."
        />
      </div>

      {/* ── Blocks tab ── */}
      <div
        className="panel-content"
        style={{ display: tab === "blocks" ? "block" : "none" }}
      >
        <div className="gjs-block-category">
          <div className="gjs-title">Blocks</div>
          <div className="gjs-blocks-c">
            {createBlockItem(
              "row",
              "Frame - Row",
              "Use to place blocks in a row."
            )}
            {createBlockItem(
              "column",
              "Frame - Column",
              "Use to place blocks in a column."
            )}
          </div>
        </div>

        <div className="gjs-block-category">
          <div className="gjs-title">Content</div>
          <div className="gjs-blocks-c">
            {createBlockItem(
              "heading",
              "Heading",
              "Big, medium or small headings."
            )}
            {createBlockItem(
              "paragraph",
              "Paragraph",
              "Just start writing text."
            )}
            {createBlockItem("image", "Image", "Upload or embed with a link.")}
            {createBlockItem("button", "Button", "Create a clickable button.")}
            {createBlockItem(
              "Attachment",
              "Attachment",
              "Upload a file for download."
            )}
          </div>
        </div>

        <div className="gjs-block-category">
          <div className="gjs-title">Components</div>
          <div className="gjs-blocks-c">
            {createBlockItem(
              "customPlaceholders",
              "Placeholders",
              null,
              () => setShowPlaceholders((prev) => !prev),
              false
            )}
            {createBlockItem("customHeader", "Header")}
            {createBlockItem("customContent", "Content")}
            {createBlockItem("customFeatures", "Features")}
            {createBlockItem("customFooter", "Footer")}
            {createBlockItem("customCTA", "CTA")}
          </div>
        </div>
      </div>

      {/* ── Templates tab ── */}
      <div
        className="panel-content"
        style={{ display: tab === "templates" ? "block" : "none" }}
      >
        <div className="templates-container">{/* Templates content */}</div>
      </div>
    </div>
  );
}
