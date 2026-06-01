import { useState, useEffect, useRef } from "react";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";

import pausedIcon from "../../../../../assets/voiceTextIcons/pausedIcon.svg";
import playIcon from "../../../../../assets/voiceTextIcons/playIcon.svg";
import componentIcon from "../../../../../assets/voiceTextIcons/Component.svg";
import waveformIcon from "../../../../../assets/voiceTextIcons/waveformIcon.svg";

import "./style.scss";
import TextVoicePreview from "./textVoicePreview";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton/index";

function BroadcastTextVoiceMessageRightPanel({ isEditorEmpty, editorContent }) {
  const allowOnlyNumbers = (e) => {
    if (e.ctrlKey || e.metaKey) return;
    const allowed = new Set([
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End"
    ]);
    if (!allowed.has(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
  };

  const [showSendTestCall, setShowSendTestCall] = useState(false);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [playingVoice, setPlayingVoice] = useState(null); // which voice is currently playing

  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const [availableVoices, setAvailableVoices] = useState([]);
  const [voices, setVoices] = useState([
    {
      id: "gabriella",
      name: "Gabriella",
      type: "Female",
      lang: "en-US",
      desc: ""
    },
    { id: "dominic", name: "Dominic", type: "Male", lang: "en-GB", desc: "" },
    {
      id: "victoria",
      name: "Victoria",
      type: "Female",
      lang: "en-GB",
      desc: ""
    },
    {
      id: "christopher",
      name: "Christopher",
      type: "Male",
      lang: "en-US",
      desc: ""
    },
    {
      id: "alexander",
      name: "Alexander",
      type: "Male",
      lang: "en-US",
      desc: ""
    }
  ]);

  // Improved helper: pick the best matching system voice
  const pickSystemVoice = (voiceCfg, systemVoices) => {
    if (!systemVoices || !systemVoices.length) return null;

    const isFemale = voiceCfg.type === "Female";
    const preferredLang = voiceCfg.lang;
    const personaName = voiceCfg.name.toLowerCase();

    // 1. Try to find a voice that matches the persona name exactly (e.g., "Samantha")
    const exactNameMatch = systemVoices.find((v) =>
      v.name.toLowerCase().includes(personaName)
    );
    if (exactNameMatch) return exactNameMatch;

    // 2. Try to find "Natural", "Google", "Enhanced", "Siri", or "Alex" for the specific language
    const highQualityMatch = systemVoices.find((v) => {
      const name = v.name.toLowerCase();
      const isCorrectLang = v.lang.includes(preferredLang.split("-")[0]);
      const isNatural =
        name.includes("natural") ||
        name.includes("google") ||
        name.includes("enhanced") ||
        name.includes("premium") ||
        name.includes("siri") ||
        name.includes("alex") ||
        name.includes("rishi"); // Rishi is high quality for Indian English
      const genderKeywords = isFemale
        ? [
            "female",
            "woman",
            "samantha",
            "victoria",
            "moira",
            "tessa",
            "karen",
            "siri"
          ]
        : ["male", "man", "alex", "daniel", "fred", "rishi", "siri"];
      const isCorrectGender = genderKeywords.some((k) => name.includes(k));

      return isCorrectLang && isNatural && isCorrectGender;
    });

    if (highQualityMatch) return highQualityMatch;

    // 3. Try any voice for the specific language + gender
    const langGenderMatch = systemVoices.find((v) => {
      const name = v.name.toLowerCase();
      const isCorrectLang = v.lang.includes(preferredLang.split("-")[0]);
      const genderKeywords = isFemale
        ? ["female", "woman", "samantha", "victoria", "moira", "tessa", "karen"]
        : ["male", "man", "alex", "daniel", "fred", "rishi"];
      const isCorrectGender = genderKeywords.some((k) => name.includes(k));
      return isCorrectLang && isCorrectGender;
    });

    if (langGenderMatch) return langGenderMatch;

    // 4. Fallback to any voice for that language
    const langMatch = systemVoices.find((v) =>
      v.lang.includes(preferredLang.split("-")[0])
    );
    if (langMatch) return langMatch;

    // 5. Global fallback
    return systemVoices[0];
  };

  useEffect(() => {
    const synth = synthRef.current;
    const updateVoices = () => {
      const sysVoices = synth.getVoices();
      setAvailableVoices(sysVoices);

      // Update our personas with specific system voices to ensure differentiation
      setVoices((prev) => {
        const assignedNames = new Set();
        return prev.map((p) => {
          const isFemale = p.type === "Female";
          const preferredLang = p.lang.split("-")[0];

          // 1. Try exact name match
          let match = sysVoices.find(
            (v) =>
              v.name.toLowerCase().includes(p.name.toLowerCase()) &&
              !assignedNames.has(v.name)
          );

          // 2. Try lang + gender + high quality + unassigned
          if (!match) {
            match = sysVoices.find((v) => {
              const name = v.name.toLowerCase();
              const isCorrectLang = v.lang.includes(preferredLang);
              const isHighQuality =
                name.includes("natural") ||
                name.includes("google") ||
                name.includes("enhanced") ||
                name.includes("premium");
              const genderKeywords = isFemale
                ? [
                    "female",
                    "woman",
                    "samantha",
                    "victoria",
                    "moira",
                    "tessa",
                    "karen",
                    "siri",
                    "zira"
                  ]
                : ["male", "man", "alex", "daniel", "fred", "rishi", "siri"];
              const isCorrectGender = genderKeywords.some((k) =>
                name.includes(k)
              );
              return (
                isCorrectLang &&
                isCorrectGender &&
                isHighQuality &&
                !assignedNames.has(v.name)
              );
            });
          }

          // 3. Try lang + gender + unassigned
          if (!match) {
            match = sysVoices.find((v) => {
              const name = v.name.toLowerCase();
              const isCorrectLang = v.lang.includes(preferredLang);
              const genderKeywords = isFemale
                ? [
                    "female",
                    "woman",
                    "samantha",
                    "victoria",
                    "moira",
                    "tessa",
                    "karen",
                    "zira"
                  ]
                : ["male", "man", "alex", "daniel", "fred", "rishi"];
              const isCorrectGender = genderKeywords.some((k) =>
                name.includes(k)
              );
              return (
                isCorrectLang && isCorrectGender && !assignedNames.has(v.name)
              );
            });
          }

          // 4. Final fallback using pickSystemVoice but try to keep it unique if possible
          if (!match) {
            match = pickSystemVoice(p, sysVoices);
          }

          if (match) assignedNames.add(match.name);

          const isReal =
            match &&
            (match.name.toLowerCase().includes("natural") ||
              match.name.toLowerCase().includes("google") ||
              match.name.toLowerCase().includes("enhanced") ||
              match.name.toLowerCase().includes("premium"));
          return { ...p, isNatural: isReal, systemVoiceName: match?.name };
        });
      });
    };

    if (synth) {
      updateVoices();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = updateVoices;
      }
    }
    return () => {
      if (synth) {
        synth.cancel();
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

    const sampleText = `Hello, this is ${voiceCfg.name}. I am a voice for your broadcast. How do I sound?`;

    const utterance = new SpeechSynthesisUtterance(sampleText);

    // Attach the best matching system voice
    let systemVoice = null;
    if (voiceCfg.systemVoiceName) {
      systemVoice = availableVoices.find(
        (v) => v.name === voiceCfg.systemVoiceName
      );
    }

    if (!systemVoice) {
      systemVoice = pickSystemVoice(voiceCfg, availableVoices);
    }

    if (systemVoice) {
      utterance.voice = systemVoice;
      utterance.lang = systemVoice.lang;
    } else {
      utterance.lang = voiceCfg.lang;
    }

    utterance.rate = 0.95;
    utterance.pitch = voiceCfg.type === "Female" ? 1.05 : 0.95;

    utterance.onstart = () => setPlayingVoice(voiceId);
    utterance.onend = () => setPlayingVoice(null);
    utterance.onerror = () => setPlayingVoice(null);

    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  return (
    <div className="broadcastTextVoiceMessageRightPanel">
      <div className="panelSections">
        <div className="panelSection">
          <div className="previewHeader">
            <ReusableButton
              label="Preview"
              onClick={handleOpenPreview}
              disabled={!selectedVoice}
              eyeImage={true}
              variant="secondary"
              className="previewBtn"
            />
          </div>

          <div className="voiceList">
            <p className="Voice">Voices</p>
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
                  <div className="voiceLeft">
                    <span className="voiceIcon">
                      <img
                        src={isThisPlaying ? playIcon : pausedIcon}
                        alt="play/pause icon"
                      />
                    </span>
                    <span className="voiceName">{voice.name}</span>
                  </div>
                  <div className="voiceRight">
                    {isThisPlaying && (
                      <span className="waveform">
                        <img src={waveformIcon} alt="waveform" />
                      </span>
                    )}
                    {selectedVoice === voice.id && (
                      <span className="checkmark">
                        <img src={componentIcon} alt="selected" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="actionFooter">
        <ReusableButton
          label="Send Test Voice Call"
          onClick={() => setShowSendTestCall(true)}
          disabled={isEditorEmpty || !selectedVoice}
          sendImage={true}
          variant="primary"
          className="sendTestBtn"
        />
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
              type="text"
              placeholder="Enter Phone Number"
              className="phoneNumberInput"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={allowOnlyNumbers}
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
