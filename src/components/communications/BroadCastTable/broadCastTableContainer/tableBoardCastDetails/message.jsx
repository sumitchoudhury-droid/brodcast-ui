import { useState, useEffect, useRef, useMemo } from "react";
import mjml2html from "mjml-browser";
import SkeletonLoader from "../../../../../reusableComponents/reusableSkeletonLoader/SkeletonLoader";
import "./style.scss";

// Icons
import emailIcon from "../../../../../assets/existingTemplate/mail.svg";
import textIcon from "../../../../../assets/existingTemplate/message.svg";
import voiceIcon from "../../../../../assets/existingTemplate/phone.svg";
import desktopIcon from "../../../../../assets/previewSection/desktopIcon.svg";
import playIcon from "../../../../../assets/voiceTextIcons/playIcon.svg";
import pausedIcon from "../../../../../assets/voiceTextIcons/pausedIcon.svg";

// Raw HTML templates — fallbacks used when the template fetch hasn't
// resolved yet or the row has no messageTempLibId
import emailTemplate from "../../../existingTemplates/htmlTemplates/email.html?raw";
import textTemplate from "../../../existingTemplates/htmlTemplates/textMessage.html?raw";
import voiceTemplate from "../../../existingTemplates/htmlTemplates/voiceMessage.html?raw";

// Compile MJML → HTML exactly as a real send pipeline would. No editor-only
// CSS injections — whatever this returns is what will land in the recipient's
// inbox. Falls back to the raw string on failure or when the input isn't MJML.
const compileMjml = (raw) => {
  if (!raw || !raw.trimStart().startsWith("<mjml")) return raw;
  try {
    // Normalize mj-body width from percentage to 600px. mjml-browser
    // interprets a percentage body width as ~100px which caps every column
    // and image width. Real send pipelines feed the compiler a fixed pixel
    // width (600px is the MJML default), so this normalization matches
    // production behavior rather than diverging from it.
    const normalized = raw.replace(
      /(<mj-body\b[^>]*)\bwidth="[\d.]+%"/,
      '$1width="600px"'
    );

    const { html, errors } = mjml2html(normalized, {
      validationLevel: "skip"
    });
    if (errors?.length) return raw;
    return html;
  } catch {
    return raw;
  }
};

// Strip GrapesJS editor attributes so SMS/voice HTML renders cleanly while
// preserving id-based CSS (GrapesJS' compiled styles reference them).
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
    ["gjs-selected", "gjs-hovered", "gjs-editable", "is-empty"].forEach((cls) =>
      el.classList.remove(cls)
    );
    if (el.getAttribute("class") === "") el.removeAttribute("class");
  });
  const headStyles = Array.from(doc.head.querySelectorAll("style"))
    .map((s) => s.outerHTML)
    .join("");
  return headStyles + doc.body.innerHTML;
};

// Reusable Phone Frame Component
const PhoneMockup = ({ children }) => (
  <div className="phoneMockup">
    <div className="phoneCameraNotch"></div>
    <div className="phoneStatusBar">
      <div className="phoneTime">9:41</div>
      <div className="phoneStatusIcons">
        <svg
          className="statusIcon"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
        >
          <path d="M12 3c-1.2 0-2.4.4-3.4 1.2L2.3 9.4c-.4.3-.4.8-.1 1.2.3.4.8.4 1.2.1L9 6.2C10 5.4 11 5 12 5s2 .4 3 1.2l5.6 4.5c.2.2.4.3.7.3.2 0 .4-.1.6-.2.4-.3.4-.8.1-1.2l-6.3-5.2C14.4 3.4 13.2 3 12 3z" />
          <path d="M12 8c-.8 0-1.6.3-2.3.8L5 12.6c-.4.3-.4.9 0 1.2.3.3.9.3 1.2 0l4.7-3.8c.8-.7 1.9-.7 2.7 0l4.7 3.8c.3.3.9.3 1.2 0 .4-.3.4-.9 0-1.2l-4.7-3.8C13.6 8.3 12.8 8 12 8z" />
          <path d="M12 13c-.4 0-.8.1-1.1.4L8 15.6c-.4.3-.4.9 0 1.2.3.3.9.3 1.2 0l2.8-2.2 2.8 2.2c.3.3.9.3 1.2 0 .4-.3.4-.9 0-1.2l-2.9-2.2c-.3-.3-.7-.4-1.1-.4z" />
          <path d="M12 18a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
        </svg>
        <svg
          className="statusIcon"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
        >
          <path d="M2 17h2v4H2zm4-4h2v8H6zm4-4h2v12h-2zm4-4h2v16h-2zm4-4h2v20h-2z" />
        </svg>
        <svg
          className="statusIcon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <rect
            x="2"
            y="6"
            width="16"
            height="12"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="4" y="8" width="12" height="8" rx="1" fill="currentColor" />
          <path
            d="M20 9v6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
    <div className="phoneInnerScreen">{children}</div>
    <div className="phoneHomeIndicator"></div>
  </div>
);

