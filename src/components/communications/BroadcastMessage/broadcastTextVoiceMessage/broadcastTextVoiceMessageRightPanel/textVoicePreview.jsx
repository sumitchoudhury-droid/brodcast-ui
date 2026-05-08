import { useState, useRef, useEffect } from "react";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton/index";

const TextVoicePreview = ({ isOpen, onClose, content, selectedVoiceCfg }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [isDragging, setIsDragging] = useState(false);
  const [speakingCharIndex, setSpeakingCharIndex] = useState(0);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(null); // internally used for calculations
  const [duration, setDuration] = useState(0); // for UI display
  const offsetRef = useRef(0);
  const trackRef = useRef(null);

  // Helper functions moved to top to avoid declaration order issues
  function pickSystemVoice(cfg) {
    if (!cfg) return null;
    const synth = synthRef.current;
    const systemVoices = synth.getVoices();
    if (!systemVoices.length) return null;
    const isFemale = cfg.type === "Female";
    const langVoices = systemVoices.filter((v) =>
      v.lang.startsWith(cfg.lang.split("-")[0])
    );
    const femaleKeywords = [
      "samantha",
      "karen",
      "moira",
      "tessa",
      "fiona",
      "victoria",
      "allison",
      "ava",
      "susan",
      "zoe",
      "female",
      "woman"
    ];
    const maleKeywords = [
      "alex",
      "daniel",
      "fred",
      "lee",
      "rishi",
      "tom",
      "aaron",
      "jorge",
      "diego",
      "male",
      "man"
    ];
    const keywords = isFemale ? femaleKeywords : maleKeywords;
    const genderMatch = langVoices.find((v) =>
      keywords.some((k) => v.name.toLowerCase().includes(k))
    );
    return (
      genderMatch ||
      langVoices[0] ||
      systemVoices.find((v) => v.lang.startsWith("en")) ||
      systemVoices[0]
    );
  }

  function startProgressTimer(estimatedMs, startPct = 0) {
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
  }

  function handlePlay(startCharIndex = 0) {
    const synth = synthRef.current;

    if (isPaused && utteranceRef.current && startCharIndex === 0) {
      synth.resume();
      setIsPaused(false);
      setIsPlaying(true);
      startProgressTimer(durationRef.current, progress);
      return;
    }

    const fullText =
      content && content.trim()
        ? content.trim().replace(/<[^>]*>?/gm, "")
        : "Hello, this is a preview of your broadcast voice message. Welcome to Manipal Hospitals.";

    const textToSpeak =
      startCharIndex > 0 ? fullText.slice(startCharIndex) : fullText;
    offsetRef.current = startCharIndex;

    synth.cancel();
    clearInterval(intervalRef.current);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const sysVoice = pickSystemVoice(selectedVoiceCfg);
    if (sysVoice) utterance.voice = sysVoice;
    if (selectedVoiceCfg) {
      utterance.lang = selectedVoiceCfg.lang;
      utterance.pitch = selectedVoiceCfg.type === "Female" ? 1.1 : 0.9;
    }
    utterance.rate = 0.95;

    const wordCount = fullText.split(/\s+/).length;
    const estimatedMs = (wordCount / 126) * 60 * 1000;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setSpeakingCharIndex(startCharIndex);
      const initialPct = (startCharIndex / fullText.length) * 100;
      setProgress(initialPct);
      startProgressTimer(estimatedMs, initialPct);
    };

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const absoluteIndex = offsetRef.current + event.charIndex;
        setSpeakingCharIndex(absoluteIndex);
        const pct = (absoluteIndex / fullText.length) * 100;
        setProgress(pct);
        const elapsedSoFar = (pct / 100) * estimatedMs;
        startTimeRef.current = Date.now() - elapsedSoFar;
      }
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
  }

  function stopAll() {
    synthRef.current.cancel();
    clearInterval(intervalRef.current);
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setSpeakingCharIndex(0);
    offsetRef.current = 0;
  }

  function handleSeek(e) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));

    const fullText =
      content && content.trim()
        ? content.trim().replace(/<[^>]*>?/gm, "")
        : "Hello, this is a preview of your broadcast voice message. Welcome to Manipal Hospitals.";

    const newIndex = Math.floor(pct * fullText.length);
    handlePlay(newIndex);
  }

  function handleMouseDown(e) {
    setIsDragging(true);
    handleSeek(e);
  }

  function handleReplay() {
    stopAll();
    setTimeout(() => handlePlay(0), 50);
  }

  function handlePause() {
    synthRef.current.pause();
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setIsPaused(true);
  }

  function handleClose() {
    stopAll();
    onClose();
  }

  // Effects
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

  // Handle state reset separately and deferred to avoid cascading render warning
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setSpeakingCharIndex(0);
        offsetRef.current = 0;
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

      const fullText =
        content && content.trim()
          ? content.trim().replace(/<[^>]*>?/gm, "")
          : "Hello, this is a preview of your broadcast voice message. Welcome to Manipal Hospitals.";

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
  }, [isDragging, content]);

  if (!isOpen) return null;

  const formatTime = (ms) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTimeMs = (progress / 100) * (duration || 0);

  return (
    <div className="textVoicePreviewMainContainer">
      <div className="textVoicePreviewOverlay" onClick={handleClose}>
        <div
          className="textVoicePreviewContainer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="textVoicePreviewHeader">
            <h3>Voice Preview</h3>
            <button className="closeBtn" onClick={handleClose}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="textVoicePreviewContent">
            <div className="messagePreviewCard">
              <div className="cardBody">
                <div
                  className="messageText"
                  dangerouslySetInnerHTML={{
                    __html: highlightHTML(
                      content || "<p>Your message will appear here…</p>",
                      speakingCharIndex
                    )
                  }}
                />

                <div className="audioPreviewSection">
                  <p className="sectionTitle">Audio Preview</p>
                  <div className="audioPlayerPill">
                    <button
                      className="playPauseBtn"
                      onClick={() =>
                        isPlaying ? handlePause() : handlePlay(0)
                      }
                    >
                      {isPlaying ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>

                    <button
                      className="replayBtn"
                      onClick={handleReplay}
                      title="Replay"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M23 4v6h-6"></path>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                    </button>

                    <div
                      className={`progressTrack ${isDragging ? "dragging" : ""}`}
                      ref={trackRef}
                      onMouseDown={handleMouseDown}
                    >
                      <div
                        className="progressFill"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="progressHandle" />
                      </div>
                    </div>

                    <div className="timeDisplay">
                      {formatTime(currentTimeMs)} / {formatTime(duration)}
                    </div>

                    <div className="volumeIcon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="textVoicePreviewFooter">
            <ReusableButton
              label="Close"
              variant="primary"
              onClick={handleClose}
              className="footerCloseBtn"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to highlight read text within HTML structure
const highlightHTML = (html, charIndex) => {
  if (!charIndex || charIndex <= 0) return html;
  const parts = html.split(/(<[^>]+>)/g);
  let count = 0;
  return parts
    .map((part) => {
      if (part.startsWith("<")) return part;

      const remainingToHighlight = Math.max(0, charIndex - count);
      const highlightedPart = part.slice(0, remainingToHighlight);
      const normalPart = part.slice(remainingToHighlight);

      count += part.length;

      if (highlightedPart) {
        return `<span class="read-text">${highlightedPart}</span>${normalPart}`;
      }
      return part;
    })
    .join("");
};

export default TextVoicePreview;
