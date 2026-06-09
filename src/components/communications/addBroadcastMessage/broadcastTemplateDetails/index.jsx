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
import { ReusableRadioButton } from "../../../../reusableComponents/reusableRadioButton";
import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown";
import textTemplate from "../../existingTemplates/htmlTemplates/textMessage.html?raw";
import voiceTemplate from "../../existingTemplates/htmlTemplates/voiceMessage.html?raw";

const templateOptions = [
  { label: "Appointment Rescheduled", value: "appointmentRescheduled" },
  { label: "Health Camp Invitation", value: "healthCampInvitation" },
  { label: "Treatment Plan Update", value: "treatmentPlanUpdate" },
  { label: "Seasonal Health Advisory", value: "seasonalHealthAdvisory" },
  { label: "Diabetes Screening Alert", value: "diabetesScreeningAlert" },
  { label: "Wellness Program Enrollment", value: "wellnessProgramEnrollment" }
];

const actionIcons = [
  { src: messageIcon, mode: "Text" },
  { src: mailIcon, mode: "Mail" },
  { src: phoneIcon, mode: "Voice" }
];

function BroadcastTemplateDetails({
  selectedModes = [],
  selectedTemplateType,
  setSelectedTemplateType,
  existingTemplateValues,
  setExistingTemplateValues,
  newTemplateName,
  setNewTemplateName,
  selectedTemplate,
  setSelectedTemplate,
  onSelectTemplate,
  selectedTemplateData
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [initialModeTab, setInitialModeTab] = useState("Text");

  const handleDropdownSelect = (val) => {
    setExistingTemplateValues(val);
    const option = templateOptions.find((o) => o.value === val);
    if (!option || !onSelectTemplate) return;
    onSelectTemplate({
      title: option.label,
      ...(selectedModes.includes("Text") && { textTemplate }),
      ...(selectedModes.includes("Voice") && { voiceTemplate })
    });
  };

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
                  label="Saved Template"
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
                placeholder="Maximum 50 characters"
                required={true}
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                maxLength={50}
              />
            ) : (
              <ReusableDropDown
                label="Template Name"
                greenIcon={false}
                placeholder="Enter Template Name"
                options={templateOptions}
                value={existingTemplateValues}
                onChange={handleDropdownSelect}
                required={true}
                overWriteClassName="topdown"
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
                          selectedTemplateData?.modes?.includes(
                            mode.toLowerCase()
                          )
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
          </>
        )}
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
