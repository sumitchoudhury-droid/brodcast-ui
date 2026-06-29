import { useState, useEffect } from "react";
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
// import leftPanelCAT from "../../../../../assets/leftPanel/leftPanelCAT.svg";
// import leftPanelContent from "../../../../../assets/leftPanel/leftPanelContent.svg";
// import leftPanelFeatures from "../../../../../assets/leftPanel/leftPanelFeatures.svg";
// import leftPanelFooter from "../../../../../assets/leftPanel/leftPanelFooter.svg";
// import leftPanelHeader from "../../../../../assets/leftPanel/leftPanelHeader.svg";
import leftPanelPlaceholders from "../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import emailTemplate from "../../../existingTemplates/htmlTemplates/email.html?raw";
import template1 from "../../../../../assets/templates/template1.svg";
import template2 from "../../../../../assets/templates/template2.svg";
import template3 from "../../../../../assets/templates/template3.svg";
import template4 from "../../../../../assets/templates/template4.svg";
import savedTemplate from "../../../../../assets/templates/savedTemplate.svg";

import "./style.scss";

import ReusableTab from "../../../../../reusableComponents/reusableTab";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal";

const tabOptions = [
  { label: "Library", value: "library" },
  { label: "Saved Template", value: "savedTemplate" }
];

const templateLibraryOptions = [
  { img: template1, name: "Template 1", html: emailTemplate },
  { img: template2, name: "Template 2", html: emailTemplate },
  { img: template3, name: "Template 3", html: emailTemplate },
  { img: template4, name: "Template 4", html: emailTemplate }
];

const savedTemplateOptions = [
  { img: savedTemplate, name: "Payment Reminder", html: emailTemplate },
  { img: savedTemplate, name: "Health Camp Invitation", html: emailTemplate },
  { img: savedTemplate, name: "Treatment Plan Update", html: emailTemplate },
  { img: savedTemplate, name: "Seasonal Health Advisory", html: emailTemplate }
];

const blockCategories = [
  {
    title: "Blocks",
    items: [
      {
        id: "row",
        title: "Frame - Row",
        desc: "Use to place blocks in a row."
      },
      {
        id: "column",
        title: "Frame - Column",
        desc: "Use to place blocks in a column."
      }
    ]
  },
  {
    title: "Content",
    items: [
      {
        id: "heading",
        title: "Heading",
        desc: "Big, medium or small headings."
      },
      { id: "paragraph", title: "Paragraph", desc: "Just start writing text." },
      { id: "image", title: "Image", desc: "Upload or embed with a link." },
      { id: "button", title: "Button", desc: "Create a clickable button." },
      {
        id: "Attachment",
        title: "Attachment",
        desc: "Upload a file for download."
      }
    ]
  },
  {
    title: "Components",
    items: [
      {
        id: "customPlaceholders",
        title: "Placeholders",
        desc: null,
        draggable: false
      }
    ]
  }
];

