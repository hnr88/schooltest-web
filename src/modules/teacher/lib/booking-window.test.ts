import { describe, expect, test } from 'vitest';

import { bookingWindowView } from '@/modules/teacher/lib/booking-window';

// C-TS-2 `window` (chunk B1b): opens/closes as instants plus the school's zone.
// Literal instants in, literal labels out — the card prints what these return.
const BOOKED = {
  opens_at: '2026-09-03T23:15:00.000Z',
  closes_at: '2026-09-04T00:15:00.000Z',
  timezone: 'Australia/Sydney',
};

describe('bookingWindowView', () => {
  test('English reads as the design draws it, in the school zone', () => {
    expect(bookingWindowView(BOOKED, 'en', new Date('2026-09-11T02:00:00Z'))).toEqual({
      date: 'Fri 4 Sep',
      start: '09:15',
      end: '10:15',
      isToday: false,
    });
  });

  test('"today" is the school-zone day, not the UTC day', () => {
    // 01:00 on Fri 4 Sep in Sydney is still Thu 3 Sep in UTC.
    expect(bookingWindowView(BOOKED, 'en', new Date('2026-09-03T15:00:00Z')).isToday).toBe(true);
    // 23:00 on Thu 3 Sep in Sydney.
    expect(bookingWindowView(BOOKED, 'en', new Date('2026-09-03T13:00:00Z')).isToday).toBe(false);
  });

  test('other locales keep their own date form and the 24-hour window', () => {
    expect(bookingWindowView(BOOKED, 'ko', new Date('2026-09-11T02:00:00Z'))).toMatchObject({
      date: '9월 4일 (금)',
      start: '09:15',
      end: '10:15',
    });
  });
});
