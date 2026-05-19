import { useState } from "react";
import blackTemplateIcon from "../../../../assets/commonIcons/blackTemplate.svg";
import existingTemplateIcon from "../../../../assets/commonIcons/existingTemplate.svg";
import crossIcon from "../../../../assets/commonIcons/redCrossIcon.svg";
import ExistingTemplates from "../../existingTemplates/index";
import "./style.scss";

import { ReusableInput } from "../../../../reusableComponents/reusableInput";
import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton";
import { ReusableMultiSelectDropdown } from "../../../../reusableComponents/reusableMultiSelectDropdown";

const templateOptions = [
  { label: "Main Clinic", value: "main" },
  { label: "North Branch", value: "north" },
  { label: "South Branch", value: "south" }
];

function BroadcastTemplateDetails({
  selectedModes = [],
  selectedTemplateType,
  setSelectedTemplateType,
  existingTemplateValues,
  setExistingTemplateValues,
  onSelectTemplate,
  selectedTemplateData
}) {
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const showIconTemplate = selectedModes.includes("Email");
  const showRadioRow =
    !showIconTemplate &&
    (selectedModes.includes("Text") || selectedModes.includes("Voice"));

  return (
    <div className="broadcastTemplateDetails">
      <div className="broadcastTemplateDetailsTitle">
        <p>Broadcast Template Details</p>
      </div>
      <div className="broadcastTemplateDetailsContent">
        {showRadioRow ? (
          <div className="radioRow">
            <div className="radioOptions">
              <p>
                Template Type <span>*</span>
              </p>
              <div className="radioGrp">
                <ReusableRadioButton
                  label="New Template"
                  value="newTemplate"
                  name="send"
                  checked={selectedTemplateType === "newTemplate"}
                  onChange={setSelectedTemplateType}
                />
                <ReusableRadioButton
                  label="Existing Template"
                  value="existingTemplate"
                  name="send"
                  checked={selectedTemplateType === "existingTemplate"}
                  onChange={setSelectedTemplateType}
                />
              </div>
            </div>
            {selectedTemplateType === "newTemplate" ? (
              <ReusableInput
                label="Template Name"
                placeholder="Enter Template Name"
              />
            ) : (
              <ReusableMultiSelectDropdown
                label="Select Template"
                greenIcon={false}
                placeholder="Select Template"
                options={templateOptions}
                value={existingTemplateValues}
                onChange={setExistingTemplateValues}
                required={true}
              />
            )}
          </div>
        ) : (
          <>
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
              {selectedTemplate === "blank" && (
                <ReusableInput
                  label="Template Name"
                  placeholder="Enter Template Name"
                />
              )}
            </div>
          </>
        )}
      </div>

      <ExistingTemplates
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectTemplate={onSelectTemplate}
      />
    </div>
  );
}

export default BroadcastTemplateDetails;
