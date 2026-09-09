import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { ArticlesList } from '@/modules/articles/components/ArticlesList';
import { NotificationFeedList } from '@/modules/notifications/components/NotificationFeedList';
import { ReportListScreen } from '@/modules/report/components/ReportListScreen';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// ops/36 — the three parent-portal lists ON the generic directory kit. The
// data hooks are mocked at their own boundary (their fetch/parse contracts are
// owned by the wire-capture and e2e specs); what is REAL here is the kit
// wiring: useDirectoryState in client mode, applyClientDirectoryMode, the
// toolbar states, and the row rendering contracts the e2e specs select on.

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children?: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// The kit's search box debounce is timing behaviour owned elsewhere; the spec
// asserts the settled filter semantics, not the debounce.
vi.mock('@/modules/dashboard', () => ({
  useDebouncedValue: (value: string) => value,
}));

vi.mock('@/modules/report/queries/use-my-student-results.query', () => ({
  useMyStudentResultsQuery: vi.fn(),
}));

vi.mock('@/modules/notifications/queries/use-notifications.query', () => ({
  useNotificationsQuery: vi.fn(),
}));

vi.mock('@/modules/notifications/hooks/use-notification-actions', () => ({
  useNotificationActions: () => ({
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    isMarkingRead: false,
    isMarkingAll: false,
  }),
}));

vi.mock('@/modules/articles/queries/use-articles.query', () => ({
  useArticlesQuery: vi.fn(),
}));

import { useMyStudentResultsQuery } from '@/modules/report/queries/use-my-student-results.query';
import { useNotificationsQuery } from '@/modules/notifications/queries/use-notifications.query';
import { useArticlesQuery } from '@/modules/articles/queries/use-articles.query';

const resultsMock = useMyStudentResultsQuery as unknown as ReturnType<typeof vi.fn>;
const notificationsMock = useNotificationsQuery as unknown as ReturnType<typeof vi.fn>;
const articlesMock = useArticlesQuery as unknown as ReturnType<typeof vi.fn>;

const QUERY_OK = <T,>(data: T) => ({
  data,
  error: null,
  isError: false,
  isFetching: false,
  isPending: false,
  isLoading: false,
  isPlaceholderData: false,
  refetch: vi.fn(),
});

// A current-model row and a scoring_failed row — the two arms the C-11 list
// dispatches, exactly as the wire capture records them.
const RESULT_ROWS = [
  {
    document_id: 'res-complete00000000000001',
    status: 'complete',
    acara_phase: 'Year 3 achievement',
    skill: 'reading',
    published_at: '2026-09-01T00:00:00.000Z',
  },
  {
    document_id: 'res-failed0000000000000001',
    status: 'scoring_failed',
    acara_phase: null,
    skill: null,
    published_at: null,
  },
];

const NOW = new Date();
const hourAgo = new Date(NOW.getTime() - 3_600_000).toISOString();
const lastYear = '2026-01-05T00:00:00.000Z';

const NOTIFICATION_ROWS = [
  {
    documentId: 'notif-unread-a0000000000001',
    eventType: 'test.scored',
    category: 'testResults',
    title: 'Reading test scored',
    body: "Amelia's result is ready.",
    priority: 'medium',
    readAt: null,
    linkUrl: '/dashboard',
    createdAt: hourAgo,
    updatedAt: hourAgo,
  },
  {
    documentId: 'notif-unread-b0000000000001',
    eventType: 'children.added',
    category: 'children',
    title: 'New child linked',
    body: null,
    priority: 'low',
    readAt: null,
    linkUrl: null,
    createdAt: hourAgo,
    updatedAt: hourAgo,
  },
  {
    documentId: 'notif-read-c00000000000001',
    eventType: 'test.scored',
    category: 'testResults',
    title: 'Old reading result',
    body: 'Earlier in the year.',
    priority: 'low',
    readAt: lastYear,
    linkUrl: '/dashboard',
    createdAt: lastYear,
    updatedAt: lastYear,
  },
];

const ARTICLE_ROWS = [
  {
    id: 1,
    documentId: 'art-one000000000000000001',
    title: 'Phonics at home',
    slug: 'phonics-at-home',
    excerpt: 'Practice routines',
    category: 'guide',
    featured: true,
    views: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 2,
    documentId: 'art-two000000000000000002',
    title: 'Reading beyond the classroom',
    slug: 'reading-beyond',
    excerpt: null,
    category: 'news',
    featured: false,
    views: 3,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-09T00:00:00.000Z',
  },
];

