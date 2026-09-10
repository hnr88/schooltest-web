const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
// The design includes a six-week sample; keep weeks visible through a
// quarter, then express older values as month quantities.
const MONTH_BUCKET_MS = 90 * DAY_MS;

type RelativeTimeUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';

function calendarDay(value: Date): number {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
}

function localizedDay(value: -1 | 0, locale: string): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, 'day');
}

function formatElapsed(value: number, unit: RelativeTimeUnit, locale: string): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'short' }).format(-value, unit);
}

/**
 * Format a stored ISO instant using the schools list's compact vocabulary.
 * `now` is explicit so callers and tests never depend on a hidden clock.
 */
export function formatRelativeTime(
  instant: string | Date | null | undefined,
  now: Date,
  locale = 'en',
): string {
  if (instant === null || instant === undefined) return 'Never';

  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) return 'Never';

  const elapsed = Math.max(0, now.getTime() - date.getTime());
  // Durations win below six hours so the design's 30m/2h examples can coexist
  // with the coarser same-day "today" bucket.
  if (elapsed < HOUR_MS) {
    return formatElapsed(Math.max(1, Math.floor(elapsed / MINUTE_MS)), 'minute', locale);
  }
  if (elapsed < 6 * HOUR_MS) {
    return formatElapsed(Math.floor(elapsed / HOUR_MS), 'hour', locale);
  }

  const dayDelta = (calendarDay(now) - calendarDay(date)) / DAY_MS;
  if (dayDelta === 0) return localizedDay(0, locale);
  if (dayDelta === 1) return localizedDay(-1, locale);

  if (elapsed < WEEK_MS) return formatElapsed(Math.floor(elapsed / DAY_MS), 'day', locale);
  if (elapsed < MONTH_BUCKET_MS) return formatElapsed(Math.floor(elapsed / WEEK_MS), 'week', locale);
  return formatElapsed(Math.floor(elapsed / (30 * DAY_MS)), 'month', locale);
}
