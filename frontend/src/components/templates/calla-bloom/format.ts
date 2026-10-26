const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum\u2019at", 'Sabtu'];
const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad2 = (n: number) => String(n).padStart(2, '0');

export interface DateParts {
  year: number;
  month: number; // 0-11
  day: number;
  weekday: number; // 0-6, Sunday first
}

/**
 * Parses the wedding date without shifting it across time zones: for ISO strings the
 * calendar date written in the string is used as-is.
 */
export function parseDateParts(value: string | null | undefined): DateParts | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
    return { year, month, day, weekday };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    weekday: date.getDay(),
  };
}

/** "Jum’at, 11 September 2026" */
export function formatLongDateId(parts: DateParts | null): string {
  if (!parts) return '';
  return `${DAYS_ID[parts.weekday]}, ${parts.day} ${MONTHS_ID[parts.month]} ${parts.year}`;
}

/** "11.09.26" */
export function formatShortDate(parts: DateParts | null): string {
  if (!parts) return '';
  return `${pad2(parts.day)}.${pad2(parts.month + 1)}.${pad2(parts.year % 100)}`;
}

export function monthNameEn(parts: DateParts | null): string {
  return parts ? MONTHS_EN[parts.month] : '';
}

/** "Jam 09.00 WIB" from "09:00", "9.00", "09:00 WIB"; any other text is shown as-is. */
export function formatTimeId(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  const match = /^(\d{1,2})[:.](\d{2})(?:\s*(WIB|WITA|WIT))?$/i.exec(trimmed);
  if (match) {
    return `Jam ${pad2(Number(match[1]))}.${match[2]} ${(match[3] || 'WIB').toUpperCase()}`;
  }
  return trimmed;
}

export interface CalendarCell {
  day: number | null;
}

/** Sunday-first month grid rows (weeks) for the given month. */
export function buildCalendar(parts: DateParts): CalendarCell[][] {
  const first = new Date(Date.UTC(parts.year, parts.month, 1)).getUTCDay();
  const total = new Date(Date.UTC(parts.year, parts.month + 1, 0)).getUTCDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < first; i += 1) cells.push({ day: null });
  for (let d = 1; d <= total; d += 1) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export { pad2 };
