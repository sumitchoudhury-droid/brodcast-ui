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
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../../../../../hooks/useToast";
import { ENDPOINTS } from "../../../../../api/endpoints.js";
import {
  BASE_URL,
  COMMON_HEADERS,
  handleResponse
} from "../../../../../api/api.jsx";
import SkeletonLoader from "../../../../../reusableComponents/reusableSkeletonLoader/SkeletonLoader";
import { EmojiSection } from "./emojiSection";
import { PlaceHolderSection } from "./placeHolderSection";
import { useBroadcastForm } from "../../../broadcastFormContext";

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

  const toast = useToast();
  const { setImportedTemplateName } = useBroadcastForm();

  // Swallow error in queryFn so the global queryCache.onError does not fire —
  // lets us show a custom toast instead of the server message.
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", "Mail", selectedTab],
    queryFn: async () => {
      try {
        const url = new URL(
          `${BASE_URL}${ENDPOINTS.templates.GET_ALL}`,
          window.location.origin
        );
        url.searchParams.set("methodTypes", "Mail");
        url.searchParams.set("includeInactive", "false");
        const res = await fetch(url.toString(), {
          headers: { "Content-Type": "application/json", ...COMMON_HEADERS }
        });
        return await handleResponse(res);
      } catch {
        return { __templatesError: true };
      }
    },
    enabled: tab === "templates"
  });

  useEffect(() => {
    if (templatesData?.__templatesError) {
      toast.error(
        "An error occurred while loading the template. Please retry after some time or contact support for further assistance."
      );
    }
  }, [templatesData, toast]);

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

  // Close the placeholder popup when the user clicks anywhere outside it.
  // The toggle block (customPlaceholders) is excluded so its own click keeps
  // owning the open/close toggle behavior; clicks inside the popup itself are
  // also excluded so interactions there don't dismiss it.
  useEffect(() => {
    if (!showPlaceholders) return;
    const handleClickOutside = (e) => {
      if (e.target.closest(".placeholderSection")) return;
      if (e.target.closest('[data-block-id="customPlaceholders"]')) return;
      setShowPlaceholders(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPlaceholders, setShowPlaceholders]);

  // Start a manual drag:
  //  1) clone the customBlock card into a cursor-following ghost (so the
  //     user always sees what they're dragging);
  //  2) listen to pointer events on both the outer document and the canvas
  //     iframe's document. The editor lives in an iframe — once the cursor
  //     crosses into it, outer-document mouse/pointer events stop firing.
  //     Iframe-local coords are translated by the iframe's bounding rect so
  //     the ghost (fixed-positioned in the outer document) stays glued to
  //     the real cursor;
  //  3) call BlockManager.startDrag so GrapesJS's pointer-event sorter
  //     handles drop target resolution.
  const handleBlockMouseDown = (blockId) => (e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const editor = editorRef?.current?.getEditor?.();
    if (!editor) return;
    const block = editor.BlockManager.get(blockId);
    if (!block) return;

    const card = e.currentTarget;
    const cardRect = card.getBoundingClientRect();
    const offsetX = e.clientX - cardRect.left;
    const offsetY = e.clientY - cardRect.top;

    const ghost = card.cloneNode(true);
    ghost.style.cssText = [
      "position:fixed",
      `left:${e.clientX - offsetX}px`,
      `top:${e.clientY - offsetY}px`,
      `width:${cardRect.width}px`,
      "margin:0",
      "pointer-events:none",
      "z-index:2147483647",
      "opacity:0.9",
      "box-shadow:0 8px 24px rgba(16,24,40,0.18)",
      "transition:none"
    ].join(";");
    document.body.appendChild(ghost);

    const iframeEl = editor.Canvas?.getFrameEl?.();
    const iframeDoc = editor.Canvas?.getDocument?.();
    const iframeWin = editor.Canvas?.getWindow?.();

    const positionGhost = (clientX, clientY) => {
      ghost.style.left = `${clientX - offsetX}px`;
      ghost.style.top = `${clientY - offsetY}px`;
    };

    const onOuterMove = (ev) => {
      // Chrome retargets some pointer events from inside the iframe up to
      // the outer document with target=iframe but keeps the original
      // iframe-local clientX/Y. Those events would place the ghost at the
      // wrong spot (far left of the viewport). Skip them — the iframe-doc
      // listener handles those correctly with the rect translation.
      if (iframeEl && ev.target === iframeEl) return;
      positionGhost(ev.clientX, ev.clientY);
    };
    const onInnerMove = (ev) => {
      if (!iframeEl) return;
      const r = iframeEl.getBoundingClientRect();
      positionGhost(ev.clientX + r.left, ev.clientY + r.top);
    };
    const cleanup = () => {
      document.removeEventListener("pointermove", onOuterMove, true);
      document.removeEventListener("mousemove", onOuterMove, true);
      document.removeEventListener("pointerup", cleanup, true);
      document.removeEventListener("mouseup", cleanup, true);
      if (iframeDoc) {
        iframeDoc.removeEventListener("pointermove", onInnerMove, true);
        iframeDoc.removeEventListener("mousemove", onInnerMove, true);
        iframeDoc.removeEventListener("pointerup", cleanup, true);
        iframeDoc.removeEventListener("mouseup", cleanup, true);
      }
      if (iframeWin) {
        iframeWin.removeEventListener("pointermove", onInnerMove, true);
        iframeWin.removeEventListener("mousemove", onInnerMove, true);
      }
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
    };

    document.addEventListener("pointermove", onOuterMove, true);
    document.addEventListener("mousemove", onOuterMove, true);
    document.addEventListener("pointerup", cleanup, true);
    document.addEventListener("mouseup", cleanup, true);
    if (iframeDoc) {
      iframeDoc.addEventListener("pointermove", onInnerMove, true);
      iframeDoc.addEventListener("mousemove", onInnerMove, true);
      iframeDoc.addEventListener("pointerup", cleanup, true);
      iframeDoc.addEventListener("mouseup", cleanup, true);
    }
    if (iframeWin) {
      iframeWin.addEventListener("pointermove", onInnerMove, true);
      iframeWin.addEventListener("mousemove", onInnerMove, true);
    }

    editor.BlockManager.startDrag(block, e.nativeEvent);
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
        setImportedTemplateName(pendingTemplate.name ?? "");
        setTab("blocks");
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

  const getIcon = (blockId) => {
    switch (blockId) {
      case "row":
        return (
          <img
            src={leftPanelColumn}
            alt="leftPanelRow"
            className="icon"
            draggable={false}
          ></img>
        );
      case "column":
        return (
          <img
            src={leftPanelRow}
            alt="leftPanelColumn"
            className="icon"
            draggable={false}
          ></img>
        );
      case "heading":
        return (
          <img
            src={leftPanelHeading}
            alt="leftPanelHeading"
            className="icon"
            draggable={false}
          ></img>
        );
      case "paragraph":
        return (
          <img
            src={leftPanelText}
            alt="leftPanelText"
            className="icon"
            draggable={false}
          ></img>
        );
      case "image":
        return (
          <img
            src={leftPanelPhoto}
            alt="leftPanelPhoto"
            className="icon"
            draggable={false}
          ></img>
        );
      case "button":
        return (
          <img
            src={leftPanelLink}
            alt="leftPanelLink"
            className="icon"
            draggable={false}
          ></img>
        );
      case "Attachment":
        return (
          <img
            src={leftPanelAttachment}
            alt="leftPanelAttachment"
            className="icon"
            draggable={false}
          ></img>
        );
      case "customPlaceholders":
        return (
          <img
            src={leftPanelPlaceholders}
            alt="leftPanelPlaceholders"
            className="ComponentIcon"
            draggable={false}
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
      data-block-id={blockId}
      onMouseDown={isDraggable ? handleBlockMouseDown(blockId) : undefined}
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