const cleanHtmlForSms = (html) => {
  if (!html) return "";
  let content = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  }
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove table wraps completely but keep content
  content = content.replace(/<\/?(table|tr|td|tbody|thead|tfoot)[^>]*>/gi, "");

  return content.trim();
};

// Helper to extract clean text (paragraphs joined by spaces) from HTML template
const cleanTextFromHtml = (html) => {
  if (!html) return "";
  let content = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  }
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  const pPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs = [];
  let match;
  while ((match = pPattern.exec(content)) !== null) {
    let pText = match[1];
    pText = pText.replace(/<[^>]+>/g, ""); // Strip inner HTML tags
    pText = pText.replace(/\s+/g, " ").trim(); // Collapse newlines and tabs to single spaces
    pText = pText.replace(/&nbsp;/g, " ");
    pText = pText.replace(/&amp;/g, "&");
    pText = pText.replace(/&lt;/g, "<");
    pText = pText.replace(/&gt;/g, ">");

    if (pText) {
      paragraphs.push(pText);
    }
  }

  if (paragraphs.length === 0) {
    let plain = content.replace(/<[^>]+>/g, " ");
    plain = plain.replace(/\s+/g, " ").trim();
    return plain;
  }

  return paragraphs.join(" ");
};

// Helper to extract clean text for Speech Synthesis
const getSpeechText = (html) => {
  let text = cleanTextFromHtml(html);

  // Replace template variables with readable equivalents
  text = text.replace(/\$FNAME/g, "John");
  text = text.replace(/\$PFNAME/g, "Doctor Phillips");
  text = text.replace(/\$APPTIME12/g, "10:30 AM");

  return text;
};

// Format seconds into M:SS format (e.g. 0:16 / 1:23)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

