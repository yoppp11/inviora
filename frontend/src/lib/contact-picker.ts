export type PickedContact = {
  name: string;
  phone: string;
};

type ContactProperty = 'name' | 'tel';

interface ContactAddress {
  tel?: string[];
}

interface ContactInfo {
  name?: string[];
  tel?: string[];
  address?: ContactAddress[];
}

interface ContactsManager {
  select(
    properties: ContactProperty[],
    options?: { multiple?: boolean }
  ): Promise<ContactInfo[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

export function isContactPickerSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    typeof navigator.contacts?.select === 'function'
  );
}

function pickFirst(values?: string[]): string | undefined {
  const value = values?.[0]?.trim();
  return value || undefined;
}

function pickPhone(contact: ContactInfo): string | undefined {
  const direct = pickFirst(contact.tel);
  if (direct) return direct;

  for (const address of contact.address ?? []) {
    const fromAddress = pickFirst(address.tel);
    if (fromAddress) return fromAddress;
  }

  return undefined;
}

export async function pickContact(): Promise<PickedContact> {
  if (!isContactPickerSupported()) {
    throw new Error('CONTACT_PICKER_UNSUPPORTED');
  }

  const contacts = await navigator.contacts!.select(['name', 'tel'], {
    multiple: false,
  });

  const contact = contacts[0];
  if (!contact) {
    throw new Error('CONTACT_PICKER_CANCELLED');
  }

  const name = pickFirst(contact.name);
  const phone = pickPhone(contact);

  if (!name) {
    throw new Error('CONTACT_NAME_MISSING');
  }
  if (!phone) {
    throw new Error('CONTACT_PHONE_MISSING');
  }

  return { name, phone };
}
