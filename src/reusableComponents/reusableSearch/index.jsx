import "./style.scss";

import searchIcon from "../../assets/mainScreen/searchIcon.svg";

const ResuableSearch = ({ maxWidth = "100%", width = "100%" }) => {
  return (
    <div
      className="searchContainers"
      style={{ maxWidth: maxWidth, width: width }}
    >
      <img src={searchIcon} alt="searchIcon" className="searchIcon" />
      <input
        type="text"
        placeholder="Search by Provider Name"
        className="searchInput"
      />
    </div>
  );
};

export default ResuableSearch;
