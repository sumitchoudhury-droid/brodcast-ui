import "./style.scss";

function BroadcastTextVoiceMessage() {
  return (
    <div className="broadcastTexVoiceMessageContainer">
      {/* <div className="header">
           <h2 className="mainTitle">Add Text Message for Broadcast</h2>
           <div className="headerRight">
             <img src={languageIcon} alt="languageIcon" />
             <p>English</p>
             <img src={greenChevronRight} alt="greenChevronRight" />
           </div>
         </div> */}
      <div className="textBuilder"></div>
      {/* <div className="footerContainer">
           <TextMessageFooter />
         </div> */}
    </div>
  );
}

export default BroadcastTextVoiceMessage;
