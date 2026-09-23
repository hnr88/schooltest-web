import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import viMessages from '@/i18n/messages/vi.json';
import { SchedulePanel } from '@/modules/teacher/components/start-session/SchedulePanel';
import type { TimeZoneSource } from '@/modules/teacher/types/start-session-modal.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

function zoneNote(locale: 'en' | 'vi', timeZoneSource: TimeZoneSource): string {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale={locale} messages={locale === 'en' ? enMessages : viMessages} timeZone="UTC">
        <SchedulePanel
          date="2026-09-24"
          opens="09:00"
          closes="10:00"
          timeLimit={40}
          timeZone="Australia/Melbourne"
          timeZoneSource={timeZoneSource}
          errors={[]}
          serverMessages={[]}
          onDate={() => {}}
          onOpens={() => {}}
          onCloses={() => {}}
        />
      </NextIntlClientProvider>,
    );
  });
  return host.querySelector('[data-slot="start-session-schedule-zone"]')?.textContent ?? '';
}

describe('BUG-002 follow-up — the schedule zone note', () => {
  test("the school's zone reads as a friendly name plus its IANA id, called the school's", () => {
    expect(zoneNote('en', 'school')).toBe(
      "Times are in Australian Eastern Time (Australia/Melbourne), the school's time zone.",
    );
  });

  test("the device fallback is never called the school's time zone", () => {
    const note = zoneNote('en', 'device');
    expect(note).toBe(
      "Times are in Australian Eastern Time (Australia/Melbourne), this device's time zone, because the school's time zone isn't available.",
    );
    expect(note).not.toContain("the school's time zone.");
  });

  test('another locale gets its own zone name, not the raw IANA id', () => {
    expect(zoneNote('vi', 'school')).toBe(
      'Thời gian tính theo Giờ Miền Đông Australia (Australia/Melbourne), múi giờ của trường.',
    );
    expect(zoneNote('vi', 'device')).toContain('múi giờ của thiết bị này');
  });
});
