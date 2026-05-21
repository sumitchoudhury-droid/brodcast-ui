import { memo } from "react";
import ReusableRightDrawer from "../../../../reusableComponents/reusabeleRightDrawer/index";
import sortIcon from "../../../../assets/boardCastTableIcons/sortIcon.svg";
import { ReusableButton } from "../../../../reusableComponents/resuableButton/index";
import "./style.scss";

export const StopScheduleBulk = memo(function StopScheduleBulk({
  isOpen,
  onClose,
  onConfirm,
  selectedBroadcasts = []
}) {
  const count = selectedBroadcasts.length;

  return (
    <ReusableRightDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="800px"
      title="Confirm Stop Schedule"
      className="stopScheduleBulkDrawer"
      footer={
        <div className="drawerFooterBtn">
          <ReusableButton
            variant="secondary"
            onClick={onClose}
            label="Cancel"
          />
          <ReusableButton
            variant="primary"
            onClick={onConfirm}
            label="Confirm"
          />
        </div>
      }
    >
      <div className="drawerContentBody">
        <p className="confirmText">
          Are you sure you want to{" "}
          <strong>stop these {count} broadcasts?</strong>
        </p>

        <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>
                  <div className="headerContent">
                    Mode <img src={sortIcon} alt="sort" className="sortIcon" />
                  </div>
                </th>
                <th>
                  <div className="headerContent">
                    Template{" "}
                    <img src={sortIcon} alt="sort" className="sortIcon" />
                  </div>
                </th>
                <th>
                  <div className="headerContent">
                    Appointment Type{" "}
                    <img src={sortIcon} alt="sort" className="sortIcon" />
                  </div>
                </th>
                <th>
                  <div className="headerContent">
                    Location{" "}
                    <img src={sortIcon} alt="sort" className="sortIcon" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedBroadcasts.map((broadcast) => (
                <tr key={broadcast.id}>
                  <td>{broadcast.mode || "-"}</td>
                  <td>{broadcast.template || "-"}</td>
                  <td>
                    <div className="cellWithPill">
                      <span className="cellText">
                        {broadcast.appointmentType || "-"}
                      </span>
                      {broadcast.appointmentCount !== undefined && (
                        <span className="countPill">
                          +{broadcast.appointmentCount}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="cellWithPill">
                      <span className="cellText">
                        {broadcast.location || "-"}
                      </span>
                      {broadcast.locationCount !== undefined && (
                        <span className="countPill">
                          +{broadcast.locationCount}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReusableRightDrawer>
  );
});

export default StopScheduleBulk;
