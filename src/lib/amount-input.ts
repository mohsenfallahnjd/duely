/**
 * Amount field helpers: Western thousand separators in the input; parse for Tomans.
 */

export function formatAmountInputFromRaw(raw: string): string {
  const s = raw.replace(/٬/g, "").replace(/٫/g, ".").replace(/,/g, "");
  let intPart = "";
  let decPart = "";
  let seenDot = false;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      if (!seenDot) intPart += ch;
      else if (decPart.length < 2) decPart += ch;
    } else if (ch === "." && !seenDot) {
      seenDot = true;
    }
  }

  if (intPart === "" && decPart === "" && !seenDot) return "";

  if (intPart.length > 1) {
    intPart = intPart.replace(/^0+/, "") || "0";
  }

  let intFmt: string;
  if (intPart === "") {
    intFmt = seenDot || decPart.length > 0 ? "0" : "";
  } else {
    intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  if (!seenDot) return intFmt;
  if (decPart.length === 0) return `${intFmt}.`;
  return `${intFmt}.${decPart}`;
}

/** Parse displayed value (with commas) to number; NaN if empty/invalid. */
export function parseAmountInputToNumber(formatted: string): number {
  const s = formatted.replace(/,/g, "").replace(/\s/g, "").trim();
  if (s === "" || s === ".") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
