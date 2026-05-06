import { useState } from "react";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";
import { TextFontStyleContainer } from "./textFontstyleContainer/index";
import { TextDeviceSwitcher } from "./textDeviceSwitch/index";
import TextSignatureSection from "./textSignatureSection/index";

import "./style.scss";

export default function BroadcastTextMessageRightPanel({ isEditorEmpty }) {
  const [showSendTextMessage, setShowSendTextMessage] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [typography, setTypography] = useState({
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: "14",
    textAlign: "left"
  });
  const [activeFormats, setActiveFormats] = useState({});

  const handleTypographyChange = (name, value) => {
    setTypography((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextColorChange = (color) => {
    setTextColor(color);
  };

  const handleFormatToggle = (format) => {
    setActiveFormats((prev) => ({ ...prev, [format]: !prev[format] }));
  };

  const handleSendTestMessage = () => {
    console.log("Sending text message to:", phoneNumber);
    setShowSendTextMessage(false);
  };

  return (
    <div className="rightPanel">
      <TextDeviceSwitcher />

      <div className="panelSections">
        <TextSignatureSection />

        <TextFontStyleContainer
          typography={typography}
          handleTypographyChange={handleTypographyChange}
          textColor={textColor}
          handleTextColorChange={handleTextColorChange}
          activeFormats={activeFormats}
          onFormatToggle={handleFormatToggle}
        />
      </div>

      <div className="actionFooter">
        <button
          className="sendTestBtn"
          onClick={() => setShowSendTextMessage(true)}
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
          <p>Send Text Message</p>
        </button>
      </div>
      <ReusableModal
        isOpen={showSendTextMessage}
        onClose={() => setShowSendTextMessage(false)}
        title="Send Text Message"
        confirmText="Send"
        cancelText="Cancel"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        confirmBtnDisabled={isEditorEmpty || !phoneNumber}
        onConfirm={handleSendTestMessage}
        onCancel={() => setShowSendTextMessage(false)}
      >
        <div className="sendTextMessageContainer">
          <div className="phoneNumberInputContainer">
            <label htmlFor="email" className="emailLabel">
              Phone Number
            </label>
            <p className="required">*</p>
          </div>
          <div className="emailInputWrapper">
            <input
              type="number"
              placeholder="Enter Phone Number"
              className=" "
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>
      </ReusableModal>
    </div>
  );
}
