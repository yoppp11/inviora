const DEFAULT_API_URL = 'http://localhost:4000/api';

/**
 * Backend API base URL for browser and server code.
 * Prefer NEXT_API_URL in deployment (Vercel); next.config maps it for the client bundle.
 */
export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_API_URL ||
    DEFAULT_API_URL
  );
}