let host: HTMLElement | undefined;
let root: Root | undefined;

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

function typeIntoSearch(host: HTMLElement, text: string): void {
  const input = host.querySelector<HTMLInputElement>('input[type="search"]');
  if (!input) throw new Error('kit search input not found');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
});

describe('the C-11 report list on the directory kit', () => {
  test('renders both row arms through the kit with the preserved row slot', () => {
    resultsMock.mockReturnValue(QUERY_OK(RESULT_ROWS));
    const host = renderSurface(<ReportListScreen />);

    const rows = host.querySelectorAll('[data-slot="report-list-row"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Year 3 achievement');
    // A failed sitting renders its status verbatim — a dropped row would tell
    // the teacher nothing happened.
    expect(rows[1].textContent).toContain('Not derived yet');
    expect(host.querySelector('[data-surface="teacher-report-list"]')).not.toBeNull();
  });

  test('the kit search reduces the list client-side over the served array', () => {
    resultsMock.mockReturnValue(QUERY_OK(RESULT_ROWS));
    const host = renderSurface(<ReportListScreen />);

    typeIntoSearch(host, 'Year 3');
    expect(host.querySelectorAll('[data-slot="report-list-row"]').length).toBe(1);

    typeIntoSearch(host, 'zz-no-such-report');
    expect(host.querySelectorAll('[data-slot="report-list-row"]').length).toBe(0);
    expect(host.textContent).toContain('No matches');
  });
});

describe('the notifications feed on the directory kit', () => {
  beforeEach(() => {
    notificationsMock.mockReturnValue({
      ...QUERY_OK(NOTIFICATION_ROWS),
      data: {
        data: NOTIFICATION_ROWS,
        meta: {
          pagination: { page: 1, pageSize: 100, pageCount: 1, total: 3 },
          unreadCount: 2,
        },
      },
    });
  });

  test('rows keep their read-state contract and the unread affordance', () => {
    const host = renderSurface(<NotificationFeedList />);

    expect(host.querySelectorAll('[data-notification-id]').length).toBe(3);
    expect(host.querySelectorAll('[data-notification-id][data-read="false"]').length).toBe(2);
    // Exactly one mark-read button per UNREAD row — the e2e locates it by name.
    expect(host.querySelectorAll('button[aria-label="Mark as read"]').length).toBe(2);
    // The mark-all header still reads the query's own unread count.
    expect(host.querySelector('header')?.textContent).toContain('2 unread notifications');
  });

  test('the unread tile weight survives category filtering', () => {
    const host = renderSurface(<NotificationFeedList />);

    const pill = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'Test results',
    );
    if (!pill) throw new Error('category pill not found');
    act(() => pill.click());

    expect(host.querySelectorAll('[data-notification-id]').length).toBe(2);
    const unreadTile = host.querySelector(
      '[data-notification-id="notif-unread-a0000000000001"] > span',
    );
    expect(unreadTile?.className).toContain('bg-foreground');
    const readTile = host.querySelector(
      '[data-notification-id="notif-read-c00000000000001"] > span',
    );
    expect(readTile?.className).toContain('bg-divider');
  });

  test('the recency groups render through the kit grouping', () => {
    const host = renderSurface(<NotificationFeedList />);

    expect(host.textContent).toContain('Today');
    expect(host.textContent).toContain('Earlier');
  });
});

describe('the articles list on the directory kit', () => {
  beforeEach(() => {
    articlesMock.mockReturnValue(QUERY_OK({ items: ARTICLE_ROWS, total: 2, page: 1, pageCount: 1 }));
  });

  test('renders the served columns with the featured badge', () => {
    const host = renderSurface(<ArticlesList />);

    expect(host.querySelectorAll('[data-slot="directory"] tbody tr').length).toBe(2);
    // Newest update first (the client-mode default sort), and the featured
    // badge sits on the featured article's row only.
    const firstRow = host.querySelectorAll('tbody tr')[0];
    expect(firstRow.textContent).toContain('Reading beyond the classroom');
    const phonicsRow = [...host.querySelectorAll('tbody tr')].find((row) =>
      row.textContent?.includes('Phonics at home'),
    );
    expect(phonicsRow?.textContent).toContain('Featured');
    expect(phonicsRow?.textContent).toContain('1 view');
  });

  test('title search reduces the list client-side', () => {
    const host = renderSurface(<ArticlesList />);

    typeIntoSearch(host, 'phonics');
    expect(host.querySelectorAll('tbody tr').length).toBe(1);
  });
});