function Message({ broadcastData, template, isTemplateLoading }) {
  const { mode = "SMS" } = broadcastData || {};

  // Resolve per-channel bodies from the fetched template. Each channel
  // stores its content under `templateBody`; the raw HTML imports serve
  // as fallbacks so previews stay populated while the fetch is pending.
  const getChannelBody = (methodType) =>
    template?.channels?.find((c) => c.methodType === methodType)?.templateBody;

  const emailBody = useMemo(() => {
    const raw = getChannelBody("Mail");
    return raw ? compileMjml(raw) : emailTemplate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  const smsBody = useMemo(() => {
    const raw = getChannelBody("SMS");
    return raw ? cleanGjsHtml(raw) : textTemplate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  const voiceBody = useMemo(() => {
    const raw = getChannelBody("Voice");
    return raw || voiceTemplate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  const lowerMode = (mode || "").toLowerCase();
  const showSms = lowerMode.includes("sms");
  const showMail = lowerMode.includes("mail") || lowerMode.includes("email");
  const showVoice = lowerMode.includes("voice") || lowerMode.includes("...");
  const activeChannelsCount = [showSms, showMail, showVoice].filter(
    Boolean
  ).length;

  // Infer initial channel tab based on broadcast data mode
  const getInitialTab = () => {
    if (showSms) return "sms";
    if (showMail) return "mail";
    if (showVoice) return "voice";
    return "sms";
  };

  const [activeChannel, setActiveChannel] = useState(getInitialTab());
  const [prevMode, setPrevMode] = useState(mode);

  if (mode !== prevMode) {
    setPrevMode(mode);
    setActiveChannel(getInitialTab());
  }

  const [viewMode, setViewMode] = useState("desktop"); // desktop or mobile for email
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(70); // Starts at 01:10 (70s) out of 83s (01:23)
  const totalDuration = 83; // 1:23 in seconds
  const [highlightIndex, setHighlightIndex] = useState(0);
  const speechOffsetRef = useRef(0);

  // Extract paragraphs as an array of strings
  const displayVoiceParagraphs = useMemo(() => {
    let content = voiceBody;
    const bodyMatch = voiceBody.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      content = bodyMatch[1];
    }
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

    const pPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphs = [];
    let match;
    while ((match = pPattern.exec(content)) !== null) {
      let pText = match[1];
      pText = pText.replace(/<[^>]+>/g, "");
      pText = pText.replace(/\s+/g, " ").trim();
      pText = pText.replace(/&nbsp;/g, " ");
      pText = pText.replace(/&amp;/g, "&");
      pText = pText.replace(/&lt;/g, "<");
      pText = pText.replace(/&gt;/g, ">");

      if (pText) {
        paragraphs.push(pText);
      }
    }
    // Fallback: if no <p> tags (SMS-like content), split on line breaks
    if (paragraphs.length === 0) {
      const plain = content
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (plain) paragraphs.push(plain);
    }
    return paragraphs;
  }, [voiceBody]);

  // Joined text with single space for SpeechSynthesis boundary mapping
  const displayVoiceText = useMemo(() => {
    return displayVoiceParagraphs.join(" ");
  }, [displayVoiceParagraphs]);

  // Calculate split character index for styling already-spoken text
  const getHighlightCharIndex = () => {
    if (isPlaying && highlightIndex > 0) {
      return highlightIndex;
    }
    return Math.floor(displayVoiceText.length * (elapsedTime / totalDuration));
  };

  // Helper to start speech synthesis from a specific elapsedTime
  const startSpeech = (fromTime, shouldPlay) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const spokenText = getSpeechText(voiceBody);
    const ratio = fromTime / totalDuration;
    const charIndex = Math.min(
      Math.floor(spokenText.length * ratio),
      spokenText.length
    );

    // Find nearest word boundary
    let startIndex = charIndex;
    if (startIndex > 0 && startIndex < spokenText.length) {
      while (
        startIndex > 0 &&
        spokenText[startIndex] !== " " &&
        spokenText[startIndex - 1] !== " "
      ) {
        startIndex--;
      }
    }
    speechOffsetRef.current = startIndex;

    const newHighlight = Math.floor(
      displayVoiceText.length * (startIndex / spokenText.length)
    );
    setHighlightIndex(newHighlight);

    if (shouldPlay) {
      const textToSpeak = spokenText.slice(startIndex);
      if (!textToSpeak.trim()) {
        setIsPlaying(false);
        setElapsedTime(totalDuration);
        setHighlightIndex(displayVoiceText.length);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find((v) => v.lang.startsWith("en"));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onboundary = (event) => {
        if (event.name === "word") {
          const currentGlobalCharIndex =
            speechOffsetRef.current + event.charIndex;
          const currentRatio = currentGlobalCharIndex / spokenText.length;
          setHighlightIndex(Math.floor(displayVoiceText.length * currentRatio));
          setElapsedTime(Math.floor(totalDuration * currentRatio));
        }
      };

      utterance.onend = () => {
        if (
          speechOffsetRef.current + textToSpeak.length >=
          spokenText.length - 5
        ) {
          setIsPlaying(false);
          setElapsedTime(0);
          setHighlightIndex(0);
          speechOffsetRef.current = 0;
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  // Handle voice simulation player timer (fallback if SpeechSynthesis is not speaking or not supported)
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          return;
        }
        setElapsedTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Clean up speech when switching channels or when unmounting
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setHighlightIndex(0);
      setElapsedTime(0);
      speechOffsetRef.current = 0;
    };
  }, [activeChannel]);

  const handlePlayPause = () => {
    if (!window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const timeToStart = elapsedTime >= totalDuration ? 0 : elapsedTime;
      if (timeToStart === 0) {
        setElapsedTime(0);
        setHighlightIndex(0);
      }
      startSpeech(timeToStart, true);
    }
  };

  const handleSliderChange = (e) => {
    const newTime = Number(e.target.value);
    setElapsedTime(newTime);

    // Also update highlightIndex to match
    const ratio = newTime / totalDuration;
    setHighlightIndex(Math.floor(displayVoiceText.length * ratio));

    // Seek/Restart speech from the new position
    startSpeech(newTime, isPlaying);
  };

  return (
    <div className="tabContentMessage">
      {/* Sub tabs and layout togglers header */}
      {(activeChannelsCount > 1 || activeChannel === "mail") && (
        <div
          className="messageSubHeaderRow"
          style={{
            justifyContent:
              activeChannelsCount > 1 ? "space-between" : "flex-end"
          }}
        >
          {activeChannelsCount > 1 && (
            <div className="channelTabChips">
              {showSms && (
                <button
                  className={`tabChip ${activeChannel === "sms" ? "active" : ""}`}
                  onClick={() => setActiveChannel("sms")}
                >
                  <img src={textIcon} alt="SMS" className="tabChipIcon" />
                  SMS
                </button>
              )}
              {showMail && (
                <button
                  className={`tabChip ${activeChannel === "mail" ? "active" : ""}`}
                  onClick={() => setActiveChannel("mail")}
                >
                  <img src={emailIcon} alt="Mail" className="tabChipIcon" />
                  Mail
                </button>
              )}
              {showVoice && (
                <button
                  className={`tabChip ${activeChannel === "voice" ? "active" : ""}`}
                  onClick={() => setActiveChannel("voice")}
                >
                  <img src={voiceIcon} alt="Voice" className="tabChipIcon" />
                  Voice
                </button>
              )}
            </div>
          )}

          {activeChannel === "mail" && (
            <div className="mailLayoutToggle">
              <button
                className={`toggleBtn ${viewMode === "desktop" ? "active" : ""}`}
                onClick={() => setViewMode("desktop")}
                title="Desktop View"
              >
                <img src={desktopIcon} alt="Desktop Layout" />
              </button>
              <button
                className={`toggleBtn ${viewMode === "mobile" ? "active" : ""}`}
                onClick={() => setViewMode("mobile")}
                title="Mobile View"
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
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Preview Container */}
      <div className="channelPreviewArea">
        {/* SMS CHANNEL PREVIEW */}
        {activeChannel === "sms" && (
          <div className="centeredMockupWrapper">
            <PhoneMockup>
              <div className="smsPreviewHeader">
                <button className="backBtn" disabled>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <path d="M15.4 7.4L10 12.8l5.4 5.4c.4.4.4 1 0 1.4-.4.4-1 .4-1.4 0l-6.1-6.1c-.4-.4-.4-1 0-1.4l6.1-6.1c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4z" />
                  </svg>
                </button>
                <div className="contactProfile">
                  <div className="avatarCircle">
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 3c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm0 14.2c-2.5 0-4.7-1.3-6-3.2.1-2 4-3.1 6-3.1s5.9 1.1 6 3.1c-1.3 1.9-3.5 3.2-6 3.2z" />
                    </svg>
                  </div>
                  <span className="contactName">
                    MHCARE <span className="chevron">&gt;</span>
                  </span>
                </div>
              </div>
              <div className="smsScreenContent">
                {isTemplateLoading ? (
                  <div
                    className="smsBubble"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <SkeletonLoader width="80%" height="12px" />
                    <SkeletonLoader width="95%" height="12px" />
                    <SkeletonLoader width="60%" height="12px" />
                  </div>
                ) : (
                  <div
                    className="smsBubble"
                    dangerouslySetInnerHTML={{
                      __html: smsBody.startsWith("<style>")
                        ? smsBody
                        : cleanHtmlForSms(smsBody)
                    }}
                  />
                )}
              </div>
            </PhoneMockup>
          </div>
        )}

        {/* MAIL CHANNEL PREVIEW */}
        {activeChannel === "mail" && (
          <div className="mailPreviewContainer">
            {viewMode === "desktop" ? (
              <div className="desktopMailWrapper">
                {/* Desktop Sender details Header */}
                <div className="senderHeaderDetails">
                  <div className="senderAvatar">MH</div>
                  <div className="senderInfo">
                    <div className="mailSubject">Payment Reminder</div>
                    <div className="mailSender">Manipal Hospitals</div>
                  </div>
                </div>
                {/* Desktop Email Body frame */}
                <div className="emailDesktopBodyFrame">
                  {isTemplateLoading ? (
                    <div
                      style={{
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px"
                      }}
                    >
                      <SkeletonLoader width="100%" height="180px" />
                      <SkeletonLoader width="80%" height="14px" />
                      <SkeletonLoader width="95%" height="14px" />
                      <SkeletonLoader width="60%" height="14px" />
                      <SkeletonLoader width="120px" height="36px" />
                    </div>
                  ) : (
                    <iframe
                      srcDoc={emailBody}
                      title="Desktop Email Preview"
                      className="emailPreviewIframe desktopFrame"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="centeredMockupWrapper">
                <PhoneMockup>
                  <div className="emailMobileBodyFrame">
                    {isTemplateLoading ? (
                      <div
                        style={{
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px"
                        }}
                      >
                        <SkeletonLoader width="100%" height="140px" />
                        <SkeletonLoader width="80%" height="12px" />
                        <SkeletonLoader width="95%" height="12px" />
                        <SkeletonLoader width="60%" height="12px" />
                      </div>
                    ) : (
                      <iframe
                        srcDoc={emailBody}
                        title="Mobile Email Preview"
                        className="emailPreviewIframe mobileFrame"
                      />
                    )}
                  </div>
                </PhoneMockup>
              </div>
            )}
          </div>
        )}

        {/* VOICE CHANNEL PREVIEW */}
        {activeChannel === "voice" && (
          <div className="voicePreviewContainer">
            <div className="voiceScriptContent">
              {isTemplateLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  <SkeletonLoader width="90%" height="14px" />
                  <SkeletonLoader width="80%" height="14px" />
                  <SkeletonLoader width="95%" height="14px" />
                  <SkeletonLoader width="70%" height="14px" />
                </div>
              ) : (
                (() => {
                  let cumulativeLength = 0;
                  const highlightIdx = getHighlightCharIndex();
                  return displayVoiceParagraphs.map((para, index) => {
                    const paraLength = para.length;
                    const paraStart = cumulativeLength;
                    const paraEnd = paraStart + paraLength;

                    // Update cumulative length for next paragraph (accounting for join space)
                    cumulativeLength = paraEnd + 1;

                    let readPart = "";
                    let unreadPart = "";

                    if (highlightIdx <= paraStart) {
                      unreadPart = para;
                    } else if (highlightIdx >= paraEnd) {
                      readPart = para;
                    } else {
                      const splitPoint = highlightIdx - paraStart;
                      readPart = para.slice(0, splitPoint);
                      unreadPart = para.slice(splitPoint);
                    }

                    return (
                      <p key={index} className="voiceScriptPara">
                        <span className="readText">{readPart}</span>
                        <span className="unreadText">{unreadPart}</span>
                      </p>
                    );
                  });
                })()
              )}
            </div>

            <div className="voicePlayerSection">
              <h5 className="playerHeading">Audio Preview</h5>
              <div className="voiceAudioPlayer">
                {/* Play/Pause Button */}
                <button className="playPauseBtn" onClick={handlePlayPause}>
                  <img
                    src={isPlaying ? playIcon : pausedIcon}
                    alt={isPlaying ? "Pause" : "Play"}
                  />
                </button>

                {/* Progress bar timeline */}
                <div className="playerTimelineContainer">
                  <input
                    type="range"
                    min="0"
                    max={totalDuration}
                    value={elapsedTime}
                    onChange={handleSliderChange}
                    className="playerSlider"
                    style={{
                      background: `linear-gradient(to right, #198d85 ${
                        (elapsedTime / totalDuration) * 100
                      }%, #e5e7eb ${(elapsedTime / totalDuration) * 100}%)`
                    }}
                  />
                </div>

                {/* Timer details */}
                <div className="playerTimer">
                  {formatTime(elapsedTime)} / {formatTime(totalDuration)}
                </div>

                {/* Speaker Volume Mock Icon */}
                <div className="playerVolumeIcon">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="currentColor"
                  >
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
