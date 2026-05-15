import type { PickedDeviceContact } from "@/lib/device-contacts";

/** Unfold vCard line continuation (lines starting with space/tab). */
function unfoldLines(raw: string): string[] {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (/^[ \t]/.test(line) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else if (line !== "") {
      out.push(line);
    }
  }
  return out;
}

function splitCards(text: string): string[] {
  const re = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
  return text.match(re) ?? [];
}

function parseNameFromN(value: string): string {
  const parts = value.split(";").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[1]} ${parts[0]}`.trim();
  return parts[0] ?? "";
}

function cardLinesToMap(lines: string[]): {
  fn?: string;
  n?: string;
  tels: string[];
} {
  let fn: string | undefined;
  let n: string | undefined;
  const tels: string[] = [];
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const keyPart = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (!value) continue;
    const base = keyPart.split(";")[0]?.toUpperCase() ?? "";
    if (base === "FN") {
      fn = value;
    } else if (base === "N" && !n) {
      n = value;
    } else if (base === "TEL") {
      const cleaned = value.replace(/^tel:/i, "").trim();
      if (cleaned) tels.push(cleaned);
    }
  }
  return { fn, n, tels };
}

/**
 * Parse one or more vCards (e.g. export from iOS “Share Contact” or Android Contacts).
 */
export function parseVCardContent(content: string): PickedDeviceContact[] {
  const cards = splitCards(content);
  if (cards.length === 0) {
    if (!/fn:|n:|tel:/i.test(content)) {
      return [];
    }
    const lines = unfoldLines(content);
    return [mapCardLines(lines)];
  }

  const out: PickedDeviceContact[] = [];
  for (const block of cards) {
    const inner = block
      .replace(/^BEGIN:VCARD\r?\n?/i, "")
      .replace(/END:VCARD\r?\n?$/i, "");
    const lines = unfoldLines(inner);
    const row = mapCardLines(lines);
    if (row.name || row.phone) out.push(row);
  }
  return out;
}

function mapCardLines(lines: string[]): PickedDeviceContact {
  const { fn, n, tels } = cardLinesToMap(lines);
  const nameFromN = n ? parseNameFromN(n) : "";
  const name = (fn || nameFromN).trim();
  const phone = tels[0]?.trim();
  const displayName =
    name || phone || "";
  return {
    name: displayName,
    phone: phone || undefined,
  };
}
