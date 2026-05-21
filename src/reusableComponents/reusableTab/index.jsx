import "./style.scss";

const ReusableTab = ({ tabOptions = [], selectedTab, setSelectedTab }) => {
  return (
    <div className="reusableTabContainer">
      {tabOptions.map((tab, index) => {
        const isActive = selectedTab === tab.value;

        return (
          <div
            className={`tabWrapper ${isActive ? "activeTab" : ""}`}
            key={index}
            onClick={() => setSelectedTab(tab.value)}
          >
            <span>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ReusableTab;
