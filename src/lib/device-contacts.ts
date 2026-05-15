/** Contact Picker API (mainly Chrome/Android; often unsupported on iOS Safari). */

type ContactPickResult = {
  name?: string[];
  tel?: string[];
};

type ContactsManager = {
  select: (
    props: string[],
    opts?: { multiple?: boolean },
  ) => Promise<ContactPickResult[]>;
};

function getContactsApi(): ContactsManager | undefined {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as Navigator & { contacts?: ContactsManager };
  if (!nav.contacts || typeof nav.contacts.select !== "function") {
    return undefined;
  }
  return nav.contacts;
}

export type PickedDeviceContact = {
  name: string;
  phone?: string;
};

export function canUseDeviceContacts(): boolean {
  return Boolean(getContactsApi());
}

/**
 * Opens the OS contact picker when supported.
 * Requires a secure context (HTTPS or localhost) and user gesture.
 */
export async function pickDeviceContacts(): Promise<PickedDeviceContact[]> {
  const contacts = getContactsApi();
  if (!contacts) return [];

  try {
    const raw = await contacts.select(["name", "tel"], { multiple: true });
    const out: PickedDeviceContact[] = [];
    for (const c of raw) {
      const name =
        c.name
          ?.map((parts) => String(parts).trim())
          .filter(Boolean)
          .join(" ")
          .trim() ?? "";
      const telRaw =
        c.tel?.map((t) => t.trim()).filter(Boolean) ?? [];
      const phone = telRaw[0];
      const displayName = name || phone || "Unnamed contact";

      if (!displayName && !phone) continue;
      out.push({
        name: displayName,
        phone: phone || undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}
