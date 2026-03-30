import { Outlet } from "react-router-dom";
import { TopSection } from "../../components/mainScreen/topSection";
import { TabsComponent } from "../../components/mainScreen/tabsComponent";
import "./style.scss";

function MainScreen() {
  return (
    <div className="mainScreenContainer">
      <TopSection />
      <TabsComponent />
      <div className="tabContentArea">
        <Outlet />
      </div>
    </div>
  );
}

export default MainScreen;
