import { useState, useEffect, useMemo } from "react";
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
import leftPanelPlaceholders from "../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import emptyTemplate from "../../../../../assets/existingTemplate/emptyTemplate.svg";

import "./style.scss";

import ReusableTab from "../../../../../reusableComponents/reusableTab";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal";
import { useGet } from "../../../../../hooks/useGet";
import { ENDPOINTS } from "../../../../../api/endpoints.js";
import {
  BASE_URL,
  COMMON_HEADERS,
  handleResponse
} from "../../../../../api/api.jsx";
import SkeletonLoader from "../../../../../reusableComponents/reusableSkeletonLoader/SkeletonLoader";
import { EmojiSection } from "./emojiSection";
import { PlaceHolderSection } from "./placeHolderSection";

const tabOptions = [
  { label: "Library", value: "library" },
  { label: "Saved Template", value: "savedTemplate" }
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
  setShowPlaceholders,
  setMailSubject
}) {
  const [tab, setTab] = useState("blocks");
  const [selectedTab, setSelectedTab] = useState(tabOptions?.[0]?.value || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: templatesData, isLoading: isLoadingTemplates } = useGet(
    ["templates", "Mail", selectedTab],
    ENDPOINTS.templates.GET_ALL,
    { methodTypes: "Mail", includeInactive: false },
    { enabled: tab === "templates" }
  );

  const apiSavedTemplates = useMemo(() => {
    const list = templatesData?.data ?? [];
    return list
      .filter(
        (t) => t.isActive && t.channels?.some((c) => c.methodType === "Mail")
      )
      .map((t) => {
        const mailChannel = t.channels.find((c) => c.methodType === "Mail");
        return {
          id: t.id,
          img: null,
          name: t.name,
          templateType: t.templateType,
          html: mailChannel.templateBody,
          subject: mailChannel.subjectLine
        };
      });
  }, [templatesData]);

  const libraryTemplates = useMemo(
    () => apiSavedTemplates.filter((t) => t.templateType === "ENTERPRISE"),
    [apiSavedTemplates]
  );

  const savedTemplates = useMemo(
    () => apiSavedTemplates.filter((t) => t.templateType === "NEW"),
    [apiSavedTemplates]
  );

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

  const handleConfirmTemplate = async () => {
    if (!pendingTemplate) return;
    setIsImporting(true);
    try {
      let templateBody = null;
      let subjectLine = null;

      if (pendingTemplate.id) {
        const res = await fetch(
          `${BASE_URL}${ENDPOINTS.templates.GET_BY_ID(pendingTemplate.id)}`,
          { headers: { "Content-Type": "application/json", ...COMMON_HEADERS } }
        );
        const json = await handleResponse(res);
        const mailChannel = json?.data?.channels?.find(
          (c) => c.methodType === "Mail"
        );
        if (mailChannel) {
          templateBody = mailChannel.templateBody;
          subjectLine = mailChannel.subjectLine;
        }
      } else if (pendingTemplate.html) {
        templateBody = pendingTemplate.html;
      }

      if (templateBody) {
        editorRef?.current?.loadTemplate?.(templateBody);
        if (subjectLine != null) setMailSubject?.(subjectLine);
      }
    } finally {
      setIsImporting(false);
      setOpenConfirmModal(false);
      setPendingTemplate(null);
    }
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
            const hasPlaceholders = filtered.some(
              (item) => item.id === "customPlaceholders"
            );
            return (
              <div
                className="gjs-block-category"
                key={category.title}
                style={hasPlaceholders ? { position: "relative" } : undefined}
              >
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
                {hasPlaceholders && showPlaceholders && (
                  <PlaceHolderSection
                    editorRef={editorRef}
                    setShowPlaceholders={setShowPlaceholders}
                  />
                )}
              </div>
            );
          })}

          <div className="gjs-block-category">
            <div className="gjs-title">Emojis</div>
            <EmojiSection editorRef={editorRef} />
          </div>
        </div>

        {/* ── Templates tab ── */}
        <div
          className="panel-content"
          style={{
            display: tab === "templates" ? "block" : "none",
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
                if (isLoadingTemplates) {
                  return (
                    <div className="savedTemplateFlex">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="savedTemplateWrapper">
                          <SkeletonLoader
                            width="40px"
                            height="40px"
                            borderRadius="6px"
                          />
                          <SkeletonLoader
                            width="120px"
                            height="13px"
                            borderRadius="4px"
                          />
                        </div>
                      ))}
                    </div>
                  );
                }
                const filtered = libraryTemplates.filter((o) =>
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
                          <img
                            src={option.img ?? emptyTemplate}
                            alt={option.name}
                          />
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
                if (isLoadingTemplates) {
                  return (
                    <div className="savedTemplateFlex">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="savedTemplateWrapper">
                          <SkeletonLoader
                            width="40px"
                            height="40px"
                            borderRadius="6px"
                          />
                          <SkeletonLoader
                            width="120px"
                            height="13px"
                            borderRadius="4px"
                          />
                        </div>
                      ))}
                    </div>
                  );
                }
                const filtered = savedTemplates.filter((o) =>
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
                          <img
                            src={option.img ?? emptyTemplate}
                            alt={option.name}
                          />
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
        confirmText={isImporting ? "Importing..." : "Confirm & Import"}
        confirmDisabled={isImporting}
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
