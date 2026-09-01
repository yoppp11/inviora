import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock prisma
vi.mock('../services/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    weddingEvent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    guest: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    weddingTemplateConfig: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    media: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-testing-only',
    JWT_EXPIRES_IN: '7d',
    NODE_ENV: 'test',
    PORT: 4000,
    CORS_ORIGIN: ['http://localhost:3000'],
    CLOUDINARY_CLOUD_NAME: 'test',
    CLOUDINARY_API_KEY: 'test',
    CLOUDINARY_API_SECRET: 'test',
  },
}));

import { authenticate } from '../middleware/authenticate';
import { authorizeWeddingOwner } from '../middleware/authorize';
import { generateAccessToken } from '../utils/token';
import { prisma } from '../services/prisma';

describe('Authentication Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = vi.fn();
  });

  it('should reject requests without authorization header', () => {
    expect(() => {
      authenticate(mockReq as Request, mockRes as Response, mockNext);
    }).toThrow('Authentication required');
  });

  it('should reject requests with invalid token', () => {
    mockReq.headers = { authorization: 'Bearer invalid-token' };
    expect(() => {
      authenticate(mockReq as Request, mockRes as Response, mockNext);
    }).toThrow('Invalid or expired token');
  });

  it('should accept valid token and attach user to request', () => {
    const token = generateAccessToken({ userId: 'user-1', role: 'EVENT_OWNER' });
    mockReq.headers = { authorization: `Bearer ${token}` };

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user?.userId).toBe('user-1');
    expect(mockReq.user?.role).toBe('EVENT_OWNER');
  });

  it('should reject request without Bearer prefix', () => {
    const token = generateAccessToken({ userId: 'user-1', role: 'EVENT_OWNER' });
    mockReq.headers = { authorization: token };
    expect(() => {
      authenticate(mockReq as Request, mockRes as Response, mockNext);
    }).toThrow('Authentication required');
  });
});

describe('Wedding Ownership Authorization', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      params: { weddingId: 'wedding-1' } as any,
      user: { userId: 'user-1', role: 'EVENT_OWNER' },
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  it('should allow owner to access their wedding', async () => {
    (prisma.weddingEvent.findUnique as any).mockResolvedValue({
      userId: 'user-1',
    });

    const middleware = authorizeWeddingOwner();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow admin to access any wedding', async () => {
    (prisma.weddingEvent.findUnique as any).mockResolvedValue({
      userId: 'user-2',
    });

    mockReq.user = { userId: 'admin-1', role: 'ADMIN' };

    const middleware = authorizeWeddingOwner();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should deny access to another users wedding (IDOR)', async () => {
    (prisma.weddingEvent.findUnique as any).mockResolvedValue({
      userId: 'user-2',
    });

    const middleware = authorizeWeddingOwner();

    await expect(
      middleware(mockReq as Request, mockRes as Response, mockNext)
    ).rejects.toThrow('You do not have access to this event');
  });

  it('should return 404 for non-existent wedding', async () => {
    (prisma.weddingEvent.findUnique as any).mockResolvedValue(null);

    const middleware = authorizeWeddingOwner();

    await expect(
      middleware(mockReq as Request, mockRes as Response, mockNext)
    ).rejects.toThrow('Wedding event not found');
  });
});

describe('Invitation Token Security', () => {
  it('should generate tokens with sufficient entropy', async () => {
    const { generateInvitationToken } = await import('../utils/token');

    const token1 = generateInvitationToken();
    const token2 = generateInvitationToken();

    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThanOrEqual(20);
    expect(token2.length).toBeGreaterThanOrEqual(20);
  });

  it('should not contain sequential patterns', async () => {
    const { generateInvitationToken } = await import('../utils/token');

    const tokens = Array.from({ length: 100 }, () => generateInvitationToken());
    const uniqueTokens = new Set(tokens);

    expect(uniqueTokens.size).toBe(100);
  });
});

describe('Slug Validation', () => {
  it('should accept valid slugs', async () => {
    const { validateSlug } = await import('../utils/slug');

    expect(validateSlug('john-and-jane')).toBe(true);
    expect(validateSlug('wedding2024')).toBe(true);
    expect(validateSlug('a')).toBe(true);
  });

  it('should reject invalid slugs', async () => {
    const { validateSlug } = await import('../utils/slug');

    expect(validateSlug('John-Jane')).toBe(false);
    expect(validateSlug('john--jane')).toBe(false);
    expect(validateSlug('-john')).toBe(false);
    expect(validateSlug('john-')).toBe(false);
    expect(validateSlug('john jane')).toBe(false);
    expect(validateSlug('')).toBe(false);
  });

  it('should generate valid slugs from text', async () => {
    const { generateSlug, validateSlug } = await import('../utils/slug');

    expect(validateSlug(generateSlug('John and Jane'))).toBe(true);
    expect(generateSlug('Hello   World')).toBe('hello-world');
    expect(generateSlug('  trim me  ')).toBe('trim-me');
  });
});

