import { useState } from "react";
import searchIcon from "../../../../../assets/leftPanel/leftPanelSearch.svg";
import placeholderIcon from "../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import "./style.scss";

const PLACEHOLDERS = [
  { label: "Accountstatement", value: "$AccountStatementURL" },
  { label: "Amount", value: "$AMOUNT" },
  { label: "Appointment Date", value: "$APPDATE" },
  { label: "Appointment time (12 hour Format)", value: "$APPTIME12" },
  { label: "Appointment time (24 hour Format)", value: "$APPTIME" },
  { label: "Patient First Name", value: "$FNAME" },
  { label: "Patient Last Name", value: "$LNAME" }
];

function BroadcastTextVoiceMessageLeftPanel() {
  const [search, setSearch] = useState("");

  const filteredPlaceholders = PLACEHOLDERS.filter((item) =>
    `${item.label} ${item.value}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="broadcastTextVoiceMessageLeftPanel">
      <h3 className="broadcastTextVoiceMessageLeftPanelText">Placeholders</h3>

      <div className="broadcastTextVoiceMessageLeftPanelSearch">
        <img src={searchIcon} alt="searchIcon" className="searchIcon" />
        <input
          type="text"
          placeholder="Search Placeholders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="broadcastTextVoiceMessageLeftPanelList">
        {filteredPlaceholders.map((item, index) => (
          <div
            key={index}
            className="broadcastTextVoiceMessageLeftPanelItem"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", item.value);
              e.dataTransfer.setData(
                "text/html",
                `<mj-text font-family="Inter" font-size="16px" font-style="normal" font-weight="400" color="#404B5A" align="center" line-height="22px" padding="0px" margin="0px">${item.value}</mj-text>`
              );
              e.dataTransfer.setData("application/x-placeholder", "true");
            }}
            onDragEnd={() => {
              // If the drop effect is not none, it was dropped on a valid target
            }}
          >
            <div className="broadcastTextVoiceMessageLeftPanelIconContainer">
              <img src={placeholderIcon} alt="placeholderIcon" />
            </div>
            <p className="broadcastTextVoiceMessageLeftPanelText">
              {item.label} - {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BroadcastTextVoiceMessageLeftPanel;
