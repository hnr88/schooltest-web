import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from '@/modules/ops/lib/relative-time';

const NOW = new Date('2026-01-15T12:00:00.000Z');
const ago = (milliseconds: number): string => new Date(NOW.getTime() - milliseconds).toISOString();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const expected = (value: number, unit: Intl.RelativeTimeFormatUnit, locale = 'en'): string =>
  new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'short' }).format(-value, unit);
const calendarExpected = (value: -1 | 0, locale = 'en'): string =>
  new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, 'day');

describe('formatRelativeTime', () => {
  it('keeps the design calendar-day vocabulary and the null sentinel', () => {
    expect(formatRelativeTime(null, NOW, 'en')).toBe('Never');
    expect(formatRelativeTime(ago(1 * HOUR), NOW, 'en')).toBe(expected(1, 'hour'));
    expect(formatRelativeTime(ago(6 * HOUR + 1), NOW, 'en')).toBe(calendarExpected(0));
    expect(formatRelativeTime(ago(24 * HOUR), NOW, 'en')).toBe(calendarExpected(-1));
    expect(formatRelativeTime(ago(2 * DAY), NOW, 'en')).toBe(expected(2, 'day'));
  });

  it('asserts both sides of the minute, hour, day, week, and month cuts', () => {
    expect(formatRelativeTime(ago(59 * MINUTE), NOW, 'en')).toBe(expected(59, 'minute'));
    expect(formatRelativeTime(ago(61 * MINUTE), NOW, 'en')).toBe(expected(1, 'hour'));
    expect(formatRelativeTime(ago(5 * HOUR + 59 * MINUTE), NOW, 'en')).toBe(expected(5, 'hour'));
    expect(formatRelativeTime(ago(6 * HOUR + 1 * MINUTE), NOW, 'en')).toBe(calendarExpected(0));
    expect(formatRelativeTime(ago(6 * DAY), NOW, 'en')).toBe(expected(6, 'day'));
    expect(formatRelativeTime(ago(8 * DAY), NOW, 'en')).toBe(expected(1, 'week'));
    expect(formatRelativeTime(ago(89 * DAY), NOW, 'en')).toBe(expected(12, 'week'));
    expect(formatRelativeTime(ago(91 * DAY), NOW, 'en')).toBe(expected(3, 'month'));
  });

  it('covers the design examples without depending on the wall clock', () => {
    expect(formatRelativeTime(ago(2 * HOUR), NOW, 'en')).toBe(expected(2, 'hour'));
    expect(formatRelativeTime(ago(30 * MINUTE), NOW, 'en')).toBe(expected(30, 'minute'));
    expect(formatRelativeTime(ago(4 * DAY), NOW, 'en')).toBe(expected(4, 'day'));
    expect(formatRelativeTime(ago(6 * 7 * DAY), NOW, 'en')).toBe(expected(6, 'week'));
    expect(formatRelativeTime(ago(11 * 30 * DAY), NOW, 'en')).toBe(expected(11, 'month'));
  });

  it('localizes non-Latin output without snapshotting platform wording', () => {
    const arabic = formatRelativeTime(ago(2 * HOUR), NOW, 'ar');
    expect(arabic).not.toBe('2h ago');
    expect(arabic.length).toBeGreaterThan(0);
    expect(formatRelativeTime(ago(1 * HOUR), NOW, 'ar')).not.toBe('today');
  });
});
