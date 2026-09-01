import type { Metadata } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export function getSiteUrl() {
  return siteUrl.replace(/\/$/, '');
}

export const siteMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Inviora - Wedding Invitation Platform',
    template: '%s | Inviora',
  },
  description: 'Create and manage beautiful personalized wedding invitations',
  applicationName: 'Inviora',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Inviora',
    title: 'Inviora - Wedding Invitation Platform',
    description: 'Create and manage beautiful personalized wedding invitations',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inviora - Wedding Invitation Platform',
    description: 'Create and manage beautiful personalized wedding invitations',
  },
  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/logo.svg', type: 'image/svg+xml' }],
  },
};
