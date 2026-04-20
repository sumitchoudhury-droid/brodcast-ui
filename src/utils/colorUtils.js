export const getOpacityFromColor = (color) => {
  if (!color) return 100;

  const colorStr = String(color).trim();

  // Handle Hex
  if (colorStr.startsWith("#")) {
    if (colorStr.length === 9) {
      // #RRGGBBAA
      return Math.round((parseInt(colorStr.slice(7, 9), 16) / 255) * 100);
    }
    if (colorStr.length === 5) {
      // #RGBA
      return Math.round(
        (parseInt(colorStr.slice(4, 5).repeat(2), 16) / 255) * 100
      );
    }
    return 100;
  }

  // Handle RGBA
  if (colorStr.startsWith("rgba")) {
    const parts = colorStr.match(
      /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)/
    );
    if (parts && parts[1]) {
      return Math.round(parseFloat(parts[1]) * 100);
    }
  }

  if (colorStr.toLowerCase() === "transparent") {
    return 0;
  }

  return 100;
};
