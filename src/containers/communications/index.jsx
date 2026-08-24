import { useState } from "react";
import "./style.scss";

import BroadCastTable from "../../components/communications/BroadCastTable/index";

function Communications() {
  const [addScheduleModal, setAddScheduleModal] = useState(false);

  return (
    <div className="communicationsWrapper">
      <div
        className={`${addScheduleModal ? "communicationContent" : "broadcastTableWrapper"}`}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%"
          }}
        >
          <BroadCastTable
            addScheduleModal={addScheduleModal}
            setAddScheduleModal={setAddScheduleModal}
          />
        </div>
      </div>
    </div>
  );
}

export default Communications;
