import "./style.scss";

export const DimensionContainer = ({
  title = "Dimensions",
  width,
  widthUnit,
  handleWidthChange,
  heightUnit,
  handleHeightChange
}) => {
  return (
    <div className="dimensionContainer">
      <div className="dimensionHeader">
        <p>{title}</p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="18"
          viewBox="0 0 20 18"
          fill="none"
        >
          <path
            d="M2 13V15C2 15.5304 2.21071 16.0391 2.58579 16.4142C2.96086 16.7893 3.46957 17 4 17H16C16.5304 17 17.0391 16.7893 17.4142 16.4142C17.7893 16.0391 18 15.5304 18 15V13"
            stroke="#606E80"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 4L18 7L15 10"
            stroke="#606E80"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 10L2 7L5 4"
            stroke="#606E80"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 7H18"
            stroke="#606E80"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
            <div className="segmentedControl">
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
  );
};
