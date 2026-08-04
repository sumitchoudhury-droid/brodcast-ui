import { useState } from "react";
import searchIcon from "../../../../../assets/leftPanel/leftPanelSearch.svg";
import placeholderIcon from "../../../../../assets/leftPanel/leftPanelPlaceholders.svg";
import { useBroadcastConfigGet } from "../../../../../hooks/useBroadcastConfigGet";
import { ENDPOINTS } from "../../../../../api/endpoints.js";
import { BROADCAST_CONFIG_HEADERS } from "../../../../../api/api.jsx";
import "./style.scss";

function BroadcastTextMessageLeftPanel({ editorInstance }) {
  const [search, setSearch] = useState("");

  const { data: placeholdersData } = useBroadcastConfigGet(
    ["placeholders"],
    ENDPOINTS.broadcastConfig.PLACEHOLDERS,
    null,
    { headers: BROADCAST_CONFIG_HEADERS }
  );

  const placeholders = (placeholdersData?.data ?? []).map((item) => ({
    label: item.displayName,
    value: item.placeHolder
  }));

  const filteredPlaceholders = placeholders.filter((item) =>
    `${item.label} ${item.value}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="broadcastTextMessageLeftPanel">
      <h3 className="broadcastTextMessageLeftPanelText">Placeholders</h3>

      <div className="broadcastTextMessageLeftPanelSearch">
        <img src={searchIcon} alt="searchIcon" className="searchIcon" />
        <input
          type="text"
          placeholder="Search Placeholders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="broadcastTextMessageLeftPanelList">
        {filteredPlaceholders.map((item, index) => (
          <div
            key={index}
            className="broadcastTextMessageLeftPanelItem"
            draggable
            onMouseDown={(e) => {
              e.preventDefault();
              editorInstance?.insertAtCursor(item.value);
            }}
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
            <div className="broadcastTextMessageLeftPanelIconContainer">
              <img src={placeholderIcon} alt="placeholderIcon" />
            </div>
            <div className="broadcastTextMessageLeftPanelTextContainer">
              <p className="broadcastTextMessageLeftPanelText">
                {item.label} - {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BroadcastTextMessageLeftPanel;