describe('CSV Import Validation', () => {
  it('should parse valid CSV correctly', async () => {
    const { parseCsvImport } = await import('../modules/guest/guest.service');

    const csv = `name,address
Budi Santoso,Jakarta Selatan
Siti Rahma,Bandung`;

    const result = await parseCsvImport(csv);
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(0);
    expect(result.guests).toHaveLength(2);
    expect(result.guests[0].name).toBe('Budi Santoso');
  });

  it('should detect missing name header', async () => {
    const { parseCsvImport } = await import('../modules/guest/guest.service');

    const csv = `fullname,address
Budi,Jakarta`;

    await expect(parseCsvImport(csv)).rejects.toThrow(
      'CSV must contain a "name" column'
    );
  });

  it('should report empty name as invalid', async () => {
    const { parseCsvImport } = await import('../modules/guest/guest.service');

    const csv = `name,address
Budi Santoso,Jakarta
,Bandung
Andi,Surabaya`;

    const result = await parseCsvImport(csv);
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(1);
    expect(result.errors[0].row).toBe(3);
    expect(result.errors[0].field).toBe('name');
  });

  it('should handle partially invalid CSV', async () => {
    const { parseCsvImport } = await import('../modules/guest/guest.service');

    const csv = `name,address
Valid Name,Jakarta
,
Another Valid,Bandung
,Missing`;

    const result = await parseCsvImport(csv);
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(2);
  });

  it('should handle CSV with only headers', async () => {
    const { parseCsvImport } = await import('../modules/guest/guest.service');

    const csv = `name,address`;

    const result = await parseCsvImport(csv);
    expect(result.validRows).toBe(0);
    expect(result.invalidRows).toBe(0);
  });
});

describe('Public Invitation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 for invalid event slug', async () => {
    (prisma.weddingEvent.findUnique as any).mockResolvedValue(null);

    const { getInvitation } = await import(
      '../modules/invitation/invitation.service'
    );

    await expect(getInvitation('invalid-slug', 'any-token')).rejects.toThrow(
      'Invitation not found'
    );
  });

  it('should return 404 for invalid guest token', async () => {
    (prisma.weddingEvent.findUnique as any).mockResolvedValue({
      id: 'wedding-1',
      title: 'Test Wedding',
      slug: 'test-wedding',
      groomName: 'Groom',
      brideName: 'Bride',
      weddingDate: new Date(),
      ceremonyTime: null,
      receptionTime: null,
      venueName: null,
      venueAddress: null,
      mapUrl: null,
      openingText: null,
      closingText: null,
      templateConfig: null,
      media: [],
    });

    (prisma.guest.findFirst as any).mockResolvedValue(null);

    const { getInvitation } = await import(
      '../modules/invitation/invitation.service'
    );

    await expect(
      getInvitation('test-wedding', 'invalid-token')
    ).rejects.toThrow('Invitation not found');
  });

  it('should return public data for valid slug+token pair', async () => {
    (prisma.weddingEvent.findUnique as any).mockResolvedValue({
      id: 'wedding-1',
      title: 'Test Wedding',
      slug: 'test-wedding',
      groomName: 'Groom',
      brideName: 'Bride',
      weddingDate: new Date('2025-06-15'),
      ceremonyTime: '10:00 AM',
      receptionTime: '12:00 PM',
      venueName: 'Grand Hall',
      venueAddress: 'Jakarta',
      mapUrl: null,
      openingText: 'Welcome',
      closingText: 'Thank you',
      templateConfig: { templateKey: 'elegant', config: {} },
      media: [],
    });

    (prisma.guest.findFirst as any).mockResolvedValue({
      name: 'Budi',
      address: 'Jakarta Selatan',
    });

    const { getInvitation } = await import(
      '../modules/invitation/invitation.service'
    );

    const result = await getInvitation('test-wedding', 'valid-token');

    expect(result.event.title).toBe('Test Wedding');
    expect(result.guest.name).toBe('Budi');
    expect(result.guest.address).toBe('Jakarta Selatan');
    expect(result.template.key).toBe('elegant');

    // Should NOT expose internal IDs or user data
    expect((result as any).event.id).toBeUndefined();
    expect((result as any).event.userId).toBeUndefined();
  });
});

describe('Validation Middleware', () => {
  it('should reject invalid body data', async () => {
    const { validate } = await import('../middleware/validate');
    const { z } = await import('zod');

    const schema = z.object({ name: z.string().min(1) });
    const middleware = validate({ body: schema });

    const req = { body: { name: '' } } as Request;
    const res = {} as Response;
    const next = vi.fn();

    expect(() => middleware(req, res, next)).toThrow('Validation failed');
  });
});
