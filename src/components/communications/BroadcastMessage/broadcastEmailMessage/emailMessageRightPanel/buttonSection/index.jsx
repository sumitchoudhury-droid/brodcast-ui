import { useState } from "react";

import selectIcon from "../../../../../../assets/commonIcons/selectIcon.svg";
import editIcon from "../../../../../../assets/commonIcons/editIcon.svg";
import deleteIcon from "../../../../../../assets/commonIcons/deleteIcon.svg";

import "./style.scss";

export const ButtonSection = ({ buttonUrl, onUrlChange }) => {
  const [inputValue, setInputValue] = useState(buttonUrl);

  const [prevButtonUrl, setPrevButtonUrl] = useState(buttonUrl);

  if (buttonUrl !== prevButtonUrl) {
    setInputValue(buttonUrl);
    setPrevButtonUrl(buttonUrl);
  }

  const handleUpdate = () => {
    onUrlChange(inputValue);
  };

  return (
    <div className="buttonSection">
      <div className="buttonSectionHeaderContainer">
        <p className="buttonSectionHeader">Button Link</p>
        {buttonUrl && (
          <img
            src={deleteIcon}
            alt="deleteIcon"
            className="deleteIcon"
            onClick={() => {
              setInputValue("");
              onUrlChange("");
            }}
          />
        )}
      </div>
      <div className="buttonSectionContent">
        <div className="buttonUrlInput">
          <input
            type="text"
            placeholder="Enter URL"
            className="buttonUrlInputText"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {buttonUrl && (
            <img
              src={editIcon}
              alt="editIcon"
              className="editIcon"
              onClick={handleUpdate}
            />
          )}
        </div>
        {!buttonUrl && (
          <img
            src={selectIcon}
            alt="selectIcon"
            className="selectIcon"
            onClick={handleUpdate}
          />
        )}
      </div>
    </div>
  );
};
