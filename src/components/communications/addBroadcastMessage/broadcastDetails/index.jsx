import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown/index";
import { ReusableCheckbox } from "../../../../reusableComponents/reusableCheckbox/index";
import { useGet } from "../../../../hooks/useGet";
import { ENDPOINTS } from "../../../../api/endpoints.js";
import SkeletonLoader from "../../../../reusableComponents/reusableSkeletonLoader/SkeletonLoader";

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

  const { data: modesData, isLoading: isLoadingModes } = useGet(
    ["communication-modes"],
    ENDPOINTS.broadcastConfig.COMMUNICATION_MODES
  );

  const communicationModes = modesData?.data ?? [];

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
            {isLoadingModes
              ? Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonLoader
                    key={i}
                    width="80px"
                    height="20px"
                    borderRadius="4px"
                  />
                ))
              : communicationModes.map((mode) => (
                  <ReusableCheckbox
                    key={mode.id}
                    label={mode.name}
                    checked={selectedModes.includes(mode.name)}
                    onChange={() => handleCheckboxChange(mode.name)}
                  />
                ))}
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
            info={true}
          />
        </div>
      </div>
    </div>
  );
};
