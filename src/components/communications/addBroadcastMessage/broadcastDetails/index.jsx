import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown/index";
import { ReusableCheckbox } from "../../../../reusableComponents/reusableCheckbox/index";

import "./style.scss";

export const BroadcastDetails = ({
  selectedModes,
  setSelectedModes,
  category,
  onCategoryChange,
  priority,
  setPriority
}) => {
  const categoryOptions = [
    { value: "select", label: "Select" },
    {
      value: "balance_payment_reminder",
      label: "Balance Payment Reminder"
    },
    {
      value: "offer",
      label: "Offer"
    },
    {
      value: "announcement",
      label: "Announcement"
    }
  ];

  const priorityOptions = [
    {
      value: "standard",
      label: "Standard"
    },
    {
      value: "high",
      label: "High"
    }
  ];

  const handleCheckboxChange = (mode) => {
    setSelectedModes((prev) =>
      prev.includes(mode)
        ? prev.filter((item) => item !== mode)
        : [...prev, mode]
    );
  };

  return (
    <div className="broadcastDetails">
      <div className="broadcastDetailsTitle">
        <p>Broadcast Details</p>
      </div>

      <div className="broadcastDetailsContent">
        {/* Communication Mode */}
        <div className="broadcastDetailsContentRow">
          <div className="broadcastDetailsContentRowLabel">
            <p>Communication Mode</p>
            <span>*</span>
          </div>

          <div className="broadcastDetailsContentRowValue">
            <ReusableCheckbox
              label="Text"
              checked={selectedModes.includes("Text")}
              onChange={() => handleCheckboxChange("Text")}
            />

            <ReusableCheckbox
              label="Email"
              checked={selectedModes.includes("Email")}
              onChange={() => handleCheckboxChange("Email")}
            />

            <ReusableCheckbox
              label="Voice"
              checked={selectedModes.includes("Voice")}
              onChange={() => handleCheckboxChange("Voice")}
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="broadcastDetailsContentRow">
          <ReusableDropDown
            label="Category"
            greenIcon={false}
            placeholder="Select Category"
            options={categoryOptions}
            value={category}
            onChange={(val) => onCategoryChange(val)}
          />
        </div>

        {/* Priority Dropdown */}
        <div className="broadcastDetailsContentRow">
          <ReusableDropDown
            label="Priority"
            greenIcon={false}
            placeholder="Select Priority"
            options={priorityOptions}
            value={priority}
            onChange={(val) => setPriority(val)}
            required={true}
          />
        </div>
      </div>
    </div>
  );
};
