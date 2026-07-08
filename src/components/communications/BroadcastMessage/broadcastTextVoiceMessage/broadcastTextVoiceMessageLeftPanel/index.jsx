import { useState } from "react";
import searchIcon from "../../../../../assets/leftPanel/leftPanelSearch.svg";
import placeholderIcon from "../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import { PLACEHOLDERS } from "../../../../../constants/placeholders";
import "./style.scss";

function BroadcastTextVoiceMessageLeftPanel({ editorInstance }) {
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
            style={{ cursor: "pointer" }}
            onMouseDown={(e) => {
              e.preventDefault();
              editorInstance?.insertAtCursor(item.value);
            }}
          >
            <div className="broadcastTextVoiceMessageLeftPanelIconContainer">
              <img src={placeholderIcon} alt="placeholderIcon" />
            </div>
            <div className="broadcastTextVoiceMessageLeftPanelTextContainer">
              <p className="broadcastTextVoiceMessageLeftPanelText">
                {item.label} - {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BroadcastTextVoiceMessageLeftPanel;
