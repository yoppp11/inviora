import { prisma } from '../../services/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';
import { generateInvitationToken } from '../../utils/token';
import { CreateGuestInput, UpdateGuestInput } from './guest.schema';
import { assertWeddingAccess } from '../../lib/wedding-access';
import Papa from 'papaparse';

async function verifyWeddingAccess(weddingId: string, userId: string, role: string) {
  await assertWeddingAccess(weddingId, userId, role);
}

export async function listGuests(weddingId: string, userId: string, role: string) {
  await verifyWeddingAccess(weddingId, userId, role);

  return prisma.guest.findMany({
    where: { weddingEventId: weddingId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createGuest(
  weddingId: string,
  userId: string,
  role: string,
  input: CreateGuestInput
) {
  await verifyWeddingAccess(weddingId, userId, role);

  const token = generateInvitationToken();

  return prisma.guest.create({
    data: {
      weddingEventId: weddingId,
      name: input.name,
      address: input.address ?? null,
      invitationToken: token,
    },
  });
}

export async function updateGuest(
  weddingId: string,
  guestId: string,
  userId: string,
  role: string,
  input: UpdateGuestInput
) {
  await verifyWeddingAccess(weddingId, userId, role);

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, weddingEventId: weddingId },
  });

  if (!guest) {
    throw new NotFoundError('Guest not found');
  }

  return prisma.guest.update({
    where: { id: guestId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.address !== undefined && { address: input.address ?? null }),
    },
  });
}

export async function deleteGuest(
  weddingId: string,
  guestId: string,
  userId: string,
  role: string
) {
  await verifyWeddingAccess(weddingId, userId, role);

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, weddingEventId: weddingId },
  });

  if (!guest) {
    throw new NotFoundError('Guest not found');
  }

  await prisma.guest.delete({ where: { id: guestId } });
}

interface CsvRow {
  name?: string;
  address?: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  validRows: number;
  invalidRows: number;
  errors: ImportError[];
  guests: Array<{ name: string; address: string | null }>;
}

export async function parseCsvImport(csvContent: string): Promise<ImportResult> {
  const parsed = Papa.parse<CsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (!parsed.meta.fields?.includes('name')) {
    throw new ValidationError('CSV must contain a "name" column');
  }

  const errors: ImportError[] = [];
  const validGuests: Array<{ name: string; address: string | null }> = [];

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2; // +2 for 1-indexed + header row
    const name = row.name?.trim();
    const address = row.address?.trim();

    if (!name) {
      errors.push({
        row: rowNum,
        field: 'name',
        message: 'Guest name is required',
      });
      return;
    }

    if (name.length > 200) {
      errors.push({
        row: rowNum,
        field: 'name',
        message: 'Guest name must be 200 characters or less',
      });
      return;
    }

    validGuests.push({
      name,
      address: address || null,
    });
  });

  return {
    validRows: validGuests.length,
    invalidRows: errors.length,
    errors,
    guests: validGuests,
  };
}

export async function importGuests(
  weddingId: string,
  userId: string,
  role: string,
  csvContent: string
) {
  await verifyWeddingAccess(weddingId, userId, role);

  const parseResult = await parseCsvImport(csvContent);

  if (parseResult.validRows === 0) {
    throw new ValidationError('No valid rows found in CSV', parseResult.errors);
  }

  const guestsData = parseResult.guests.map((guest) => ({
    weddingEventId: weddingId,
    name: guest.name,
    address: guest.address,
    invitationToken: generateInvitationToken(),
  }));

  await prisma.guest.createMany({ data: guestsData });

  return {
    imported: parseResult.validRows,
    invalidRows: parseResult.invalidRows,
    errors: parseResult.errors,
  };
}
