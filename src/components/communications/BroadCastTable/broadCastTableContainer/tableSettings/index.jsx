import { useState } from "react";
import { ReusableCheckbox } from "../../../../../reusableComponents/reusableCheckbox/index";
import { ReusableButton } from "../../../../../reusableComponents/resuableButton/index";
import "./style.scss";

const COLUMN_LABELS = {
  mode: "Mode",
  template: "Template",
  appointmentType: "Appointment Type",
  location: "Location",
  provider: "Provider",
  scheduledDateTime: "Scheduled Date/Time",
  messageStatus: "Message Status",
  broadcastStatus: "Broadcast Status"
};

const MANDATORY_COLUMNS = ["mode", "template", "broadcastStatus"];

export default function TableSettings({
  columnOrder,
  columnVisibility,
  onApply,
  onReset,
  onClose
}) {
  const [tempOrder, setTempOrder] = useState(columnOrder || []);
  const [tempVisibility, setTempVisibility] = useState(columnVisibility || {});
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleCheckboxChange = (columnId) => {
    if (MANDATORY_COLUMNS.includes(columnId)) return;
    setTempVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const handleDragStart = (e, index) => {
    const columnId = tempOrder[index];
    if (MANDATORY_COLUMNS.includes(columnId)) {
      e.preventDefault();
      return;
    }
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const columnId = tempOrder[index];
    if (MANDATORY_COLUMNS.includes(columnId)) {
      return;
    }
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const columnId = tempOrder[targetIndex];
    if (MANDATORY_COLUMNS.includes(columnId)) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (draggingIndex !== null && draggingIndex !== targetIndex) {
      const updatedOrder = [...tempOrder];
      const [draggedItem] = updatedOrder.splice(draggingIndex, 1);
      updatedOrder.splice(targetIndex, 0, draggedItem);
      setTempOrder(updatedOrder);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleApply = () => {
    onApply(tempOrder, tempVisibility);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <div className="tableSettingsPopover" onClick={(e) => e.stopPropagation()}>
      <div className="tableSettingsHeader">
        <h3>Table Settings</h3>
      </div>
      <div className="tableSettingsList">
        {tempOrder.map((columnId, index) => {
          const isMandatory = MANDATORY_COLUMNS.includes(columnId);
          const isChecked = tempVisibility[columnId] ?? true;
          const isDragging = draggingIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={columnId}
              className={`settingsItem ${isMandatory ? "mandatory" : ""} ${
                isDragging ? "dragging" : ""
              } ${isDragOver ? "dragOver" : ""}`}
              draggable={!isMandatory}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className={`dragHandle ${isMandatory ? "disabled" : ""}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M6.66663 4.16732C6.66663 4.38833 6.75442 4.60029 6.9107 4.75657C7.06698 4.91285 7.27895 5.00065 7.49996 5.00065C7.72097 5.00065 7.93293 4.91285 8.08921 4.75657C8.2455 4.60029 8.33329 4.38833 8.33329 4.16732C8.33329 3.9463 8.2455 3.73434 8.08921 3.57806C7.93293 3.42178 7.72097 3.33398 7.49996 3.33398C7.27895 3.33398 7.06698 3.42178 6.9107 3.57806C6.75442 3.73434 6.66663 3.9463 6.66663 4.16732Z"
                    stroke="#606E80"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.66663 10.0007C6.66663 10.2217 6.75442 10.4336 6.9107 10.5899C7.06698 10.7462 7.27895 10.834 7.49996 10.834C7.72097 10.834 7.93293 10.7462 8.08921 10.5899C8.2455 10.4336 8.33329 10.2217 8.33329 10.0007C8.33329 9.77964 8.2455 9.56768 8.08921 9.4114C7.93293 9.25512 7.72097 9.16732 7.49996 9.16732C7.27895 9.16732 7.06698 9.25512 6.9107 9.4114C6.75442 9.56768 6.66663 9.77964 6.66663 10.0007Z"
                    stroke="#606E80"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.66663 15.834C6.66663 16.055 6.75442 16.267 6.9107 16.4232C7.06698 16.5795 7.27895 16.6673 7.49996 16.6673C7.72097 16.6673 7.93293 16.5795 8.08921 16.4232C8.2455 16.267 8.33329 16.055 8.33329 15.834C8.33329 15.613 8.2455 15.401 8.08921 15.2447C7.93293 15.0884 7.72097 15.0007 7.49996 15.0007C7.27895 15.0007 7.06698 15.0884 6.9107 15.2447C6.75442 15.401 6.66663 15.613 6.66663 15.834Z"
                    stroke="#606E80"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.6666 4.16732C11.6666 4.38833 11.7544 4.60029 11.9107 4.75657C12.067 4.91285 12.2789 5.00065 12.5 5.00065C12.721 5.00065 12.9329 4.91285 13.0892 4.75657C13.2455 4.60029 13.3333 4.38833 13.3333 4.16732C13.3333 3.9463 13.2455 3.73434 13.0892 3.57806C12.9329 3.42178 12.721 3.33398 12.5 3.33398C12.2789 3.33398 12.067 3.42178 11.9107 3.57806C11.7544 3.73434 11.6666 3.9463 11.6666 4.16732Z"
                    stroke="#606E80"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.6666 10.0007C11.6666 10.2217 11.7544 10.4336 11.9107 10.5899C12.067 10.7462 12.2789 10.834 12.5 10.834C12.721 10.834 12.9329 10.7462 13.0892 10.5899C13.2455 10.4336 13.3333 10.2217 13.3333 10.0007C13.3333 9.77964 13.2455 9.56768 13.0892 9.4114C12.9329 9.25512 12.721 9.16732 12.5 9.16732C12.2789 9.16732 12.067 9.25512 11.9107 9.4114C11.7544 9.56768 11.6666 9.77964 11.6666 10.0007Z"
                    stroke="#606E80"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.6666 15.834C11.6666 16.055 11.7544 16.267 11.9107 16.4232C12.067 16.5795 12.2789 16.6673 12.5 16.6673C12.721 16.6673 12.9329 16.5795 13.0892 16.4232C13.2455 16.267 13.3333 16.055 13.3333 15.834C13.3333 15.613 13.2455 15.401 13.0892 15.2447C12.9329 15.0884 12.721 15.0007 12.5 15.0007C12.2789 15.0007 12.067 15.0884 11.9107 15.2447C11.7544 15.401 11.6666 15.613 11.6666 15.834Z"
                    stroke="#606E80"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="checkboxCol">
                <ReusableCheckbox
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(columnId)}
                  disabled={isMandatory}
                />
              </div>
              <span className={`columnLabel ${isMandatory ? "disabled" : ""}`}>
                {COLUMN_LABELS[columnId]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="tableSettingsFooter">
        <ReusableButton
          type="button"
          className="btnReset"
          onClick={handleReset}
          label="Reset"
          variant="primary"
        />
        <ReusableButton
          type="button"
          className="btnApply"
          onClick={handleApply}
          label="Apply"
          variant="secondary"
        />
      </div>
    </div>
  );
}
