import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { SessionSettingsModal } from '@/modules/teacher/components/SessionSettingsModal';

import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// teacher/11's S18 follow-up (orchestrator job, chat-82263167): the settings
// labels must render as REAL STRINGS. next-intl resolves a dotted LOOKUP as
// NESTING, so a flat key like "rows.lowBw.label" in the catalogue is an
// INVALID_KEY error at access time and the row renders the key path instead
// of the design's label. This test asserts the rendered STRING, so a malformed
// catalogue cannot pass.
//
// settings={null} deliberately exercises the defaults arm (D-34 handoff): the
// modal must render a full list even when the served column is null.

let root: Root | null = null;
let host: HTMLElement | null = null;

function render(element: ReactElement): void {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
        {element}
      </NextIntlClientProvider>,
    );
  });
}

const openModal = (settings: SittingSettings | null = null) => (
  <SessionSettingsModal open onClose={vi.fn()} settings={settings} />
);

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  host?.remove();
  root = null;
  host = null;
});

describe('SessionSettingsModal — the settings labels render as real strings', () => {
  test('the low-bandwidth row shows the design label, not a key path', () => {
    render(openModal());
    expect(document.body.textContent).toContain('Low-bandwidth mode');
  });

  test('every row renders a label that is not a dotted key path', () => {
    render(openModal());
    const rows = document.body.querySelectorAll('[data-slot="session-settings-row"]');
    expect(rows.length).toBe(11);
    for (const row of rows) {
      const text = row.textContent ?? '';
      expect(text.includes('rows.'), `a key path leaked into a row: ${text.slice(0, 80)}`).toBe(false);
    }
  });

  test('the time-limit row renders the served minutes, not a key path', () => {
    render(openModal());
    const text = document.body.textContent ?? '';
    expect(text).toContain('Time limit');
    expect(text).toContain('40 min');
    expect(text.includes('rows.timeLimit')).toBe(false);
  });
});
