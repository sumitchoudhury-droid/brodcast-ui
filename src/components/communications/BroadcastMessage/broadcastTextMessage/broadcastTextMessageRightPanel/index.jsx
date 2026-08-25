import { useState } from "react";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";
import { useToast } from "../../../../../hooks/useToast";
import { usePost } from "../../../../../hooks/usePost";
import { ENDPOINTS } from "../../../../../api/endpoints.js";
import { useBroadcastForm } from "../../../broadcastFormContext";
import { prepareHtmlForEmail } from "../../../../../utils/prepareHtmlForEmail";
import { htmlToSmsText } from "../../../../../utils/htmlToSmsText";
// import { TextFontStyleContainer } from "./textFontstyleContainer/index";
import { TextDeviceSwitcher } from "./textDeviceSwitch/index";
import TextSignatureSection from "./textSignatureSection/index";
import TextPreviewModal from "./textPreviewModal/index";

import "./style.scss";

export default function BroadcastTextMessageRightPanel({
  isEditorEmpty,
  editorInstance
}) {
  const toast = useToast();
  const {
    selectedEmailTemplateType,
    newTemplateName,
    mailSubject,
    selectedTemplateData,
    selectedModes,
    emailEditorRef,
    isEmailEditorEmpty,
    isSmsEditorEmpty
  } = useBroadcastForm();
  const { mutateAsync: saveTemplate, isPending: isSavingTemplate } = usePost(
    ENDPOINTS.templates.CREATE
  );
  const { mutateAsync: sendTestSms, isPending: isSendingTest } = usePost(
    ENDPOINTS.broadcastSchedule.SEND_TEST_SMS
  );

  const lowerModes = selectedModes.map((m) => m.toLowerCase());
  const requiresMail = lowerModes.includes("mail");
  const requiresSms = lowerModes.includes("sms");
  const hasEmptyBroadcastEditor =
    (requiresMail && isEmailEditorEmpty) || (requiresSms && isSmsEditorEmpty);

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

  const [showSendTextMessage, setShowSendTextMessage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  // const [textColor, setTextColor] = useState("#000000");
  // const [typography, setTypography] = useState({
  //   fontFamily: "Arial",
  //   fontWeight: "400",
  //   fontSize: "14",
  //   textAlign: "left"
  // });
  // const [activeFormats, setActiveFormats] = useState({});

  // const handleTypographyChange = (name, value) => {
  //   setTypography((prev) => ({ ...prev, [name]: value }));

  //   if (editorInstance) {
  //     if (name === "textAlign") {
  //       const cmdMap = {
  //         left: "justifyLeft",
  //         center: "justifyCenter",
  //         right: "justifyRight",
  //         justify: "justifyFull"
  //       };
  //       editorInstance.execCommand(cmdMap[value]);
  //     } else if (name === "fontSize") {
  //       editorInstance.execCommand("fontSize", value);
  //     } else if (name === "fontFamily") {
  //       editorInstance.execCommand("fontName", value);
  //     } else if (name === "fontWeight") {
  //       editorInstance.execCommand("fontWeight", value);
  //     }
  //   }
  // };

  // const handleTextColorChange = (color) => {
  //   setTextColor(color);
  //   if (editorInstance) {
  //     editorInstance.execCommand("foreColor", color);
  //   }
  // };

  // const handleFormatToggle = (format) => {
  //   setActiveFormats((prev) => ({ ...prev, [format]: !prev[format] }));

  //   if (editorInstance) {
  //     const cmdMap = {
  //       bold: "bold",
  //       italic: "italic",
  //       underline: "underline",
  //       strikethrough: "strikethrough",
  //       unorderedList: "insertUnorderedList",
  //       orderedList: "insertOrderedList",
  //       superscript: "superscript",
  //       subscript: "subscript",
  //       uppercase: "uppercase" // Note: uppercase might need a custom command or just style application
  //     };
  //     if (cmdMap[format]) {
  //       editorInstance.execCommand(cmdMap[format]);
  //     }
  //   }
  // };

  const handleSendTestMessage = async () => {
    if (!phoneNumber) {
      toast.error(
        "Invalid Phone Number",
        "Please enter a valid phone number to send the test message."
      );
      return;
    }
    try {
      let templateId = null;

      if (selectedEmailTemplateType === "blank") {
        const rawMailBody = requiresMail
          ? emailEditorRef.current?.getCompiledHtml?.() ||
            emailEditorRef.current?.getHtml?.() ||
            ""
          : "";
        const mailBody = rawMailBody ? prepareHtmlForEmail(rawMailBody) : "";
        const mailAttachments = requiresMail
          ? emailEditorRef.current?.getAttachments?.() || []
          : [];
        const smsBody = requiresSms
          ? htmlToSmsText(editorInstance?.getHtml?.() || "")
          : "";

        const channels = [];
        if (requiresMail) {
          channels.push({
            methodType: "Mail",
            templateBody: mailBody,
            subjectLine: mailSubject || null,
            smsStandardText: null,
            attachments: mailAttachments
          });
        }
        if (requiresSms) {
          channels.push({
            methodType: "SMS",
            templateBody: smsBody,
            subjectLine: null,
            smsStandardText: smsBody,
            attachments: []
          });
        }

        const templateBody = {
          name: newTemplateName || "Untitled Template",
          templateBody: mailBody || smsBody,
          subjectLine: mailSubject || null,
          smsStandardText: smsBody || null,
          messageTempLibId: null,
          actionItemTypeId: 0,
          actionItemTypeName: "Broadcast Message Notification",
          createdBy: "admin@example.com",
          channels
        };

        const res = await saveTemplate(templateBody);
        templateId =
          res?.data?.channels?.[0]?.legacyMessageTempLibId ??
          res?.data?.id ??
          res?.data?.messageTemplateLibId;
        if (!templateId) {
          toast.error(
            "Failed to Save Template",
            "Could not retrieve template ID from the create-template response."
          );
          return;
        }
      } else {
        templateId =
          selectedTemplateData?.channels?.[0]?.legacyMessageTempLibId ??
          selectedTemplateData?.id ??
          null;
        if (!templateId) {
          toast.error(
            "Missing Template",
            "No template is selected to send the test message."
          );
          return;
        }
      }

      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+1${phoneNumber}`;

      const res = await sendTestSms({
        phoneNumber: formattedPhone,
        templateId,
        createdById: 9
      });

      toast.success(
        res?.message ||
          res?.data?.message ||
          `A test message has been sent to ${formattedPhone} successfully!`
      );

      setShowSendTextMessage(false);
      setPhoneNumber("");
    } catch (err) {
      console.error("Error sending test message:", err);
      toast.error(
        "Failed to Send Message",
        err?.message ||
          "An error occurred while sending the test message. Please try again."
      );
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <div className="rightPanel">
      <TextDeviceSwitcher
        isEditorEmpty={isEditorEmpty}
        editorRef={{ current: editorInstance }}
        handlePreview={handlePreview}
      />

      <div className="panelSections">
        <TextSignatureSection
          editorInstance={editorInstance}
          isEditorEmpty={isEditorEmpty}
        />

        {/* <TextFontStyleContainer
          typography={typography}
          handleTypographyChange={handleTypographyChange}
          textColor={textColor}
          handleTextColorChange={handleTextColorChange}
          activeFormats={activeFormats}
          onFormatToggle={handleFormatToggle}
        /> */}
      </div>

      <div className="actionFooter">
        <button
          className="sendTestBtn"
          onClick={() => setShowSendTextMessage(true)}
          disabled={hasEmptyBroadcastEditor}
          style={{
            cursor: hasEmptyBroadcastEditor ? "not-allowed" : "pointer",
            opacity: hasEmptyBroadcastEditor ? 0.5 : 1
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
        confirmText={isSavingTemplate || isSendingTest ? "Sending…" : "Send"}
        cancelText="Cancel"
        confirmBtnVariant="primary"
        cancelBtnVariant="secondary"
        confirmBtnDisabled={
          hasEmptyBroadcastEditor ||
          !phoneNumber ||
          isSavingTemplate ||
          isSendingTest
        }
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
          <div className="phoneNumberInputWrapper">
            <input
              type="text"
              placeholder="Enter Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={allowOnlyNumbers}
            />
          </div>
        </div>
      </ReusableModal>
      <TextPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        html={editorInstance?.getHtml()}
      />
    </div>
  );
}
