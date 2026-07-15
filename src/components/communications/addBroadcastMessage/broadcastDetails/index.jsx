import { ReusableDropDown } from "../../../../reusableComponents/reusableDropDown/index";
import { ReusableCheckbox } from "../../../../reusableComponents/reusableCheckbox/index";
import { useBroadcastConfigGet as useGet } from "../../../../hooks/useBroadcastConfigGet";
import { ENDPOINTS } from "../../../../api/endpoints.js";
import { BROADCAST_CONFIG_HEADERS } from "../../../../api/api.jsx";
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
  const { data: modesData, isLoading: isLoadingModes } = useGet(
    ["communication-modes"],
    ENDPOINTS.broadcastConfig.COMMUNICATION_MODES,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const { data: prioritiesData } = useGet(
    ["priorities"],
    ENDPOINTS.broadcastConfig.PRIORITIES,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const { data: categoriesData } = useGet(
    ["categories"],
    ENDPOINTS.broadcastConfig.CATEGORIES,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const communicationModes = modesData?.data ?? [];

  const priorityOptions = (prioritiesData?.data ?? []).map((p) => ({
    value: p.id,
    label: p.displayText
  }));

  const categoryOptions = [
    { value: "select", label: "Select" },
    ...(categoriesData?.data ?? []).map((c) => ({
      value: c.id,
      label: c.name
    }))
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
