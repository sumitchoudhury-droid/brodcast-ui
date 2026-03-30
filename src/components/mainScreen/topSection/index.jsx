import logo from "../../../assets/mainScreen/manipalIcon.png";
import greenChevronRight from "../../../assets/mainScreen/greenChevronRight.svg";
import notificationIcon from "../../../assets/mainScreen/notification.svg";
import chevronRight from "../../../assets/mainScreen/chevronRight.svg";

import "./style.scss";

export const TopSection = () => {
  return (
    <div className="topSection">
      <div className="topSectionLeft">
        <div className="topSectionLeftLogo">
          <img src={logo} alt="logo" />
        </div>
        <div className="topSectionLeftContent">
          <h1 className="topSectionLeftContentTitle">Intergy</h1>
          <div className="topSectionLeftContentDescription">
            <img src={greenChevronRight} alt="greenChevronRight" />
          </div>
        </div>
      </div>
      <div className="topSectionRight">
        <div className="topSectionRightNotification">
          <img src={notificationIcon} alt="notificationIcon" />
        </div>
        <div className="topSectionRightContent">
          <div className="topSectionRightContentTitle">
            <div className="topSectionRightContentDescription">
              <h1>Katherine Clark</h1>
              <p>Super Admin</p>
            </div>
          </div>
          <div className="topSectionRightIcon">
            <img src={chevronRight} alt="chevronRight" />
          </div>
        </div>
      </div>
    </div>
  );
};
