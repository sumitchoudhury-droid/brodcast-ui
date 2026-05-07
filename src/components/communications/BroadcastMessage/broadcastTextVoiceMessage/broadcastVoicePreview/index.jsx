import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";
import { useState, useRef, useEffect } from "react";
import "./style.scss";

function BroadcastVoicePreview({ isOpen, onClose, content, selectedVoiceCfg }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(null); // estimated ms

  // Helper functions moved to top
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

  function startProgressTimer(estimatedMs) {
    clearInterval(intervalRef.current);
    startTimeRef.current = Date.now();
    durationRef.current = estimatedMs;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / estimatedMs) * 100, 99);
      setProgress(pct);
    }, 200);
  }

  function handlePlay() {
    const synth = synthRef.current;

    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsPlaying(true);
      startProgressTimer(durationRef.current * (1 - progress / 100));
      return;
    }

    synth.cancel();
    clearInterval(intervalRef.current);

    const text =
      content && content.trim()
        ? content.trim()
        : "Hello, this is a preview of your broadcast voice message. Welcome to Manipal Hospitals.";

    const utterance = new SpeechSynthesisUtterance(text);
    const sysVoice = pickSystemVoice(selectedVoiceCfg);
    if (sysVoice) utterance.voice = sysVoice;
    if (selectedVoiceCfg) {
      utterance.lang = selectedVoiceCfg.lang;
      utterance.pitch = selectedVoiceCfg.type === "Female" ? 1.1 : 0.9;
    }
    utterance.rate = 0.95;

    const wordCount = text.split(/\s+/).length;
    const estimatedMs = (wordCount / 126) * 60 * 1000;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setProgress(0);
      startProgressTimer(estimatedMs);
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
  }

  function handlePause() {
    synthRef.current.pause();
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setIsPaused(true);
  }

  function handleStop() {
    stopAll();
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

  // Handle state reset deferred to avoid cascading render warning
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const textIcon = (
    <div className="textIcon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 7V5H20V7M12 5V19M12 19H10M12 19H14"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  const voiceName = selectedVoiceCfg ? selectedVoiceCfg.name : "Default";
  const voiceType = selectedVoiceCfg ? selectedVoiceCfg.type : "";

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Voice Preview"
      cancelText="Close"
      confirmText=""
    >
      <div className="broadcastVoicePreviewContainer">
        {/* Message card */}
        <div className="messagePreviewCard">
          <div className="cardHeader">{textIcon}</div>
          <div className="cardBody">
            <div
              className="messageText"
              dangerouslySetInnerHTML={{
                __html: content || "<p>Your message will appear here…</p>"
              }}
            />
            <p className="optOutText">
              To opt out of future calls from Manipal Hospitals, please press 9.
            </p>
          </div>
        </div>

        {/* Audio preview section */}
        <div className="audioPreviewSection">
          <div className="audioPreviewHeader">
            <p className="sectionTitle">Audio Preview</p>
            <div className="voiceBadge">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              <span>
                {voiceName}
                {voiceType ? ` · ${voiceType}` : ""}
              </span>
            </div>
          </div>

          <div className="audioPlayerWrapper">
            {/* Progress bar */}
            <div className="progressBarTrack">
              <div
                className="progressBarFill"
                style={{
                  width: `${progress}%`,
                  transition: progress === 0 ? "none" : "width 0.2s linear"
                }}
              />
            </div>

            {/* Controls */}
            <div className="playerControls">
              {/* Stop */}
              <button
                className="controlBtn stopBtn"
                onClick={handleStop}
                disabled={!isPlaying && !isPaused}
                title="Stop"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>

              {/* Play / Pause */}
              <button
                className="controlBtn playBtn"
                onClick={isPlaying ? handlePause : handlePlay}
                title={isPlaying ? "Pause" : isPaused ? "Resume" : "Play"}
              >
                {isPlaying ? (
                  // Pause icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  // Play icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              {/* Status label */}
              <span className="playerStatusLabel">
                {isPlaying
                  ? "Playing…"
                  : isPaused
                    ? "Paused"
                    : "Click ▶ to listen"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ReusableModal>
  );
}

export default BroadcastVoicePreview;
