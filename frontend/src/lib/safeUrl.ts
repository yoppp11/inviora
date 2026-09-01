const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'tel:', 'mailto:'];
const RELATIVE_BASE = 'https://invitation.invalid/';

export function getSafeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const sanitized = url.trim();
  if (sanitized === '') return undefined;

  try {
    const { protocol } = new URL(sanitized, RELATIVE_BASE);
    if (!SAFE_URL_PROTOCOLS.includes(protocol)) return undefined;
  } catch {
    return undefined;
  }

  return sanitized;
}
