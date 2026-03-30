import { ReusableButton } from "../../../../resuableButton";
import "./style.scss";

// components/Footer.jsx
export default function Footer() {
  return (
    <div className="footer">
      <div className="buttonBlock">
        <ReusableButton
          label="Back"
          variant="primary"
          onClick={() => console.log("Saved")}
        />
        <ReusableButton
          label="Save as Template"
          variant="primary"
          onClick={() => console.log("Saved")}
        />
      </div>
      <div className="buttonBlock">
        <ReusableButton
          label="Cancel"
          variant="primary"
          onClick={() => console.log("Saved")}
        />
        <ReusableButton
          label="Send"
          variant="secondary"
          onClick={() => console.log("Saved")}
        />
      </div>
    </div>
  );
}
