import "./style.scss";

export const PaddingContainer = ({
  selectedComp,
  padding,
  handlePaddingChange,
  margin,
  handleMarginChange
}) => {
  if (!selectedComp) return null;

  const sides = [
    { key: "top", label: "Top" },
    { key: "bottom", label: "Bottom" },
    { key: "left", label: "Left" },
    { key: "right", label: "Right" }
  ];

  return (
    <div className="paddingContainer">
      <div className="sectionContent">
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
                    value={padding[side.key] || 0}
                    onChange={(e) =>
                      handlePaddingChange(side.key, e.target.value)
                    }
                    className="numInput"
                  />
                  <span className="unit">px</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="divider"></div>

        {/* Margin Section */}
        <div className="styleGroup">
          <p className="groupLabel">Margin</p>
          <div className="inputsGrid">
            {sides.map((side) => (
              <div key={`margin-${side.key}`} className="inputWrapper">
                <span className="sideLabel">{side.label}</span>
                <div className="numInputGroup">
                  <input
                    type="number"
                    value={margin[side.key] || 0}
                    onChange={(e) =>
                      handleMarginChange(side.key, e.target.value)
                    }
                    className="numInput"
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
