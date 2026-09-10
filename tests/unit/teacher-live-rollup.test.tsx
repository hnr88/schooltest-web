import { act } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { IdleClassChips } from '@/modules/teacher/components/IdleClassChips';
import { LiveSessionsByClass } from '@/modules/teacher/components/LiveSessionsByClass';
import { deriveLiveRollup } from '@/modules/teacher/lib/live-rollup';
import {
  CLASS_OAK,
  CLASS_PINE,
  CLASS_ROSE,
  SITTING_OAK_A,
  SITTING_ROSE_A,
  SITTING_ROSE_B,
  makeClass,
  makeSitting,
} from './fixtures/teacher-live-rollup-fixtures';
import { makeQueryStubs } from './fixtures/teacher-live-rollup-fixtures';

// teacher/09 — the live roll-up. A POPULATED live state is structurally
// unproducible on the shared dev DB, so the populated roll-up is proven here
// with constructed fixtures, asserted by COUNT, with literal expectations that
// do not derive from the code under test. `next-intl` is mocked to answer the
// COMPOUND path (`Teacher.testSessions.rollup.<key>`), so an assertion also
// fails if a key moves to the wrong namespace.

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('@/modules/teacher/components/EndSessionDialog', () => ({
  EndSessionDialog: () => null,
}));

// The card's Monitor button renders through next-intl's locale-aware <Link>,
// which needs a provider this bare createRoot render has no reason to stand up
// (the directory-layout.test.tsx precedent): a plain anchor preserves the
// href assertions and nothing else about the Link is under test here.
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
    createElement('a', { href, ...rest }, children),
}));

const stubs = makeQueryStubs();

