import "./style.scss";

export const PaddingContainer = ({
  selectedComp,
  padding,
  handlePaddingChange,
  alignItems,
  handleAlignItemsChange,
  justifyContent,
  handleJustifyContentChange,
  textAlign,
  handleTextAlignChange,
  isFrame
}) => {
  if (!selectedComp) return null;

  const sides = [
    { key: "top", label: "Top" },
    { key: "bottom", label: "Bottom" },
    { key: "left", label: "Left" },
    { key: "right", label: "Right" }
  ];

  const alignmentOptions = [
    { value: "flex-start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "flex-end", label: "End" }
  ];

  const justifyOptions = [
    { value: "flex-start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "flex-end", label: "End" },
    { value: "space-between", label: "Between" },
    { value: "space-around", label: "Around" },
    { value: "space-evenly", label: "Evenly" },
    { value: "stretch", label: "Stretch" }
  ];

  const textAlignOptions = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" }
  ];

  return (
    <div className="paddingContainer">
      <div className="sectionContent">
        <div className="flexControlGroup">
          {isFrame && (
            <>
              <div className="styleGroup">
                <p className="groupLabel">Align items</p>
                <div className="alignmentButtons">
                  {alignmentOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`alignBtn ${alignItems === opt.value ? "active" : ""}`}
                      onClick={() => handleAlignItemsChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="styleGroup">
                <p className="groupLabel">Justify content</p>
                <div className="alignmentButtons wrap">
                  {justifyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`alignBtn ${justifyContent === opt.value ? "active" : ""}`}
                      onClick={() => handleJustifyContentChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="styleGroup">
            <p className="groupLabel">Content align</p>
            <div className="alignmentButtons">
              {textAlignOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`alignBtn ${textAlign === opt.value ? "active" : ""}`}
                  onClick={() => handleTextAlignChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Padding Section */}
        <div className="styleGroup">
          <p className="groupLabel">Padding</p>
          <div className="inputsGrid">
            {sides.map((side) => (
              <div key={`padding-${side.key}`} className="inputWrapper">
                <span className="sideLabel">{side.label}</span>
                <div className="numInputGroup">
                  <input
                    type="number"
                    value={
                      padding[side.key] === "0" ||
                      padding[side.key] === "" ||
                      padding[side.key] === undefined ||
                      padding[side.key] === null
                        ? ""
                        : padding[side.key]
                    }
                    onChange={(e) =>
                      handlePaddingChange(side.key, e.target.value)
                    }
                    className="numInput"
                    placeholder="0"
                  />
                  <span className="unit">px</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
