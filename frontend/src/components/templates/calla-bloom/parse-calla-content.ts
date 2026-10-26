import { callaBloomSchema, type CallaBloomContent } from './schema';

function stripNulls<T>(value: T): T {
  if (value === null) return undefined as T;
  if (Array.isArray(value)) return value.map((item) => stripNulls(item)) as T;
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, stripNulls(nested)])
    ) as T;
  }
  return value;
}

export function getDefaultCallaContent(): CallaBloomContent {
  return callaBloomSchema.parse({});
}

export function parseCallaContent(raw: unknown): CallaBloomContent {
  const result = callaBloomSchema.safeParse(stripNulls(raw || {}));
  return result.success ? result.data : getDefaultCallaContent();
}
