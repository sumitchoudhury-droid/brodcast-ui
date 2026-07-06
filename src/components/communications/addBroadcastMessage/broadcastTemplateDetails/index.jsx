import { useState } from "react";
import blackTemplateIcon from "../../../../assets/commonIcons/blackTemplate.svg";
import existingTemplateIcon from "../../../../assets/commonIcons/existingTemplate.svg";
import crossIcon from "../../../../assets/commonIcons/redCrossIcon.svg";
import ExistingTemplates from "../../existingTemplates/index";
import "./style.scss";

import messageIcon from "../../../../assets/existingTemplate/messageIcon.svg";
import mailIcon from "../../../../assets/existingTemplate/mailIcon.svg";
import phoneIcon from "../../../../assets/existingTemplate/phoneIcon.svg";
import defaultTemplateSs from "../../../../assets/existingTemplate/defaultTemplateSs.svg";

import { ReusableInput } from "../../../../reusableComponents/reusableInput";

const actionIcons = [
  { src: messageIcon, mode: "Text" },
  { src: mailIcon, mode: "Mail" },
  { src: phoneIcon, mode: "Voice" }
];

function BroadcastTemplateDetails({
  newTemplateName,
  setNewTemplateName,
  selectedTemplate,
  setSelectedTemplate,
  onSelectTemplate,
  selectedTemplateData
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [initialModeTab, setInitialModeTab] = useState("Text");

  return (
    <div className="broadcastTemplateDetails">
      <div className="broadcastTemplateDetailsTitle">
        <p>Broadcast Template Details</p>
      </div>
      <div className="broadcastTemplateDetailsContent">
        <div className="templateTypeLabel">
          <p>Template Type</p>
        </div>
        <div className="row">
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
              {selectedTemplate === "existing" && selectedTemplateData && (
                <div
                  className="closeIcon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTemplate) {
                      onSelectTemplate(null);
                    }
                    setSelectedTemplate("blank");
                  }}
                >
                  <img
                    src={crossIcon}
                    alt="crossIcon"
                    className="redCrossIcon"
                  />
                </div>
              )}
              {selectedTemplate === "existing" && selectedTemplateData ? (
                <img
                  src={selectedTemplateData?.image || defaultTemplateSs}
                  alt="savedTemplate"
                  className="savedTemplateSs"
                />
              ) : (
                <>
                  <div className="templateOptionIcon">
                    <img
                      src={existingTemplateIcon}
                      alt="existingTemplateIcon"
                      className="existingTemplateIcon"
                    />
                  </div>
                  <p>Saved Template</p>
                </>
              )}

              {selectedTemplate === "existing" && selectedTemplateData && (
                <div className="iconWrapper">
                  {actionIcons
                    .filter(({ mode }) =>
                      selectedTemplateData?.modes?.includes(mode.toLowerCase())
                    )
                    .map(({ src, mode }) => (
                      <img
                        key={mode}
                        src={src}
                        alt={mode}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInitialModeTab(mode);
                          setIsDrawerOpen(true);
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
          {selectedTemplate === "blank" && (
            <ReusableInput
              label="Template Name"
              placeholder="Maximum 50 characters"
              required={true}
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              maxLength={50}
            />
          )}
        </div>
      </div>

      <ExistingTemplates
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectTemplate={onSelectTemplate}
        initialModeTab={initialModeTab}
      />
    </div>
  );
}

export default BroadcastTemplateDetails;
