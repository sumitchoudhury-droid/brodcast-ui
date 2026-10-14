import { useState } from "react";

import "./style.scss";
import { ReusableRadioButton } from "../reusableRadioButton";
import { ReusableInput } from "../reusableInput";
import { ReusableModal } from "../reusableModal";
import { ReusableDropDown } from "../reusableDropDown";

const PLACEHOLDER_OPTIONS = [
  { label: "$AccountStatementURL", value: "$AccountStatementURL" },
  { label: "$BalanceCollectionURL", value: "$BalanceCollectionURL" },
  { label: "$LocationNavigationLink", value: "$LocationNavigationLink" },
  { label: "$OrgURL", value: "$OrgURL" },
  { label: "$LocationWebsiteLink", value: "$LocationWebsiteLink" }
];

export function ReusableLinkModal({
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
}) {
  const [linkType, setLinkType] = useState("url"); // 'url' or 'placeholder'

  // Adjust state when modal opens (render-phase state adjustment)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && !linkValue) {
      setLinkType("url");
    }
  }

  const selectedPlaceholder = PLACEHOLDER_OPTIONS.some(
    (o) => o.value === linkValue
  )
    ? linkValue
    : "";

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
            <ReusableDropDown
              label="Placeholders"
              placeholder="Select Placeholder"
              options={PLACEHOLDER_OPTIONS}
              value={selectedPlaceholder}
              onChange={(val) => setLinkValue(val)}
              required
            />
          )}
        </div>
      </div>
    </ReusableModal>
  );
}

export default ReusableLinkModal;
