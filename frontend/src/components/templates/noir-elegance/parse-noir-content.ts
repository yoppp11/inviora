import { noirEleganceSchema, type NoirEleganceContent } from './schema';

const LEGACY_VERSE_SOURCES = ['Matthew 19:6', 'Matthew'];
const LEGACY_STORY_DATES = [
  'FEBRUARY 2022',
  'AUGUST 2023',
  'JULY 2024',
  'EARLY 2024',
  'THROUGH 2024–2025',
];

function isLegacyVerse(content: NoirEleganceContent) {
  return (
    LEGACY_VERSE_SOURCES.some((marker) => content.verse.source.includes(marker)) ||
    content.verse.quote.includes('joined together') ||
    content.verse.quote.includes('one flesh')
  );
}

function isLegacyStory(content: NoirEleganceContent) {
  const dates = content.story.milestones.map((m) => m.date.toUpperCase());
  return (
    LEGACY_STORY_DATES.some((legacy) => dates.includes(legacy.toUpperCase())) ||
    content.story.milestones.some(
      (m) =>
        m.description.includes('We first met and everything changed') ||
        m.description.includes('We met for the first time in early 2024') ||
        m.description.includes('In 2026, we made a heartfelt decision') ||
        m.description.includes('Kami bertemu') ||
        m.description.includes('Sepanjang waktu, kami saling mendukung') ||
        m.description.includes('Pada tahun 2026, dengan penuh keyakinan')
    )
  );
}

function stripNulls<T>(value: T): T {
  if (value === null) {
    return undefined as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripNulls(item)) as T;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, stripNulls(nested)])
    ) as T;
  }
  return value;
}

export function getDefaultNoirContent(): NoirEleganceContent {
  return noirEleganceSchema.parse({});
}

export function parseNoirContent(raw: unknown): NoirEleganceContent {
  const parsed = noirEleganceSchema.parse(stripNulls(raw || {}));
  const defaults = getDefaultNoirContent();

  if (isLegacyVerse(parsed)) {
    parsed.verse = defaults.verse;
  }

  if (isLegacyStory(parsed)) {
    parsed.story = {
      ...parsed.story,
      title: defaults.story.title,
      milestones: defaults.story.milestones,
    };
  }

  return parsed;
}
