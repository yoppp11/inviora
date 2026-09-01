export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EVENT_OWNER';
  createdAt: string;
}

export interface AdminUser extends User {
  _count?: { weddingEvents: number };
}

export interface WeddingEvent {
  id: string;
  userId: string;
  title: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  ceremonyTime: string | null;
  receptionTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  mapUrl: string | null;
  openingText: string | null;
  closingText: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  templateConfig?: TemplateConfig | null;
  media?: Media[];
  _count?: { guests: number };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Guest {
  id: string;
  weddingEventId: string;
  name: string;
  address: string | null;
  invitationToken: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplateKey = 'elegant' | 'minimal' | 'floral' | 'noir-elegance';

export interface TemplateConfigData {
  heroImage?: string | null;
  bridePhoto?: string | null;
  groomPhoto?: string | null;
  coupleImage?: string | null;
  backgroundImage?: string | null;
  gallery?: string[] | null;
  openingText?: string | null;
  closingText?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontFamily?: string | null;
  musicEnabled?: boolean | null;
  musicUrl?: string | null;
  noirContent?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface TemplateConfig {
  id: string;
  weddingEventId: string;
  templateKey: TemplateKey;
  config: TemplateConfigData;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  weddingEventId: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  width: number | null;
  height: number | null;
  category: string | null;
  createdAt: string;
}

export interface InvitationData {
  event: {
    title: string;
    slug: string;
    groomName: string;
    brideName: string;
    weddingDate: string;
    ceremonyTime: string | null;
    receptionTime: string | null;
    venueName: string | null;
    venueAddress: string | null;
    mapUrl: string | null;
    openingText: string | null;
    closingText: string | null;
  };
  guest: {
    name: string;
    address: string | null;
  };
  template: {
    key: TemplateKey;
    config: TemplateConfigData;
  };
  media: Array<{
    id: string;
    secureUrl: string;
    category: string | null;
    width: number | null;
    height: number | null;
  }>;
  invitationMeta?: {
    eventSlug: string;
    guestToken: string;
  };
  hasTransferConfirmation?: boolean;
}

export interface TransferConfirmation {
  id: string;
  guestName: string;
  senderName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: string | number | null;
  transferDate: string | null;
  notes: string | null;
  proofImageUrl: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface CsvImportResult {
  imported?: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  guests?: Array<{ name: string; address: string | null }>;
}
