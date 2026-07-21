import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import mjml2html from "mjml-browser";
import "./style.scss";
import emptyTemplate from "../../../assets/existingTemplate/emptyTemplate.svg";
import emailIcon from "../../../assets/existingTemplate/mail.svg";
import textIcon from "../../../assets/existingTemplate/message.svg";
import voiceIcon from "../../../assets/existingTemplate/phone.svg";
import searchIcon from "../../../assets/commonIcons/searchIcon.svg";
import CloseButton from "../../../assets/commonIcons/CloseButton.svg";
import { ReusableButton } from "../../../reusableComponents/resuableButton/index";
import deleteIcon from "../../../assets/existingTemplate/deleteIcon.svg";
import { useGet } from "../../../hooks/useGet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BASE_URL, COMMON_HEADERS, handleResponse } from "../../../api/api.jsx";
import { ENDPOINTS } from "../../../api/endpoints.js";
import { useToast } from "../../../hooks/useToast";
import SkeletonLoader from "../../../reusableComponents/reusableSkeletonLoader/SkeletonLoader";

const modeNameToMethodType = { Email: "Mail", TEXT: "SMS", Voice: "Voice" };

function ExistingTemplates({
  isOpen,
  onClose,
  onSelectTemplate,
  initialModeTab = "Text",
  selectedModes = []
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeModeTab, setActiveModeTab] = useState(initialModeTab);
  const [prevInitialModeTab, setPrevInitialModeTab] = useState(initialModeTab);
  const [viewMode, setViewMode] = useState("desktop");

  if (prevInitialModeTab !== initialModeTab) {
    setPrevInitialModeTab(initialModeTab);
    setActiveModeTab(initialModeTab);
  }

  // Audio player state (mirrors textVoicePreview.jsx)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);

  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(null);
  const offsetRef = useRef(0);
  const trackRef = useRef(null);

  const methodTypes = selectedModes
    .map((m) => modeNameToMethodType[m])
    .filter(Boolean);

  const { data: templatesData, isLoading: templatesLoading } = useGet(
    ["templates", ...methodTypes],
    ENDPOINTS.templates.GET_ALL,
    methodTypes.length > 0
      ? { methodTypes, includeInactive: false }
      : { includeInactive: false },
    { enabled: isOpen }
  );

  const queryClient = useQueryClient();
  const toast = useToast();

  const { mutate: deleteTemplate } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(
        `${BASE_URL}${ENDPOINTS.templates.DELETE_BY_ID(id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", ...COMMON_HEADERS }
        }
      );
      return handleResponse(res);
    },
    onSuccess: (_, id) => {
      toast.success("Deleted", "Template deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
    }
  });

  const methodTypeToMode = (methodType) => {
    if (methodType === "Mail") return "mail";
    if (methodType === "SMS") return "text";
    if (methodType === "Voice") return "voice";
    return methodType.toLowerCase();
  };

  const templates = (templatesData?.data || []).map((t) => ({
    id: t.id,
    title: t.name,
    modes: t.channels.map((c) => methodTypeToMode(c.methodType)),
    channels: t.channels,
    image: null
  }));

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fall back to the first loaded template when the user hasn't made an explicit selection
  const effectiveSelectedTemplate = selectedTemplate ?? templates[0] ?? null;

  const handleSelectTemplate = () => {
    if (onSelectTemplate) {
      onSelectTemplate(effectiveSelectedTemplate);
    }
    onClose();
  };

  const getChannelBody = (methodType) =>
    effectiveSelectedTemplate?.channels?.find(
      (c) => c.methodType === methodType
    )?.templateBody || "";

  // Compile MJML → HTML; fall back to raw string on failure
  const compileMjml = (raw) => {
    if (!raw || !raw.trimStart().startsWith("<mjml")) return raw;
    try {
      // Normalize mj-body width from percentage to 600px so MJML computes
      // column and image widths correctly (percentage values cause mjml2html
      // to treat the body as ~100px, capping image widths to the column width).
      let normalized = raw.replace(
        /(<mj-body\b[^>]*)\bwidth="[\d.]+%"/,
        '$1width="600px"'
      );

      // mjml2html strips flex properties (align-items, justify-content, gap)
      // from mj-section because MJML uses table-based layout. To preserve
      // these styles in the preview, we assign each section that carries them
      // a unique css-class and inject an mj-style rule that applies the flex
      // properties to the column-container <td> generated by MJML.
      const flexCssRules = [];
      let flexClassIdx = 0;
      normalized = normalized.replace(
        /<mj-section\b([^>]*)>/g,
        (match, attrs) => {
          const styleMatch = attrs.match(/\bstyle="([^"]*)"/);
          if (!styleMatch) return match;

          const styleStr = styleMatch[1];
          const aiMatch = styleStr.match(/align-items\s*:\s*([^;,"]+)/);
          const jcMatch = styleStr.match(/justify-content\s*:\s*([^;,"]+)/);
          const gapMatch = styleStr.match(/\bgap\s*:\s*([^;,"]+)/);
          if (!aiMatch && !jcMatch && !gapMatch) return match;

          const cls = `gjs-flex-${flexClassIdx++}`;
          const props = [
            "display: flex !important",
            "flex-direction: row !important",
            "flex-wrap: nowrap !important"
          ];
          if (aiMatch)
            props.push(`align-items: ${aiMatch[1].trim()} !important`);
          if (jcMatch)
            props.push(`justify-content: ${jcMatch[1].trim()} !important`);
          if (gapMatch) props.push(`gap: ${gapMatch[1].trim()} !important`);

          flexCssRules.push(
            `.${cls} > table > tbody > tr > td { ${props.join("; ")}; }`
          );

          const existingClass = attrs.match(/\bcss-class="([^"]*)"/);
          if (existingClass) {
            return match.replace(
              `css-class="${existingClass[1]}"`,
              `css-class="${existingClass[1]} ${cls}"`
            );
          }
          return `<mj-section${attrs} css-class="${cls}">`;
        }
      );

      if (flexCssRules.length > 0) {
        const styleTag = `<mj-style>${flexCssRules.join("\n")}</mj-style>`;
        if (normalized.includes("<mj-head>")) {
          normalized = normalized.replace("<mj-head>", `<mj-head>${styleTag}`);
        } else if (/<mj-head\s*\/>/.test(normalized)) {
          normalized = normalized.replace(
            /<mj-head\s*\/>/,
            `<mj-head>${styleTag}</mj-head>`
          );
        } else {
          normalized = normalized.replace(
            "<mj-body",
            `<mj-head>${styleTag}</mj-head><mj-body`
          );
        }
      }

      const { html, errors } = mjml2html(normalized, {
        validationLevel: "skip"
      });
      if (errors?.length) return raw;
      return html;
    } catch {
      return raw;
    }
  };

  // Strip GrapesJS editor attributes so the content renders cleanly.
  // Preserve `id` and any embedded <style> tags — GrapesJS's compiled CSS
  // (prepended to templateBody at save time) uses component IDs as selectors,
  // so stripping them would drop all styling in the preview.
  const cleanGjsHtml = (raw) => {
    if (!raw) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");
    doc.querySelectorAll("*").forEach((el) => {
      if (el.tagName === "STYLE") return;
      el.removeAttribute("data-gjs-highlightable");
      el.removeAttribute("data-gjs-type");
      el.removeAttribute("data-placeholder");
      el.removeAttribute("contenteditable");
      el.removeAttribute("draggable");
      ["gjs-selected", "gjs-hovered", "gjs-editable", "is-empty"].forEach(
        (cls) => el.classList.remove(cls)
      );
      if (el.getAttribute("class") === "") el.removeAttribute("class");
    });
    // Merge any <style> tags that ended up in <head> back into body output,
    // so srcDoc-based iframe previews always receive the styles alongside
    // the markup they target.
    const headStyles = Array.from(doc.head.querySelectorAll("style"))
      .map((s) => s.outerHTML)
      .join("");
    return headStyles + doc.body.innerHTML;
  };

  const mailPreviewHtml = useMemo(
    () => compileMjml(getChannelBody("Mail")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveSelectedTemplate]
  );

  const smsPreviewHtml = useMemo(
    () => cleanGjsHtml(getChannelBody("SMS")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveSelectedTemplate]
  );

  // Extract plain text from Voice channel body for speech synthesis
  const getVoiceText = () => {
    const body = getChannelBody("Voice");
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");
    return doc.body.textContent?.trim() || "";
  };

  // Extract inner HTML of content td from Voice channel body
  const getVoiceHtmlContent = () => {
    const body = getChannelBody("Voice");
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");
    const td = doc.querySelector('td[style*="padding"]');
    return td ? td.innerHTML : body;
  };

  const startProgressTimer = useCallback((estimatedMs, startPct = 0) => {
    clearInterval(intervalRef.current);
    const startMs = Date.now() - estimatedMs * (startPct / 100);
    startTimeRef.current = startMs;
    durationRef.current = estimatedMs;
    setDuration(estimatedMs);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / estimatedMs) * 100, 99);
      setProgress(pct);
    }, 200);
  }, []);

  const handlePlay = useCallback(
    (startCharIndex = 0) => {
      const synth = synthRef.current;

      if (isPaused && utteranceRef.current && startCharIndex === 0) {
        synth.resume();
        setIsPaused(false);
        setIsPlaying(true);
        startProgressTimer(durationRef.current, progress);
        return;
      }

      const fullText = getVoiceText();
      const textToSpeak =
        startCharIndex > 0 ? fullText.slice(startCharIndex) : fullText;
      offsetRef.current = startCharIndex;

      synth.cancel();
      clearInterval(intervalRef.current);

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;

      const wordCount = fullText.split(/\s+/).length;
      const estimatedMs = (wordCount / 126) * 60 * 1000;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        const initialPct = (startCharIndex / fullText.length) * 100;
        setProgress(initialPct);
        startProgressTimer(estimatedMs, initialPct);
      };

      utterance.onend = () => {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        setTimeout(() => setProgress(0), 600);
      };

      utterance.onerror = () => {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPaused, progress, startProgressTimer]
  );

  function handleSeek(e) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const fullText = getVoiceText();
    const newIndex = Math.floor(pct * fullText.length);
    handlePlay(newIndex);
  }

  function handleMouseDown(e) {
    setIsDragging(true);
    handleSeek(e);
  }
  function handlePause() {
    synthRef.current.pause();
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setIsPaused(true);
  }

  const formatTime = (ms) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTimeMs = (progress / 100) * (duration || 0);

  // Stop speech when tab changes away from Voice or template changes
  useEffect(() => {
    if (activeModeTab !== "Voice") {
      synthRef.current.cancel();
      clearInterval(intervalRef.current);
      utteranceRef.current = null;
      offsetRef.current = 0;
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeModeTab, effectiveSelectedTemplate]);

  // Stop speech when drawer closes
  useEffect(() => {
    const synth = synthRef.current;
    if (!isOpen) {
      synth.cancel();
      clearInterval(intervalRef.current);
      utteranceRef.current = null;
    }
    return () => {
      synth.cancel();
      clearInterval(intervalRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        offsetRef.current = 0;
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Dragging effect
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      setProgress(pct * 100);
    };

    const handleMouseUp = (e) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const fullText = getVoiceText();
      const newIndex = Math.floor(pct * fullText.length);
      setIsDragging(false);
      handlePlay(newIndex);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, handlePlay]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderModeIcons = (modes) => {
    return (
      <div className="templateModeIcons">
        {modes.includes("text") && <img src={textIcon} alt="text" />}
        {modes.includes("mail") && <img src={emailIcon} alt="mail" />}
        {modes.includes("voice") && <img src={voiceIcon} alt="voice" />}
      </div>
    );
  };

  const renderInnerPreview = () => {
    return activeModeTab === "Voice" ? (
      <div className="voicePreviewBody">
        <div
          className="voiceMessageText"
          dangerouslySetInnerHTML={{
            __html: getVoiceHtmlContent()
          }}
        />
        <div className="audioPreviewSection">
          <p className="sectionTitle">Audio Preview</p>
          <div className="audioPlayerPill">
            <button
              className="playPauseBtn"
              onClick={() => (isPlaying ? handlePause() : handlePlay(0))}
            >
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div
              className={`progressTrack ${isDragging ? "dragging" : ""}`}
              ref={trackRef}
              onMouseDown={handleMouseDown}
            >
              <div className="progressFill" style={{ width: `${progress}%` }}>
                <div className="progressHandle" />
              </div>
            </div>

            <div className="timeDisplay">
              {formatTime(currentTimeMs)} / {formatTime(duration)}
            </div>

            <div className="volumeIcon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            </div>

            <button className="menuBtn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ) : (
      <iframe
        srcDoc={activeModeTab === "Mail" ? mailPreviewHtml : smsPreviewHtml}
        title="Template Preview"
        className="previewIframe"
      />
    );
  };

  return (
    <div className="existingTemplatesDrawerOverlay" onClick={onClose}>
      <div
        className="existingTemplatesDrawerContainer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawerHeader">
          <div className="headerTitle">
            <h3>Select Template</h3>
          </div>
          <div className="closeBtn" onClick={onClose}>
            <img src={CloseButton} alt="Close" />
          </div>
        </div>

        <div className="drawerBody">
          <div className="leftPanel">
            <div className="searchContainer">
              <div className="searchInputWrapper">
                <img src={searchIcon} alt="search" className="searchIcon" />
                <input
                  type="text"
                  placeholder="Search template"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="savedTemplatesTitle">
              <p>Saved Templates</p>
            </div>

            <div className="templatesList">
              {templatesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="templateItemCard">
                    <SkeletonLoader
                      width="72px"
                      height="52px"
                      borderRadius="6px"
                    />
                    <div className="templateCardInfo">
                      <SkeletonLoader
                        width="120px"
                        height="14px"
                        borderRadius="4px"
                      />
                      <SkeletonLoader
                        width="60px"
                        height="12px"
                        borderRadius="4px"
                      />
                    </div>
                  </div>
                ))
              ) : filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`templateItemCard ${effectiveSelectedTemplate?.id === template.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedTemplate(template);
                      if (template.modes.length > 0) {
                        const currentMode = activeModeTab.toLowerCase();
                        if (!template.modes.includes(currentMode)) {
                          const firstMode = template.modes[0];
                          setActiveModeTab(
                            firstMode.charAt(0).toUpperCase() +
                              firstMode.slice(1)
                          );
                        }
                      }
                    }}
                  >
                    <div className="templateThumbnail">
                      {template.image ? (
                        <img src={template.image} alt="template" />
                      ) : (
                        <img src={emptyTemplate} alt="defaultTemplate" />
                      )}
                    </div>
                    <div className="templateCardInfo">
                      <p className="templateCardTitle">{template.title}</p>
                      <div className="templateModeWrapper">
                        {renderModeIcons(template.modes)}
                        <img
                          src={deleteIcon}
                          alt="deleteIcon"
                          className="templateDeleteIcon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="noResults">
                  <p>No results found</p>
                </div>
              )}
            </div>
          </div>

          <div className="rightPanel">
            {effectiveSelectedTemplate && (
              <div className="rightPanelTop">
                <div className="modeTabsContainer">
                  <div className="modeTabs">
                    {["Text", "Mail", "Voice"]
                      .filter((mode) =>
                        effectiveSelectedTemplate.modes.includes(
                          mode.toLowerCase()
                        )
                      )
                      .map((mode) => (
                        <button
                          key={mode}
                          className={`modeTab ${activeModeTab === mode ? "active" : ""}`}
                          onClick={() => setActiveModeTab(mode)}
                        >
                          {mode}
                        </button>
                      ))}
                  </div>
                </div>
                <div className="viewMode">
                  <div
                    className={`modeIcon ${viewMode === "mobile" ? "active" : ""}`}
                    onClick={() => setViewMode("mobile")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                    >
                      <path
                        d="M10.0833 3.66667H11.9167M11 15.5833V15.5925M5.5 4.58333C5.5 4.0971 5.69315 3.63079 6.03697 3.28697C6.38079 2.94315 6.8471 2.75 7.33333 2.75H14.6667C15.1529 2.75 15.6192 2.94315 15.963 3.28697C16.3068 3.63079 16.5 4.0971 16.5 4.58333V17.4167C16.5 17.9029 16.3068 18.3692 15.963 18.713C15.6192 19.0568 15.1529 19.25 14.6667 19.25H7.33333C6.8471 19.25 6.38079 19.0568 6.03697 18.713C5.69315 18.3692 5.5 17.9029 5.5 17.4167V4.58333Z"
                        stroke="#606E80"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div
                    className={`modeIcon ${viewMode === "desktop" ? "active" : ""}`}
                    onClick={() => setViewMode("desktop")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                    >
                      <path
                        d="M6.41667 18.3327H15.5833M8.25 14.666V18.3327M13.75 14.666V18.3327M2.75 4.58268C2.75 4.33957 2.84658 4.10641 3.01849 3.9345C3.19039 3.76259 3.42355 3.66602 3.66667 3.66602H18.3333C18.5764 3.66602 18.8096 3.76259 18.9815 3.9345C19.1534 4.10641 19.25 4.33957 19.25 4.58268V13.7493C19.25 13.9925 19.1534 14.2256 18.9815 14.3975C18.8096 14.5694 18.5764 14.666 18.3333 14.666H3.66667C3.42355 14.666 3.19039 14.5694 3.01849 14.3975C2.84658 14.2256 2.75 13.9925 2.75 13.7493V4.58268Z"
                        stroke="#606E80"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div className="previewArea">
              {!effectiveSelectedTemplate ? (
                <div className="previewPlaceholder">
                  <div className="placeholderIcon">
                    <img src={emptyTemplate} alt="empty" />
                  </div>
                  <p>
                    {" "}
                    <span>Select a saved Template</span> from left panel.
                  </p>
                </div>
              ) : (
                <div className="templatePreviewContent">
                  <div className="previewTag">
                    <p>Preview</p>
                  </div>
                  {viewMode === "mobile" ? (
                    <div className="mobilePhoneMockup">
                      <div className="phoneNotch" />
                      <div className="phoneStatusBar">
                        <span className="statusBarTime">9:41</span>
                        <div className="statusBarIcons">
                          <svg
                            width="17"
                            height="11"
                            viewBox="0 0 17 11"
                            fill="currentColor"
                          >
                            <path d="M2 10h1v1H2zm3-2h1v3H5zm3-3h1v6H8zm3-3h1v9h-1zm3-2h1v11h-1z" />
                          </svg>
                          <svg
                            width="15"
                            height="11"
                            viewBox="0 0 15 11"
                            fill="currentColor"
                          >
                            <path d="M7.5 1.5C4.7 1.5 2.1 2.6.2 4.4l1.1 1.1c1.6-1.5 3.7-2.4 6.2-2.4s4.6.9 6.2 2.4l1.1-1.1C12.9 2.6 10.3 1.5 7.5 1.5zM7.5 5c-1.8 0-3.4.7-4.6 2l1.1 1.1c.9-.9 2.1-1.5 3.5-1.5s2.6.6 3.5 1.5l1.1-1.1c-1.2-1.3-2.8-2-4.6-2zm0 3.5c-.8 0-1.5.3-2.1.9l2.1 2.1 2.1-2.1c-.6-.6-1.3-.9-2.1-.9z" />
                          </svg>
                          <svg
                            width="22"
                            height="11"
                            viewBox="0 0 22 11"
                            fill="currentColor"
                          >
                            <rect
                              x="0.5"
                              y="0.5"
                              width="18"
                              height="10"
                              rx="2.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1"
                            />
                            <rect x="2" y="2" width="13" height="7" rx="1.5" />
                            <path d="M19.5 3.5v4c.8 0 1-.5 1-2s-.2-2-1-2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="phoneHeaderBar">
                        <svg
                          className="headerBackBtn"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <div className="headerActionsRight">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="21 8 21 21 3 21 3 8" />
                            <rect x="1" y="3" width="22" height="5" />
                            <line x1="10" y1="12" x2="14" y2="12" />
                          </svg>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </div>
                      </div>
                      <div className="phoneContentArea">
                        <div
                          className={`previewContent mobile ${activeModeTab === "Voice" ? "voiceMode" : ""}`}
                        >
                          {renderInnerPreview()}
                        </div>
                      </div>
                      <div className="phoneHomeIndicator" />
                    </div>
                  ) : (
                    <div
                      className={`previewContent desktop ${activeModeTab === "Voice" ? "voiceMode" : ""}`}
                    >
                      {renderInnerPreview()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="drawerFooter">
          <ReusableButton label="Cancel" onClick={onClose} variant="primary" />
          <ReusableButton
            label="Select Template"
            onClick={handleSelectTemplate}
            variant="secondary"
            disabled={!effectiveSelectedTemplate}
          />
        </div>
      </div>
    </div>
  );
}

export default ExistingTemplates;