vi.mock('@/modules/teacher/queries/use-test-sessions.query', () => ({
  useTestSessionsQuery: () => stubs.sessions,
}));
vi.mock('@/modules/teacher/queries/use-teacher-dashboard.query', () => ({
  useTeacherDashboardQuery: () => stubs.dashboard,
}));
vi.mock('@/modules/teacher/queries/use-teacher-tests.query', () => ({
  useTeacherTestsQuery: () => stubs.tests,
}));
vi.mock('@/modules/teacher/queries/use-close-test-session.mutation', () => ({
  useCloseTestSessionMutation: () => ({ isPending: stubs.close.isPending, mutate: stubs.close.mutate }),
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root | null = null;

function render(element: Parameters<typeof createRoot>[0] extends never ? never : React.ReactNode): void {
  host = document.body.appendChild(document.createElement('div'));
  act(() => {
    root = createRoot(host);
    root.render(element);
  });
}

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  vi.clearAllMocks();
});

describe('deriveLiveRollup — the populated roll-up, proven with constructed fixtures', () => {
  test('two classes hold their sittings, the third class is idle, sets are complementary', () => {
    const classes = [CLASS_ROSE, CLASS_OAK, CLASS_PINE];
    const sessions = [SITTING_ROSE_A, SITTING_ROSE_B, SITTING_OAK_A];
    const rollup = deriveLiveRollup(sessions, classes);
    expect(rollup.groups).toHaveLength(2);
    expect(rollup.idleClasses).toHaveLength(1);
    expect(rollup.groups[0]?.name).toBe('Rosewood');
    expect(rollup.groups[0]?.sittings).toHaveLength(2);
    expect(rollup.openSessionCount).toBe(3);
    expect(rollup.openClassCount).toBe(2);
    expect(rollup.allClassesBusy).toBe(false);
  });

  test('group set and idle set are disjoint and exhaustive over the teacher’s classes', () => {
    const classes = [CLASS_ROSE, CLASS_OAK, CLASS_PINE];
    const sessions = [SITTING_ROSE_A, SITTING_OAK_A];
    const rollup = deriveLiveRollup(sessions, classes);
    const grouped = rollup.groups.map((group) => group.classDocumentId).sort();
    const idle = rollup.idleClasses.map((klass) => klass.classDocumentId).sort();
    expect(grouped.length + idle.length).toBe(classes.length);
    expect(grouped.filter((key) => idle.includes(key))).toHaveLength(0);
  });

  test('closed sittings drop out; a class left with none becomes idle', () => {
    const closedRose = makeSitting({
      classDocumentId: CLASS_ROSE.class_document_id,
      className: CLASS_ROSE.name,
      status: 'closed',
    });
    const rollup = deriveLiveRollup([closedRose], [CLASS_ROSE]);
    expect(rollup.groups).toHaveLength(0);
    expect(rollup.idleClasses).toHaveLength(1);
    expect(rollup.allClassesBusy).toBe(false);
  });

  test('every class busy flips the all-busy sentence on', () => {
    const rollup = deriveLiveRollup([SITTING_ROSE_A], [CLASS_ROSE]);
    expect(rollup.allClassesBusy).toBe(true);
  });

  test('no classes and no sessions answer the empty roll-up, never a guess', () => {
    const rollup = deriveLiveRollup([], []);
    expect(rollup.groups).toHaveLength(0);
    expect(rollup.idleClasses).toHaveLength(0);
    expect(rollup.openSessionCount).toBe(0);
    expect(rollup.allClassesBusy).toBe(false);
  });
});

describe('LiveSessionsByClass — rendered from the same fixtures', () => {
  beforeEach(() => {
    stubs.sessions = { data: { sessions: [SITTING_ROSE_A, SITTING_ROSE_B, SITTING_OAK_A] }, isPending: false, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    stubs.dashboard = { data: { classes: [CLASS_ROSE, CLASS_OAK, CLASS_PINE] }, isPending: false, isError: false, isFetching: false, error: null, refetch: vi.fn() };
  });

  test('populated: two group headings and three cards — by count (idle chips are the sibling island)', () => {
    render(createElement(LiveSessionsByClass));
    expect(host.querySelectorAll('[data-slot="live-session-card"]').length).toBe(3);
    expect(host.textContent).toContain('Teacher.testSessions.rollup.schoolSummary');
    expect(host.textContent).toContain('Teacher.testSessions.rollup.groupHeading');
  });

  test('each card’s Monitor lands on that sitting’s literal monitor URL', () => {
    render(createElement(LiveSessionsByClass));
    const monitors = host.querySelectorAll<HTMLAnchorElement>('[data-slot="live-session-card"] a');
    const hrefs = Array.from(monitors).map((anchor) => anchor.getAttribute('href'));
    expect(hrefs).toContain(`/dashboard/test-sessions/${SITTING_ROSE_A.sitting_document_id}`);
    expect(hrefs).toContain(`/dashboard/test-sessions/${SITTING_OAK_A.sitting_document_id}`);
  });

  test('OFFLINE + pending: the disconnect notice renders and the empty never does', () => {
    stubs.sessions = { data: undefined, isPending: true, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    stubs.dashboard = { data: undefined, isPending: true, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      render(createElement(LiveSessionsByClass));
      expect(host.textContent).toContain('Teacher.testSessions.rollup.offlineTitle');
      expect(host.textContent).not.toContain('Teacher.testSessions.rollup.emptyTitle');
      expect(host.textContent).not.toContain('Teacher.testSessions.rollup.nothingRunning');
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
  });

  test('online with nothing open: the kit empty arm renders the design sentence, zero cards', () => {
    stubs.sessions = { data: { sessions: [] }, isPending: false, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    stubs.dashboard = { data: { classes: [CLASS_ROSE] }, isPending: false, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    render(createElement(LiveSessionsByClass));
    expect(host.querySelectorAll('[data-slot="live-session-card"]').length).toBe(0);
    expect(host.textContent).toContain('Teacher.testSessions.rollup.nothingRunning');
    expect(host.textContent).toContain('Teacher.testSessions.rollup.emptyTitle');
  });
});

describe('IdleClassChips — the idle row and the all-busy sentence', () => {
  test('one chip per idle class, none for busy ones', () => {
    stubs.sessions = { data: { sessions: [SITTING_ROSE_A] }, isPending: false, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    stubs.dashboard = { data: { classes: [CLASS_ROSE, CLASS_OAK] }, isPending: false, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    render(createElement(IdleClassChips));
    expect(host.querySelectorAll('[data-slot="teacher-idle-classes"] button').length).toBe(1);
  });

  test('every class busy replaces the chips with the all-busy sentence', () => {
    stubs.sessions = { data: { sessions: [SITTING_ROSE_A] }, isPending: false, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    stubs.dashboard = { data: { classes: [CLASS_ROSE] }, isPending: false, isError: false, isFetching: false, error: null, refetch: vi.fn() };
    render(createElement(IdleClassChips));
    expect(host.querySelectorAll('[data-slot="teacher-idle-classes"] button').length).toBe(0);
    expect(host.textContent).toContain('Teacher.testSessions.rollup.allBusy');
  });
});
