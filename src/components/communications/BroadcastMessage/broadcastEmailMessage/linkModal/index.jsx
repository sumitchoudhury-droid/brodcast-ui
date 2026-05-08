import { useState } from "react";
import { ReusableRadioButton } from "../../../../../reusableComponents/reusableRadioButton/index";
import { ReusableInput } from "../../../../../reusableComponents/reusableInput/index";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";
import "./style.scss";

const PLACEHOLDERS = [
  {
    label: "Accountstatement",
    value: "$AccountStatementURL",
    link: "https://gitlab.com/sketch-brahma/health-asyst/brodcast-ui/-/merge_requests/22"
  },
  {
    label: "Amount",
    value: "$AMOUNT",
    link: "https://www.lifesonmanipal.com/healthcheckup?location=MHB&utm_source=google&utm_medium=ppc&utm_campaignid=20397004528&utm_placement=&utm_network=search&utm_campaign=Health_Checkup_Oldairport_Road&utm_adgroup=Health_Checkup&utm_ad=&utm_term=manipal%20hospital&utm_device=c&gad_source=1&gad_campaignid=20397004528&gbraid=0AAAAAC8_-KwRdRtFWJdK3BBaeRaW26Us7&gclid=Cj0KCQjwk_bPBhDXARIsACiq8R3YAheX1KDbAnsuYBWkZCo3VD1RvoWem4ePzBxlsaSEuIQ7Pd4efCcaAv-OEALw_wcB"
  },
  {
    label: "Appointment Date",
    value: "$APPDATE",
    link: "https://www.lifesonmanipal.com/healthcheckup/mg8HT4-child-care-plus?location=MHB&utm_source=google&utm_medium=ppc&utm_campaignid=20397004528&utm_placement=&utm_network=search&utm_campaign=Health_Checkup_Oldairport_Road&utm_adgroup=Health_Checkup&utm_ad=&utm_term=manipal%20hospital&utm_device=c&gad_source=1&gad_campaignid=20397004528&gbraid=0AAAAAC8_-KwRdRtFWJdK3BBaeRaW26Us7&gclid=Cj0KCQjwk_bPBhDXARIsACiq8R1jkUj_RhTVzxW0EdaDK3zQ5Q9zF0aLQ8B3GC82rpgqAhypivl3d_8aAk2gEALw_wcB"
  },
  {
    label: "Appointment time (12 hour Format)",
    value: "$APPTIME12",
    link: "https://example.com/time12"
  },
  {
    label: "Appointment time (24 hour Format)",
    value: "$APPTIME",
    link: "https://example.com/time24"
  },
  {
    label: "Patient First Name",
    value: "$FNAME",
    link: "https://example.com/fname"
  },
  {
    label: "Patient Last Name",
    value: "$LNAME",
    link: "https://example.com/lname"
  },
  { label: "Google", value: "$GOOGLE", link: "https://www.google.com" },
  { label: "Facebook", value: "$FACEBOOK", link: "https://www.facebook.com" },
  { label: "Twitter", value: "$TWITTER", link: "https://www.twitter.com" },
  {
    label: "Instagram",
    value: "$INSTAGRAM",
    link: "https://www.instagram.com"
  },
  { label: "LinkedIn", value: "$LINKEDIN", link: "https://www.linkedin.com" }
];

export const LinkModal = ({
  isOpen,
  onClose,
  onConfirm,
  formName,
  setFormName,
  linkValue,
  setLinkValue,
  title = "Add Link",
  textLabel = "Link Text",
  confirmText = "Save"
}) => {
  const [linkType, setLinkType] = useState("url"); // 'url' or 'placeholder'
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Adjust state when modal opens (render-phase state adjustment)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && !linkValue) {
      setLinkType("url");
      setSearchTerm("");
    }
  }

  const filteredPlaceholders = PLACEHOLDERS.filter(
    (p) =>
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlaceholderSelect = (p) => {
    setLinkValue(p.link || p.value);
    setSearchTerm(p.value);
    setShowDropdown(false);
  };

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      confirmText={confirmText}
      cancelText="Cancel"
    >
      <div className="linkModalWrapper">
        <div className="linkModalWrapperTextInput">
          <ReusableInput
            label={textLabel}
            placeholder="Link here"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
        </div>

        <div className="linkModalWrapperRadioButtons">
          <ReusableRadioButton
            label="URL"
            value="url"
            name="linkType"
            checked={linkType === "url"}
            onChange={() => setLinkType("url")}
          />
          <ReusableRadioButton
            label="Placeholder"
            value="placeholder"
            name="linkType"
            checked={linkType === "placeholder"}
            onChange={() => setLinkType("placeholder")}
          />
        </div>

        <div
          className="linkModalWrapperLinkInput"
          style={{ marginTop: "16px" }}
        >
          {linkType === "url" ? (
            <ReusableInput
              label="URL"
              placeholder="https://example.com"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              required
            />
          ) : (
            <div className="placeholderInputContainer">
              <ReusableInput
                label="Placeholders"
                placeholder="Search Placeholders"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                required
              />
              {showDropdown && filteredPlaceholders.length > 0 && (
                <div className="placeholderDropdown">
                  {filteredPlaceholders.map((p, idx) => (
                    <div
                      key={idx}
                      className="placeholderItem"
                      onClick={() => handlePlaceholderSelect(p)}
                    >
                      <div className="placeholderItemContent">
                        <span className="pValue">{p.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ReusableModal>
  );
};
