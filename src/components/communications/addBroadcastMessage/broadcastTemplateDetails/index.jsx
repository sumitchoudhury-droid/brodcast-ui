import { useState } from "react";
import blackTemplateIcon from "../../../../assets/commonIcons/blackTemplate.svg";
import existingTemplateIcon from "../../../../assets/commonIcons/existingTemplate.svg";
import ExistingTemplates from "../../existingTemplates/index";
import "./style.scss";

function BroadcastTemplateDetails() {
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="broadcastTemplateDetails">
      <div className="broadcastTemplateDetailsTitle">
        <p>Broadcast Template Details</p>
      </div>
      <div className="broadcastTemplateDetailsContent">
        <div className="templateTypeLabel">
          <p>Template Type</p>
        </div>
        <div className="templateOptions">
          <div
            className={`templateOption ${selectedTemplate === "blank" ? "active" : ""}`}
            onClick={() => setSelectedTemplate("blank")}
          >
            <div className="templateOptionIcon">
              <img
                src={blackTemplateIcon}
                alt="blackTemplateIcon"
                className="blackTemplateIcon"
              />
            </div>
            <p>Blank Template</p>
          </div>
          <div
            className={`templateOption ${selectedTemplate === "existing" ? "active" : ""}`}
            onClick={() => {
              setSelectedTemplate("existing");
              setIsDrawerOpen(true);
            }}
          >
            <div className="templateOptionIcon">
              <img
                src={existingTemplateIcon}
                alt="existingTemplateIcon"
                className="existingTemplateIcon"
              />
            </div>
            <p>Existing Template</p>
          </div>
        </div>
      </div>

      <ExistingTemplates
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

export default BroadcastTemplateDetails;
