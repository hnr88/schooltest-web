import type { BookingWindowView } from '@/modules/teacher/types/live-sessions.types';
import type { TestSessionBookedWindow } from '@/modules/teacher/types/teacher-session.types';

const DATE_PARTS: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };

function dateLabel(value: Date, locale: string, timeZone: string): string {
  if (locale !== 'en') {
    return new Intl.DateTimeFormat(locale, { ...DATE_PARTS, timeZone }).format(value);
  }
  // The design's English date is "Fri 4 Sep": weekday, day, month, no comma.
  const parts = new Intl.DateTimeFormat('en-US', { ...DATE_PARTS, timeZone }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('weekday')} ${part('day')} ${part('month')}`;
}

/** A booking's day, opens–closes and whether it is today — all read in the school's zone. */
export function bookingWindowView(
  booked: TestSessionBookedWindow,
  locale: string,
  now: Date,
): BookingWindowView {
  const timeZone = booked.timezone;
  const opens = new Date(booked.opens_at);
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
  const day = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
  return {
    date: dateLabel(opens, locale, timeZone),
    start: time.format(opens),
    end: time.format(new Date(booked.closes_at)),
    isToday: day.format(opens) === day.format(now),
  };
}
