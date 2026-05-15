/** Contact Picker API — see `getContactPickerSnapshot()` + `subscribeContactPickerAvailability()`. */

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

export type ContactPickerAvailability =
  | { available: true }
  | {
      available: false;
      reason: "insecure" | "unsupported";
      /** Short hint for UI */
      hint: string;
    };

/** Stable references — useSyncExternalStore requires cached snapshots (esp. getServerSnapshot). */
export const SERVER_CONTACT_PICKER_SNAPSHOT: ContactPickerAvailability =
  Object.freeze({
    available: false,
    reason: "unsupported",
    hint: "",
  });

const CONTACT_PICKER_AVAILABLE: ContactPickerAvailability = Object.freeze({
  available: true,
});

const CONTACT_PICKER_INSECURE: ContactPickerAvailability = Object.freeze({
  available: false,
  reason: "insecure",
  hint: "Use HTTPS (or https://localhost). Plain http:// blocks the contact picker.",
});

const CONTACT_PICKER_UNSUPPORTED: ContactPickerAvailability = Object.freeze({
  available: false,
  reason: "unsupported",
  hint: "Not available in this browser. Try Chrome on Android, or import a .vcf file from your phone’s Contacts app (export/share).",
});

function computeContactPickerAvailability(): ContactPickerAvailability {
  if (!window.isSecureContext) {
    return CONTACT_PICKER_INSECURE;
  }
  if (getContactsApi()) {
    return CONTACT_PICKER_AVAILABLE;
  }
  return CONTACT_PICKER_UNSUPPORTED;
}

let clientContactPickerProbed = false;

/**
 * Lets React read real `navigator.contacts` after the first client tick so SSR /
 * hydration snapshots match (see `useSyncExternalStore`).
 */
export function subscribeContactPickerAvailability(
  onStoreChange: () => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }
  queueMicrotask(() => {
    clientContactPickerProbed = true;
    onStoreChange();
  });
  return () => {};
}

export function getContactPickerSnapshot(): ContactPickerAvailability {
  if (typeof window === "undefined") {
    return SERVER_CONTACT_PICKER_SNAPSHOT;
  }
  if (!clientContactPickerProbed) {
    return SERVER_CONTACT_PICKER_SNAPSHOT;
  }
  return computeContactPickerAvailability();
}

export function getContactPickerAvailability(): ContactPickerAvailability {
  if (typeof window === "undefined") {
    return SERVER_CONTACT_PICKER_SNAPSHOT;
  }
  return computeContactPickerAvailability();
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
