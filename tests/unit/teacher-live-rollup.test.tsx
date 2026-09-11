import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { IdleClassChips } from '@/modules/teacher/components/IdleClassChips';
import { LiveSessionCard } from '@/modules/teacher/components/LiveSessionCard';
import fixtureTeacherDashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.fixture-teacher.json';
import t2Dashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.t2.json';
import t2Open from '@/modules/teacher/lib/__fixtures__/test-sessions-open.t2.json';
import { deriveLiveRollup, liveTabHref, progressPercent, stillWorking } from '@/modules/teacher/lib/live-rollup';
import { teacherTestSessionsResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

// S12 — the Live sessions roll-up on RECORDED answers: t2's GET
// /api/teacher/test-sessions?status=open (two whole-class sittings + one two-student
// sitting) and recorded C-TD-1 dashboards. Edge cases derive from a recorded row.

const endSession = vi.hoisted(() => ({ isConfirmOpen: false, isPending: false, confirm: vi.fn() }));

vi.mock('next-intl', () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, unknown>) =>
      values ? `${namespace}.${key}${JSON.stringify(values)}` : `${namespace}.${key}`,
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    createElement('a', { href, ...rest }, children),
}));
vi.mock('@/modules/teacher/hooks/useEndSession', () => ({ useEndSession: () => endSession }));
vi.mock('@/modules/ops', () => ({
  OpsConfirmDialog: ({ title, description }: { title: string; description: string }) =>
    createElement('div', { role: 'alertdialog' }, `${title}|${description}`),
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const sessions = teacherTestSessionsResponseSchema.parse(t2Open).sessions;
const t2Classes = teacherDashboardResponseSchema.parse(t2Dashboard).classes;
const otherClasses = teacherDashboardResponseSchema.parse(fixtureTeacherDashboard).classes;

function recorded(predicate: (row: TeacherTestSession) => boolean): TeacherTestSession {
  const row = sessions.find(predicate);
  if (row === undefined) throw new Error('the recorded answer lacks this row');
  return row;
}
const selected = recorded((row) => Array.isArray(row.member_student_ids));
const whole = recorded((row) => row.member_student_ids === null);

let host: HTMLDivElement;
let root: Root | null = null;
function render(element: ReactNode): void {
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
  endSession.isConfirmOpen = false;
  vi.clearAllMocks();
});

describe('deriveLiveRollup — on the recorded t2 answer', () => {
  const rollup = deriveLiveRollup(sessions, t2Classes);
  const group = rollup.groups[0];

  test('the one class holds all three open sittings; nothing idle, nothing booked', () => {
    expect(rollup.groups).toHaveLength(1);
    expect(group?.name).toBe('Reading 8B — Alvarez');
    expect(group?.year).toEqual({ kind: 'band', from: 7, to: 9 });
    expect(group?.sittings).toHaveLength(3);
    expect(rollup.openSessionCount).toBe(3);
    expect(rollup.openClassCount).toBe(1);
    expect(rollup.idleClasses).toHaveLength(0);
    expect(rollup.bookings).toHaveLength(0);
    expect(rollup.allClassesBusy).toBe(true);
  });

  test('each sitting carries the served code, form label, members and stats', () => {
    const card = group?.sittings.find((s) => s.documentId === selected.sitting_document_id);
    expect(card).toMatchObject({
      code: '300125',
      formLabel: 'Reading diagnostic — Test A',
      memberIds: selected.member_student_ids,
      expected: 2,
      joined: 0,
      submitted: 0,
    });
    const wholeCard = group?.sittings.find((s) => s.documentId === whole.sitting_document_id);
    expect(wholeCard).toMatchObject({ memberIds: null, expected: 20, joined: 1, submitted: 0 });
  });

  test('a whole-class sitting leaves nobody free; members alone leave the rest free', () => {
    expect(group?.freeCount).toBe(0);
    expect(deriveLiveRollup([selected], t2Classes).groups[0]?.freeCount).toBe(18);
  });

  test('an open booking (phase scheduled) is never live; closed and cancelled rows drop out', () => {
    const booking: TeacherTestSession = { ...selected, phase: 'scheduled', code: null };
    const withBooking = deriveLiveRollup([booking], t2Classes);
    expect(booking.status).toBe('open');
    expect(withBooking.groups).toHaveLength(0);
    expect(withBooking.openSessionCount).toBe(0);
    expect(withBooking.idleClasses).toHaveLength(1);
    expect(withBooking.bookings).toEqual([
      expect.objectContaining({ className: 'Reading 8B — Alvarez', expected: 2 }),
    ]);
    const closed: TeacherTestSession = { ...whole, status: 'closed', phase: 'closed' };
    const cancelled: TeacherTestSession = { ...selected, phase: 'cancelled' };
    expect(deriveLiveRollup([closed, cancelled], t2Classes).groups).toHaveLength(0);
  });

  test('with nothing open every class is idle and none is busy', () => {
    const idle = deriveLiveRollup([], otherClasses);
    expect(idle.groups).toHaveLength(0);
    expect(idle.idleClasses).toHaveLength(otherClasses.length);
    expect(idle.allClassesBusy).toBe(false);
  });
});

describe('card figures', () => {
  const [card] = deriveLiveRollup([selected], t2Classes).groups[0]?.sittings ?? [];

  test('Monitor opens the class on its Live tab with this sitting', () => {
    expect(liveTabHref(selected.class.document_id, selected.sitting_document_id)).toBe(
      `/dashboard/results/${selected.class.document_id}?tab=live&session=${selected.sitting_document_id}`,
    );
  });

  test('bar = submitted of expected; still working = joined − submitted', () => {
    expect(card && progressPercent(card)).toBe(0);
    expect(card && stillWorking(card)).toBe(0);
    const half = { ...selected, stats: { expected: 2, joined: 2, submitted: 1 } };
    const [halfCard] = deriveLiveRollup([half], t2Classes).groups[0]?.sittings ?? [];
    expect(halfCard && progressPercent(halfCard)).toBe(50);
    expect(halfCard && stillWorking(halfCard)).toBe(1);
  });

  test('a row without stats shows no counts, never zeros', () => {
    const bare = { ...selected, stats: undefined };
    const [bareCard] = deriveLiveRollup([bare], t2Classes).groups[0]?.sittings ?? [];
    expect(bareCard).toMatchObject({ joined: null, submitted: null });
    expect(bareCard && stillWorking(bareCard)).toBeNull();
  });
});

describe('LiveSessionCard and IdleClassChips — rendered from the recorded rows', () => {
  const liveCard = deriveLiveRollup([whole], t2Classes).groups[0]?.sittings[0];
  const renderCard = () => {
    if (liveCard === undefined) throw new Error('no card');
    render(createElement(LiveSessionCard, { sitting: liveCard, classLabel: 'Reading 8B — Alvarez' }));
  };

  test('the card prints the served code, the whole-class line, the counts and the Live-tab link', () => {
    renderCard();
    expect(host.querySelector('[data-slot="live-session-code"]')?.textContent).toBe('656113');
    expect(host.textContent).toContain('TeacherPortal.liveSessions.whoWhole{"count":20}');
    expect(host.querySelector('[data-slot="live-session-progress"]')?.textContent).toBe(
      'TeacherPortal.liveSessions.progress{"joined":1,"submitted":0,"total":20}',
    );
    expect(host.querySelector('a')?.getAttribute('href')).toBe(
      liveTabHref(whole.class.document_id, whole.sitting_document_id),
    );
  });

  test('the close confirm names how many are still working, the code and the class', () => {
    endSession.isConfirmOpen = true;
    renderCard();
    const dialog = host.querySelector('[role="alertdialog"]')?.textContent ?? '';
    expect(dialog).toContain('TeacherPortal.liveSessions.closeConfirm.titleWorking{"count":1}');
    expect(dialog).toContain('"code":"656113","className":"Reading 8B — Alvarez"');
  });

  test('one chip per idle class, and a chip starts a session for that class', () => {
    const onStart = vi.fn();
    render(createElement(IdleClassChips, { classes: deriveLiveRollup([], otherClasses).idleClasses, onStart }));
    const chips = host.querySelectorAll<HTMLButtonElement>('[data-slot="teacher-idle-classes"] button');
    expect(chips).toHaveLength(otherClasses.length);
    act(() => chips[0]?.click());
    expect(onStart).toHaveBeenCalledWith(otherClasses[0]?.class_document_id);
  });

  test('no idle class: the design sentence instead of chips', () => {
    render(createElement(IdleClassChips, { classes: [], onStart: vi.fn() }));
    expect(host.querySelectorAll('button')).toHaveLength(0);
    expect(host.textContent).toBe(
      'TeacherPortal.liveSessions.idleTitleTeacherPortal.liveSessions.idleEmpty',
    );
  });
});
