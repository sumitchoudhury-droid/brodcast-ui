import { useState, useEffect, useRef } from "react";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";

import "./style.scss";
import TextVoicePreview from "./textVoicePreview";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton/index";

function BroadcastTextVoiceMessageRightPanel({ isEditorEmpty, editorContent }) {
  const [showSendTestCall, setShowSendTestCall] = useState(false);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("gabriella");
  const [playingVoice, setPlayingVoice] = useState(null); // which voice is currently playing

  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const voices = [
    { id: "gabriella", name: "Gabriella", type: "Female", lang: "en-US" },
    { id: "dominic", name: "Dominic", type: "Male", lang: "en-GB" },
    { id: "victoria", name: "Victoria", type: "Female", lang: "en-AU" },
    { id: "christopher", name: "Christopher", type: "Male", lang: "en-US" }
  ];

  // Helper: pick the best matching system voice for our custom voice config
  const pickSystemVoice = (voiceCfg) => {
    const systemVoices = synthRef.current.getVoices();
    if (!systemVoices.length) return null;

    // Try exact lang + gender keyword match first
    const isFemale = voiceCfg.type === "Female";
    const langVoices = systemVoices.filter((v) =>
      v.lang.startsWith(voiceCfg.lang.split("-")[0])
    );

    const genderMatch = langVoices.find((v) => {
      const n = v.name.toLowerCase();
      return isFemale
        ? n.includes("female") ||
            n.includes("woman") ||
            [
              "samantha",
              "karen",
              "moira",
              "tessa",
              "fiona",
              "victoria",
              "allison",
              "ava",
              "susan",
              "zoe"
            ].some((k) => n.includes(k))
        : n.includes("male") ||
            n.includes("man") ||
            [
              "alex",
              "daniel",
              "fred",
              "lee",
              "rishi",
              "tom",
              "aaron",
              "jorge",
              "diego"
            ].some((k) => n.includes(k));
    });

    // Fallback: any voice with matching lang, then any English voice
    return (
      genderMatch ||
      langVoices[0] ||
      systemVoices.find((v) => v.lang.startsWith("en")) ||
      systemVoices[0]
    );
  };

  useEffect(() => {
    const synth = synthRef.current;
    const handleVoicesChanged = () => synth.getVoices();
    if (synth) {
      synth.addEventListener("voiceschanged", handleVoicesChanged);
    }
    return () => {
      if (synth) {
        synth.cancel();
        synth.removeEventListener("voiceschanged", handleVoicesChanged);
      }
    };
  }, []);

  const stopSpeech = () => {
    synthRef.current.cancel();
    utteranceRef.current = null;
    setPlayingVoice(null);
  };

  const handleSendTestCall = () => {
    console.log(
      `Sending test voice call to ${phoneNumber} using voice: ${selectedVoice}`
    );
    setShowSendTestCall(false);
  };

  const handleOpenPreview = () => {
    setShowVoicePreview(true);
  };

  // Play a sample phrase using the selected voice config
  const handlePreview = (voiceId) => {
    const synth = synthRef.current;

    // Toggle off if the same voice is already playing
    if (playingVoice === voiceId) {
      stopSpeech();
      return;
    }

    // Cancel any ongoing speech first
    synth.cancel();

    const voiceCfg = voices.find((v) => v.id === voiceId);
    if (!voiceCfg) return;

    const sampleText =
      editorContent && editorContent.trim()
        ? editorContent.trim().slice(0, 200)
        : `Hello, this is ${voiceCfg.name}. Welcome to Manipal Hospitals.`;

    const utterance = new SpeechSynthesisUtterance(sampleText);

    // Attach the best matching system voice
    const systemVoice = pickSystemVoice(voiceCfg);
    if (systemVoice) utterance.voice = systemVoice;
    utterance.lang = voiceCfg.lang;
    utterance.rate = 0.95;
    utterance.pitch = voiceCfg.type === "Female" ? 1.1 : 0.9;

    utterance.onstart = () => setPlayingVoice(voiceId);
    utterance.onend = () => setPlayingVoice(null);
    utterance.onerror = () => setPlayingVoice(null);

    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const waveformIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 10V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 7V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 11V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 4V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 10V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 12V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const checkmarkIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <rect width="16" height="16" rx="8" fill="#10B981" />
      <path
        d="M11.3334 5.3335L6.66675 10.0002L4.66675 8.00016"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const playSmallIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  );

  const pauseSmallIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
  );

  return (
    <div className="broadcastTextVoiceMessageRightPanel">
      <div className="panelSections">
        <div className="panelSection">
          <div className="previewHeader">
            <ReusableButton
              label="Preview"
              variant="primary"
              onClick={() => handleOpenPreview()}
              eyeImage={true}
            />
          </div>
          <div className="panelHeader">
            <p className="sectionLabel">Text</p>
          </div>

          <div className="voiceList">
            {voices.map((voice) => {
              const isThisPlaying = playingVoice === voice.id;
              return (
                <div
                  key={voice.id}
                  className={`voiceItem ${selectedVoice === voice.id ? "selected" : ""} ${isThisPlaying ? "playing" : ""}`}
                  onClick={() => {
                    setSelectedVoice(voice.id);
                    handlePreview(voice.id);
                  }}
                >
                  <div className="voiceInfo">
                    <span className="voiceIcon">
                      {isThisPlaying ? pauseSmallIcon : playSmallIcon}
                    </span>
                    <span className="voiceName">{voice.name}</span>
                  </div>
                  <div className="voiceStatus">
                    {isThisPlaying && (
                      <span className="waveform">{waveformIcon}</span>
                    )}
                    {selectedVoice === voice.id && !isThisPlaying && (
                      <span className="checkmark">{checkmarkIcon}</span>
                    )}
                    {selectedVoice !== voice.id && !isThisPlaying && (
                      <span className="radioCircle"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="actionFooter">
        <button
          className="sendTestBtn"
          onClick={() => setShowSendTestCall(true)}
          disabled={isEditorEmpty}
          style={{
            cursor: isEditorEmpty ? "not-allowed" : "pointer",
            opacity: isEditorEmpty ? 0.5 : 1
          }}
        >
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
          <p>Send Test Voice Call</p>
        </button>
      </div>

      <ReusableModal
        isOpen={showSendTestCall}
        onClose={() => setShowSendTestCall(false)}
        title="Send Test Voice Call"
        confirmText="Send Call"
        cancelText="Cancel"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        confirmBtnDisabled={isEditorEmpty || !phoneNumber}
        onConfirm={handleSendTestCall}
        onCancel={() => setShowSendTestCall(false)}
      >
        <div className="sendTextMessageContainer">
          <div className="phoneNumberInputContainer">
            <label htmlFor="phoneNumber" className="phoneNumberLabel">
              Phone Number
            </label>
            <p className="required">*</p>
          </div>
          <div className="phoneNumberInputWrapper">
            <input
              id="phoneNumber"
              type="number"
              placeholder="Enter Phone Number"
              className="phoneNumberInput"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>
      </ReusableModal>

      <TextVoicePreview
        isOpen={showVoicePreview}
        onClose={() => setShowVoicePreview(false)}
        content={editorContent}
        selectedVoiceCfg={voices.find((v) => v.id === selectedVoice)}
      />
    </div>
  );
}

export default BroadcastTextVoiceMessageRightPanel;
