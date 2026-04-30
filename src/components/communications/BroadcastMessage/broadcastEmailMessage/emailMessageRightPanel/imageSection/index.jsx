import "./style.scss";
export const ImageSection = ({
  imageRepeat,
  handleImageRepeatChange,
  imageSize,
  handleImageSizeChange
}) => {
  return (
    <div className="imageSectionContainer">
      <p className="sectionTitle">ImageSection</p>
      <div className="imageSection">
        <div className="optionGroup">
          <p className="optionLabel">Repeat</p>
          <div className="segmentedControl">
            <button
              className={`segment ${imageRepeat === "repeat" ? "active" : ""}`}
              onClick={() => handleImageRepeatChange("repeat")}
            >
              Repeat
            </button>
            <button
              className={`segment ${imageRepeat === "no-repeat" ? "active" : ""}`}
              onClick={() => handleImageRepeatChange("no-repeat")}
            >
              No-Repeat
            </button>
          </div>
        </div>
        <div className="optionGroup">
          <p className="optionLabel">Size</p>
          <div className="segmentedControl">
            <button
              className={`segment ${imageSize === "contain" ? "active" : ""}`}
              onClick={() => handleImageSizeChange("contain")}
            >
              Contain
            </button>
            <button
              className={`segment ${imageSize === "cover" ? "active" : ""}`}
              onClick={() => handleImageSizeChange("cover")}
            >
              Cover
            </button>
            <button
              className={`segment ${imageSize === "fill" ? "active" : ""}`}
              onClick={() => handleImageSizeChange("fill")}
            >
              Fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
