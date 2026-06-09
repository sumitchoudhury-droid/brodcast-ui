import "./style.scss";

import searchIcon from "../../assets/mainScreen/searchIcon.svg";

const ResuableSearch = ({
  maxWidth = "100%",
  width = "100%",
  placeholder = "Search by Provider Name",
  value,
  onChange
}) => {
  return (
    <div
      className="searchContainers"
      style={{ maxWidth: maxWidth, width: width }}
    >
      <img src={searchIcon} alt="searchIcon" className="searchIcon" />
      <input
        type="text"
        placeholder={placeholder}
        className="searchInput"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default ResuableSearch;
