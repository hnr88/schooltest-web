import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { SessionActivityPanel } from '@/modules/test-day/components/SessionActivityPanel';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// teacher/13 — the session activity panel, asserted over a CONSTRUCTED feed so
// the three note branches (truncated over the limit, plain appeals sentence,
// empty trail) and the composer's wire shape are real expectations rather than
// a reading of whatever the live sitting happens to serve. Only the data hooks
// are mocked, at their own boundary; the kit row (DotActivityRow) renders for
// real so the kind→dot-tone mapping is exercised.
vi.mock('@/modules/test-day/queries/use-sitting-activity.query', () => ({
  useSittingActivityQuery: vi.fn(),
}));

vi.mock('@/modules/test-day/queries/use-log-incident.mutation', () => ({
  useLogIncidentMutation: vi.fn(),
}));

import { useSittingActivityQuery } from '@/modules/test-day/queries/use-sitting-activity.query';
import { useLogIncidentMutation } from '@/modules/test-day/queries/use-log-incident.mutation';

const feedMock = useSittingActivityQuery as unknown as ReturnType<typeof vi.fn>;
const incidentMock = useLogIncidentMutation as unknown as ReturnType<typeof vi.fn>;

const mutate = vi.fn();

// Module-scope defaults so the very first render never sees an unstubbed hook;
// each test overrides through readyFeed.
feedMock.mockImplementation(() => ({ data: { entries: [], total: 0 }, isLoading: false, isError: false }));
incidentMock.mockImplementation(() => ({ mutate, isPending: false }));

function entry(n: number, kind: 'info' | 'warn' = 'warn') {
  return {
    occurred_at: new Date(Date.UTC(2026, 8, 10, 3, n, 0)).toISOString(),
    action: `QA incident ${n}`,
    actor_label: 'Amira Hassan',
    kind,
  };
}

let container: HTMLElement | null = null;
let root: Root | null = null;

function renderPanel(ui: ReactElement): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>,
    );
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
  feedMock.mockReset();
  incidentMock.mockReset();
  mutate.mockReset();
});

function readyFeed(entries: unknown[], total: number) {
  feedMock.mockImplementation(() => ({ data: { entries, total }, isLoading: false, isError: false }));
  incidentMock.mockImplementation(() => ({ mutate, isPending: false }));
}

describe('SessionActivityPanel (teacher/13)', () => {
  test('over the limit: exactly 8 rows, the truncation note names shown and total, newest first', () => {
    // The SERVER truncates: the default read serves the newest 8 with total
    // over the whole trail. The fixture mirrors that wire truth.
    const newestEight = Array.from({ length: 8 }, (_, i) => entry(9 - i));
    readyFeed(newestEight, 9);
    const dom = renderPanel(<SessionActivityPanel sittingDocumentId="sit-1" scope="sitting" />);
    const rows = dom.querySelectorAll('[data-slot="dot-activity-row"]');
    expect(rows).toHaveLength(8);
    // Newest first: the first rendered row carries the newest action.
    expect(rows[0].textContent).toContain('QA incident 9');
    expect(rows[7].textContent).toContain('QA incident 2');
    expect(dom.textContent).toContain('Showing the last 8 of 9 entries');
    expect(dom.textContent).not.toContain('nothing has happened');
  });

  test('under the limit: every entry renders and the plain appeals note shows', () => {
    readyFeed([entry(1), entry(2, 'info'), entry(3)], 3);
    const dom = renderPanel(<SessionActivityPanel sittingDocumentId="sit-1" scope="sitting" />);
    expect(dom.querySelectorAll('[data-slot="dot-activity-row"]')).toHaveLength(3);
    expect(dom.textContent).toContain('The full trail is kept with the session for appeals.');
    expect(dom.textContent).not.toContain('Showing the last');
  });

  test('empty trail: the empty body renders, no rows, no notes', () => {
    readyFeed([], 0);
    const dom = renderPanel(<SessionActivityPanel sittingDocumentId="sit-1" scope="sitting" />);
    expect(dom.querySelectorAll('[data-slot="dot-activity-row"]')).toHaveLength(0);
    expect(dom.textContent).toContain('Nothing has happened in this sitting yet.');
  });

  test('kind reaches the dot colour: warn rows carry the warning tone dot', () => {
    readyFeed([entry(1, 'warn'), entry(2, 'info')], 2);
    const dom = renderPanel(<SessionActivityPanel sittingDocumentId="sit-1" scope="sitting" />);
    const dots = dom.querySelectorAll('[data-slot="dot-activity-row"] span[aria-hidden="true"]');
    expect(dots[0].className).toContain('bg-warning');
    expect(dots[1].className).toContain('bg-primary');
  });

  test('the composer posts the typed note as a warn incident with the sitting scope', () => {
    readyFeed([entry(1)], 1);
    const dom = renderPanel(<SessionActivityPanel sittingDocumentId="sit-42" scope="sitting" />);
    const open = [...dom.querySelectorAll('button')].find((b) => b.textContent === 'Log an incident');
    expect(open).toBeDefined();
    act(() => open!.click());
    const textarea = dom.querySelector('textarea');
    expect(textarea).not.toBeNull();
    act(() => {
      // React controlled input: set through the native setter so the
      // synthetic onChange actually fires.
      const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      set.call(textarea, 'Device swapped mid-test');
      textarea!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const submit = [...dom.querySelectorAll('button')].find(
      (b) => b.textContent === 'Log an incident' && b !== open,
    );
    act(() => submit!.click());
    expect(mutate).toHaveBeenCalledWith(
      { sittingDocumentId: 'sit-42', note: 'Device swapped mid-test', kind: 'warn' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
