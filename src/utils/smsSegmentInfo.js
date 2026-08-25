// GSM 7-bit default alphabet (ETSI GSM 03.38). Each char = 1 unit.
const GSM_7_BASIC = new Set([
  "@",
  "£",
  "$",
  "¥",
  "è",
  "é",
  "ù",
  "ì",
  "ò",
  "Ç",
  "\n",
  "Ø",
  "ø",
  "\r",
  "Å",
  "å",
  "Δ",
  "_",
  "Φ",
  "Γ",
  "Λ",
  "Ω",
  "Π",
  "Ψ",
  "Σ",
  "Θ",
  "Ξ",
  "Æ",
  "æ",
  "ß",
  "É",
  " ",
  "!",
  '"',
  "#",
  "¤",
  "%",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ".",
  "/",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "¡",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "Ä",
  "Ö",
  "Ñ",
  "Ü",
  "§",
  "¿",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "ä",
  "ö",
  "ñ",
  "ü",
  "à"
]);

// GSM 7-bit extension table. Accessed via ESC prefix, so each char = 2 units.
const GSM_7_EXTENDED = new Set([
  "\f",
  "^",
  "{",
  "}",
  "\\",
  "[",
  "~",
  "]",
  "|",
  "€"
]);

// Any char outside these two sets forces the entire message to UCS-2.
export function smsSegmentInfo(text) {
  const source = text || "";
  let gsmCount = 0;
  let isUnicode = false;

  for (const ch of source) {
    if (GSM_7_BASIC.has(ch)) {
      gsmCount += 1;
    } else if (GSM_7_EXTENDED.has(ch)) {
      gsmCount += 2;
    } else {
      isUnicode = true;
      break;
    }
  }

  if (isUnicode) {
    // JS string .length reports UTF-16 code units, which is exactly how
    // UCS-2 SMS counts characters (BMP surrogate pairs count as 2).
    const count = source.length;
    const singleSegmentLimit = 70;
    const multiSegmentLimit = 67;
    const perSegment =
      count <= singleSegmentLimit ? singleSegmentLimit : multiSegmentLimit;
    const segments = count === 0 ? 1 : Math.ceil(count / perSegment);
    return {
      encoding: "UCS-2",
      count,
      segments,
      perSegment,
      singleSegmentLimit
    };
  }

  const singleSegmentLimit = 160;
  const multiSegmentLimit = 153;
  const perSegment =
    gsmCount <= singleSegmentLimit ? singleSegmentLimit : multiSegmentLimit;
  const segments = gsmCount === 0 ? 1 : Math.ceil(gsmCount / perSegment);
  return {
    encoding: "GSM-7",
    count: gsmCount,
    segments,
    perSegment,
    singleSegmentLimit
  };
}
