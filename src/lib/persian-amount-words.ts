/**
 * Integer Tomans → Persian words (e.g. 1_300_000 → «یک میلیون و سیصد هزار»).
 * Does not include «تومان» — add in UI.
 */

const ONES = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
] as const;

const TEENS = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
] as const;

const TENS = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
] as const;

const HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
] as const;

const SCALES = ["", "هزار", "میلیون", "میلیارد"] as const;

function underThousand(n: number): string {
  if (n === 0) return "";
  if (n < 10) return ONES[n]!;
  if (n < 20) return TEENS[n - 10]!;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? TENS[t]! : `${TENS[t]!} و ${ONES[o]!}`;
  }
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hWord = HUNDREDS[h]!;
  if (rest === 0) return hWord;
  return `${hWord} و ${underThousand(rest)}`;
}

export function tomanToPersianWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const int = Math.trunc(n);
  if (int === 0) return "صفر";

  const parts: string[] = [];
  let x = int;
  let scaleIdx = 0;

  while (x > 0 && scaleIdx < SCALES.length) {
    const chunk = x % 1000;
    x = Math.floor(x / 1000);
    if (chunk > 0) {
      const w = underThousand(chunk);
      const s = SCALES[scaleIdx]!;
      parts.push(s ? `${w} ${s}` : w);
    }
    scaleIdx += 1;
  }

  parts.reverse();
  return parts.join(" و ");
}
