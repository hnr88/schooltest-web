import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { TeacherNotificationsScreen } from '@/modules/notifications/components/TeacherNotificationsScreen';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// teacher/30 — the UNREAD DISTINCTION on the teacher feed, asserted over a
// CONSTRUCTED fixture so it cannot be vacuous.
//
// WHY IT LIVES HERE RATHER THAN ONLY IN THE E2E. The live arm of this property
// is at the mercy of the feed's own contents: the e2e counts whatever page 1
// happens to serve, so on a database whose visible page carried no unread row
// it would skip, and a skip asserts nothing. Here the rows are supplied, so
// N unread rows must produce N unread tiles and N mark-read controls — the
// count is a real expectation rather than a reading of the data. The shape
// mirrors ops/36's `portal-lists-kit.test.tsx` for the PARENT feed, which
// asserts the same three things about `bg-foreground` / `bg-divider` and the
// one-button-per-unread-row rule.
//
// What is real here is the kit wiring — the screen mounts the generic
// DirectoryTable and renders each row through the teacher feed item; only the
// data hooks are mocked, at their own boundary.

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children?: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard/teach/notifications',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/modules/dashboard', () => ({
  useDebouncedValue: (value: string) => value,
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/modules/notifications/queries/use-school-notifications.query', () => ({
  useSchoolNotificationsQuery: vi.fn(),
}));

vi.mock('@/modules/notifications/queries/use-mark-notification-read.mutation', () => ({
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { useSchoolNotificationsQuery } from '@/modules/notifications/queries/use-school-notifications.query';

const feedMock = useSchoolNotificationsQuery as unknown as ReturnType<typeof vi.fn>;

/** Two unread rows and one read row — the counts every assertion is stated against. */
const UNREAD_IN_FIXTURE = 2;
const READ_IN_FIXTURE = 1;

const ROWS = [
  {
    documentId: 'ntf-unread-0000000000000001',
    type: 'test_results_ready',
    title: 'Results ready for Year 7',
    body: 'Two sittings finished scoring.',
    link: '/dashboard/teach/results',
    read: false,
    createdAt: '2026-09-10T00:30:00.000Z',
  },
  {
    documentId: 'ntf-unread-0000000000000002',
    type: 'student_email_fix_requested',
    title: 'A carer email needs fixing',
    body: null,
    link: null,
    read: false,
    createdAt: '2026-09-09T23:00:00.000Z',
  },
  {
    documentId: 'ntf-read-00000000000000001',
    type: 'session_completed',
    title: 'A sitting was completed',
    body: 'Room 4, period 3.',
    link: null,
    read: true,
    createdAt: '2026-09-09T21:00:00.000Z',
  },
];

const FEED_OK = {
  data: {
    data: ROWS,
    meta: {
      // SERVER-supplied pagination — the screen is `mode: 'server'`, so the kit
      // must render the wire's own page meta rather than deriving it from the
      // length of the array it was handed.
      pagination: { page: 1, pageSize: 20, pageCount: 3, total: 41 },
      unreadCount: UNREAD_IN_FIXTURE,
    },
  },
  error: null,
  isError: false,
  isFetching: false,
  isPending: false,
  isLoading: false,
  isPlaceholderData: false,
  refetch: vi.fn(),
};

let host: HTMLElement | null = null;
let root: Root | null = null;

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.clearAllMocks();
});

function renderSurface(element: ReactElement): HTMLElement {
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
  return host;
}

describe('the teacher notification feed on the directory kit', () => {
  test('unread rows are visually distinct and each carries exactly one mark-read control', () => {
    feedMock.mockReturnValue(FEED_OK);
    const host = renderSurface(<TeacherNotificationsScreen />);

    const rows = host.querySelectorAll('[data-slot="school-notification-item"]');
    expect(rows.length).toBe(UNREAD_IN_FIXTURE + READ_IN_FIXTURE);

    const unread = host.querySelectorAll('[data-slot="school-notification-item"][data-read="false"]');
    const read = host.querySelectorAll('[data-slot="school-notification-item"][data-read="true"]');
    expect(unread.length).toBe(UNREAD_IN_FIXTURE);
    expect(read.length).toBe(READ_IN_FIXTURE);

    // COUNTED, not sampled: one mark-read control per unread row and none for a
    // read one. The e2e locates this button by the same accessible name.
    expect(host.querySelectorAll('button[aria-label="Mark as read"]').length).toBe(
      UNREAD_IN_FIXTURE,
    );

    // EVERY unread tile in a loop — a `.first()` check would pass while the
    // second row was styled read.
    unread.forEach((row, index) => {
      const tile = row.querySelector(':scope > span');
      expect(tile?.className, `unread row ${index} carries the unread tile weight`).toContain(
        'bg-foreground',
      );
    });

    // The other half of the distinction. Without it the test would pass if
    // every row were styled unread.
    const readTile = read[0]?.querySelector(':scope > span');
    expect(readTile?.className).toContain('bg-divider');
    expect(readTile?.className).not.toContain('bg-foreground');
  });

  test('the header states the unread count the wire reported, not the row count', () => {
    // 2 unread among 3 rendered rows, on a page of 41 total — three numbers
    // that cannot be confused for one another if the wiring is right.
    feedMock.mockReturnValue(FEED_OK);
    const host = renderSurface(<TeacherNotificationsScreen />);

    expect(host.querySelector('header')?.textContent).toContain('2 unread');
    expect(host.querySelector('[data-surface="teacher-notifications"]')).not.toBeNull();
  });

  test('a feed with no unread row offers no mark-read control at all', () => {
    // The negative control. The assertions above would also pass if the button
    // were rendered unconditionally, so a fixture with zero unread rows has to
    // produce zero controls.
    feedMock.mockReturnValue({
      ...FEED_OK,
      data: {
        data: ROWS.map((row) => ({ ...row, read: true })),
        meta: { ...FEED_OK.data.meta, unreadCount: 0 },
      },
    });
    const host = renderSurface(<TeacherNotificationsScreen />);

    expect(host.querySelectorAll('[data-slot="school-notification-item"]').length).toBe(
      UNREAD_IN_FIXTURE + READ_IN_FIXTURE,
    );
    expect(
      host.querySelectorAll('[data-slot="school-notification-item"][data-read="false"]').length,
    ).toBe(0);
    expect(host.querySelectorAll('button[aria-label="Mark as read"]').length).toBe(0);
  });
});
