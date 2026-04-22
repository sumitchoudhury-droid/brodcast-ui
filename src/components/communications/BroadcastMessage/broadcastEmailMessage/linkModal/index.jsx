import { ReusableInput } from "../../../../../reusableComponents/reusableInput/index";
import { ReusableModal } from "../../../../../reusableComponents/reusableModal/index";
import "./style.scss";

export const LinkModal = ({
  isOpen,
  onClose,
  onConfirm,
  formName,
  setFormName,
  linkValue,
  setLinkValue,
  title = "Add Link",
  textLabel = "Form Name",
  confirmText = "Send",
  urlLabel = "Add Link"
}) => {
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
            placeholder="Enter name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
        </div>
        <div
          className="linkModalWrapperLinkInput"
          style={{ marginTop: "16px" }}
        >
          <ReusableInput
            label={urlLabel}
            placeholder="https://example.com"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
          />
        </div>
      </div>
    </ReusableModal>
  );
};
