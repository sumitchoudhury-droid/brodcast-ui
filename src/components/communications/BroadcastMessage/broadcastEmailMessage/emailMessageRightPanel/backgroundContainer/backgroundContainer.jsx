import "./style.scss";
import { getOpacityFromColor } from "../../../../../../utils/colorUtils";

export const BackgroundContainer = ({
  bgColor,
  handleBgColorChange,
  bgImage,
  removeBgImage,
  bgImageInputRef,
  handleBgImageUpload,
  colorInputRef,
  bgRepeat,
  handleBgRepeatChange,
  bgSize,
  handleBgSizeChange,
  width,
  widthUnit,
  handleWidthChange,
  height,
  heightUnit,
  handleHeightChange,
  onResetColor
}) => {
  return (
    <div className="backgroundContainer">
      <div className="backgroundContainerHeader">
        <p>Background</p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M12.5 6.66667H12.5083M2.5 13.3333L6.66667 9.16666C7.44 8.4225 8.39333 8.4225 9.16667 9.16666L13.3333 13.3333M11.6667 11.6667L12.5 10.8333C13.2733 10.0892 14.2267 10.0892 15 10.8333L17.5 13.3333M2.5 5C2.5 4.33696 2.76339 3.70107 3.23223 3.23223C3.70107 2.76339 4.33696 2.5 5 2.5H15C15.663 2.5 16.2989 2.76339 16.7678 3.23223C17.2366 3.70107 17.5 4.33696 17.5 5V15C17.5 15.663 17.2366 16.2989 16.7678 16.7678C16.2989 17.2366 15.663 17.5 15 17.5H5C4.33696 17.5 3.70107 17.2366 3.23223 16.7678C2.76339 16.2989 2.5 15.663 2.5 15V5Z"
            stroke="#606E80"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="backgroundControls">
        <div className="backgroundControlsTop">
          <div className="colorControlWrapper">
            <div
              className="colorControl"
              onClick={() => colorInputRef.current?.click()}
            >
              <div
                className="colorPreview"
                style={{ backgroundColor: bgColor }}
              ></div>
              <span className="hexValue">{bgColor.toUpperCase()}</span>
              <span className="opacityValue">
                {getOpacityFromColor(bgColor)}%
              </span>
              <input
                type="color"
                ref={colorInputRef}
                className="hiddenColorInput"
                value={bgColor}
                onChange={(e) => handleBgColorChange(e.target.value)}
              />
            </div>
          </div>
          <div className="backgroundControlsTopRight" onClick={onResetColor}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M8.33333 10C8.33333 10.442 8.50893 10.866 8.82149 11.1785C9.13405 11.4911 9.55797 11.6667 10 11.6667C10.442 11.6667 10.866 11.4911 11.1785 11.1785C11.4911 10.866 11.6667 10.442 11.6667 10C11.6667 9.55797 11.4911 9.13405 11.1785 8.82149C10.866 8.50893 10.442 8.33333 10 8.33333C9.55797 8.33333 9.13405 8.50893 8.82149 8.82149C8.50893 9.13405 8.33333 9.55797 8.33333 10Z"
                stroke="#555F75"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.5 10C15.5 13.3333 13 15 10 15C7 15 4.5 13.3333 2.5 10C4.5 6.66667 7 5 10 5C13 5 15.5 6.66667 17.5 10Z"
                stroke="#555F75"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="bgDimensions">
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
                  style={{ minWidth: "30px" }}
                  onClick={() => handleWidthChange(width, "%")}
                >
                  %
                </button>
                <button
                  className={`segment ${widthUnit === "px" ? "active" : ""}`}
                  style={{ minWidth: "30px" }}
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
              <input
                type="number"
                className="dimensionInput"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
              />
              <div className="segmentedControl">
                <button
                  className={`segment ${heightUnit === "%" ? "active" : ""}`}
                  style={{ minWidth: "30px" }}
                  onClick={() => handleHeightChange(height, "%")}
                >
                  %
                </button>
                <button
                  className={`segment ${heightUnit === "px" ? "active" : ""}`}
                  style={{ minWidth: "30px" }}
                  onClick={() => handleHeightChange(height, "px")}
                >
                  px
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bgImageActions">
          {bgImage ? (
            <div className="bgImagePreviewContainer">
              <div className="bgImagePreview">
                <div
                  className="imageThumb"
                  style={{ backgroundImage: `url(${bgImage})` }}
                ></div>
                <span className="fileName">BG Image</span>
                <button
                  className="iconBtnSmall"
                  onClick={removeBgImage}
                  title="Remove Background Image"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="bgImageOptions">
                <div className="optionGroup">
                  <p className="optionLabel">Repeat</p>
                  <div className="segmentedControl">
                    <button
                      className={`segment ${bgRepeat === "repeat" ? "active" : ""}`}
                      onClick={() => handleBgRepeatChange("repeat")}
                    >
                      Repeat
                    </button>
                    <button
                      className={`segment ${bgRepeat === "no-repeat" ? "active" : ""}`}
                      onClick={() => handleBgRepeatChange("no-repeat")}
                    >
                      No-Repeat
                    </button>
                  </div>
                </div>

                <div className="optionGroup">
                  <p className="optionLabel">Size</p>
                  <div className="segmentedControl">
                    <button
                      className={`segment ${bgSize === "contain" ? "active" : ""}`}
                      onClick={() => handleBgSizeChange("contain")}
                    >
                      Contain
                    </button>
                    <button
                      className={`segment ${bgSize === "cover" ? "active" : ""}`}
                      onClick={() => handleBgSizeChange("cover")}
                    >
                      Cover
                    </button>
                    <button
                      className={`segment ${bgSize === "fill" ? "active" : ""}`}
                      onClick={() => handleBgSizeChange("fill")}
                    >
                      Fill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              className="addBgImageBtn"
              onClick={() => bgImageInputRef.current?.click()}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span>Add BG Image</span>
              <input
                type="file"
                ref={bgImageInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleBgImageUpload}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
