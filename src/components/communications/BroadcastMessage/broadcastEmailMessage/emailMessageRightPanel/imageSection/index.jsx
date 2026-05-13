import { useState } from "react";
import selectIcon from "../../../../../../assets/commonIcons/selectIcon.svg";
import editIcon from "../../../../../../assets/commonIcons/editIcon.svg";
import deleteIcon from "../../../../../../assets/commonIcons/deleteIcon.svg";

import "./style.scss";

export const ImageSection = ({
  imageLink,
  onLinkChange,
  width,
  widthUnit,
  handleWidthChange,
  height,
  heightUnit,
  handleHeightChange
}) => {
  const [prevImageLink, setPrevImageLink] = useState(imageLink);
  const [linkValue, setLinkValue] = useState(imageLink || "");

  if (imageLink !== prevImageLink) {
    setPrevImageLink(imageLink);
    setLinkValue(imageLink || "");
  }

  const handleLinkUpdate = () => {
    onLinkChange(linkValue);
  };

  return (
    <div className="imageSectionContainer">
      <p className="sectionTitle">Image Section</p>
      <div className="imageSection">
        <div className="imageUrlInput">
          <div className="imageUrlInputHeader">
            <p className="imageSectionHeader">Image Link</p>
            {imageLink && (
              <img
                src={deleteIcon}
                alt="deleteIcon"
                className="deleteIcon"
                onClick={() => {
                  setLinkValue("");
                  onLinkChange("");
                }}
              />
            )}
          </div>

          <div className="imageSectionContent">
            <div className="imageSectionUrlInput">
              <input
                type="text"
                placeholder="Enter Link URL"
                className="imageSectionUrlInputText"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
              />
              {imageLink && (
                <img
                  src={editIcon}
                  alt="editIcon"
                  className="editIcon"
                  onClick={handleLinkUpdate}
                />
              )}
            </div>
            {!imageLink && (
              <img
                src={selectIcon}
                alt="selectIcon"
                className="selectIcon"
                onClick={handleLinkUpdate}
              />
            )}
          </div>
        </div>

        <div className="dimensionControls">
          <div className="optionGroup">
            <p className="optionLabel">Width</p>
            <div className="dimensionInputWrapper">
              <input
                type="number"
                className="dimensionInput"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
              />
              <div className="segmentedControl">
                <button
                  className={`segment ${widthUnit === "%" ? "active" : ""}`}
                  onClick={() => handleWidthChange(width, "%")}
                >
                  %
                </button>
                <button
                  className={`segment ${widthUnit === "px" ? "active" : ""}`}
                  onClick={() => handleWidthChange(width, "px")}
                >
                  px
                </button>
              </div>
            </div>
          </div>

          <div className="optionGroup">
            <p className="optionLabel">Height</p>
            <div className="dimensionInputWrapper">
              {heightUnit !== "auto" && (
                <input
                  type="number"
                  className="dimensionInput"
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                />
              )}
              <div className="segmentedControl">
                <button
                  className={`segment ${heightUnit === "%" ? "active" : ""}`}
                  onClick={() => handleHeightChange(height, "%")}
                >
                  %
                </button>
                <button
                  className={`segment ${heightUnit === "px" ? "active" : ""}`}
                  onClick={() => handleHeightChange(height, "px")}
                >
                  px
                </button>
                <button
                  className={`segment ${heightUnit === "auto" ? "active" : ""}`}
                  onClick={() => handleHeightChange("", "auto")}
                >
                  Auto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