export default function LeftPanel({
  editorRef,
  showPlaceholders,
  setShowPlaceholders
}) {
  const [tab, setTab] = useState("blocks");
  const [selectedTab, setSelectedTab] = useState(tabOptions?.[0]?.value || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const handleTemplateSelect = (option) => () => {
    setPendingTemplate(option);
    setOpenConfirmModal(true);
  };

  const handleConfirmTemplate = () => {
    const editor = editorRef?.current?.getEditor?.();
    if (editor && pendingTemplate) editor.setComponents(pendingTemplate.html);
    setOpenConfirmModal(false);
    setPendingTemplate(null);
  };

  const handleCancelConfirm = () => {
    setOpenConfirmModal(false);
    setPendingTemplate(null);
  };

  const handleDragEnd = () => {
    const editor = editorRef?.current?.getEditor?.();
    if (editor?.BlockManager?.endDrag) editor.BlockManager.endDrag();
  };

  const getIcon = (blockId) => {
    switch (blockId) {
      case "row":
        return (
          <img src={leftPanelColumn} alt="leftPanelRow" className="icon"></img>
        );
      case "column":
        return (
          <img src={leftPanelRow} alt="leftPanelColumn" className="icon"></img>
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
      // case "customHeader":
      //   return (
      //     <img
      //       src={leftPanelHeader}
      //       alt="leftPanelHeader"
      //       className="ComponentIcon"
      //     ></img>
      //   );
      // case "customContent":
      //   return (
      //     <img
      //       src={leftPanelContent}
      //       alt="leftPanelContent"
      //       className="ComponentIcon"
      //     ></img>
      //   );
      // case "customFeatures":
      //   return (
      //     <img
      //       src={leftPanelFeatures}
      //       alt="leftPanelFeatures"
      //       className="ComponentIcon"
      //     ></img>
      //   );
      // case "customFooter":
      //   return (
      //     <img
      //       src={leftPanelFooter}
      //       alt="leftPanelFooter"
      //       className="ComponentIcon"
      //     ></img>
      //   );
      // case "customCTA":
      //   return (
      //     <img
      //       src={leftPanelCAT}
      //       alt="leftPanelCAT"
      //       className="ComponentIcon"
      //     ></img>
      //   );
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
    <>
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
            <img
              src={leftPanelBlock}
              alt="leftPanelBlock"
              className="tabIcon"
            />
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
            placeholder={
              tab === "blocks"
                ? "Search Blocks, Content, Com..."
                : "Search Templates..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ── Blocks tab ── */}
        <div
          className="panel-content"
          style={{
            display: tab === "blocks" ? "block" : "none",
            width: "100%"
          }}
        >
          {blockCategories.map((category) => {
            const filtered = category.items.filter((item) =>
              item.title.toLowerCase().includes(debouncedQuery.toLowerCase())
            );
            if (filtered.length === 0) return null;
            return (
              <div className="gjs-block-category" key={category.title}>
                <div className="gjs-title">{category.title}</div>
                <div className="gjs-blocks-c">
                  {filtered.map((item) =>
                    createBlockItem(
                      item.id,
                      item.title,
                      item.desc,
                      item.id === "customPlaceholders"
                        ? () => setShowPlaceholders((prev) => !prev)
                        : undefined,
                      item.draggable ?? true
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Templates tab ── */}
        <div
          className="panel-content"
          style={{
            display: tab === "templates" ? "block" : "none",
            maxWidth: "248px",
            width: "100%"
          }}
        >
          <div className="templates-container">
            <ReusableTab
              tabOptions={tabOptions}
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
            />

            {selectedTab === "library" &&
              (() => {
                const filtered = templateLibraryOptions.filter((o) =>
                  o.name.toLowerCase().includes(debouncedQuery.toLowerCase())
                );
                return (
                  <div className="libraryGrid">
                    {filtered.length > 0 ? (
                      filtered.map((option, index) => (
                        <div
                          className="libraryWrapper"
                          key={index}
                          onClick={handleTemplateSelect(option)}
                        >
                          <img src={option.img} alt={option.name} />
                          <span>{option.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="noResults">No templates found</div>
                    )}
                  </div>
                );
              })()}

            {selectedTab === "savedTemplate" &&
              (() => {
                const filtered = savedTemplateOptions.filter((o) =>
                  o.name.toLowerCase().includes(debouncedQuery.toLowerCase())
                );
                return (
                  <div className="savedTemplateFlex">
                    {filtered.length > 0 ? (
                      filtered.map((option, index) => (
                        <div
                          className="savedTemplateWrapper"
                          key={index}
                          onClick={handleTemplateSelect(option)}
                        >
                          <img src={option.img} alt={option.name} />
                          <span>{option.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="noResults">No templates found</div>
                    )}
                  </div>
                );
              })()}
          </div>
        </div>
      </div>

      <ReusableModal
        isOpen={openConfirmModal}
        title="Confirm Upload Template"
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmTemplate}
        cancelText="Cancel"
        confirmText="Confirm & Import"
      >
        <div className="confirmUploadTemplateContainer">
          <p className="confirmUploadTemplateContainerTitle">
            Are you sure you want to{" "}
            <span style={{ fontWeight: "600" }}>
              upload this HTML template?
            </span>
          </p>
          <p className="confirmUploadTemplateContainerTitle">
            Your current content will be replaced with the{" "}
            <span style={{ fontWeight: "600" }}>{pendingTemplate?.name}</span>.
          </p>
        </div>
      </ReusableModal>
    </>
  );
}
