import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { ClassTeacherCell } from '@/modules/classes/components/ClassTeacherCell';
import { ClassTeacherPanel } from '@/modules/classes/components/ClassTeacherPanel';
import { classDetailSchema } from '@/modules/classes/schemas/class-detail.schema';
import type { ClassDetail } from '@/modules/classes/types/class-detail.types';
import {
  assignmentFromPicks,
  currentTeacherPick,
  isAssignableInvitation,
  teacherPickOptions,
  togglePick,
} from '@/modules/classes/lib/class-teacher-picker';
import { schoolClassSchema } from '@/modules/classes/schemas/class.schema';
import type { ClassPendingTeacher, SchoolClass } from '@/modules/classes/types/classes.types';
import type { SchoolInvitation, SchoolTeacher } from '@/modules/teachers';

// BUG-006 web half: invited (pending) teachers are offered next to active ones,
// a pick of an invitation travels as `pending_teacher_documentId`, and the
// Classes row shows "Invited (pending)" — or a reassign call once the
// invitation lapsed.

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as { Classes: { table: Record<string, string>; detail: { teacherUnassigned: string } } };

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const NOW = Date.parse('2026-09-23T10:00:00.000Z');

function invitation(overrides: Partial<SchoolInvitation> = {}): SchoolInvitation {
  return {
    documentId: 'inv-1',
    email: 'ada@school.test',
    first_name: 'Ada',
    last_name: 'Lovelace',
    role: 'teacher',
    status: 'invited',
    expires_at: '2026-10-07T10:00:00.000Z',
    created_at: '2026-09-23T09:00:00.000Z',
    ...overrides,
  };
}

const TEACHER: SchoolTeacher = {
  documentId: 'usr-1',
  email: 'grace@school.test',
  first_name: 'Grace',
  last_name: 'Hopper',
  blocked: false,
  classes: [],
};

describe('assignable invitations (the server rule, mirrored)', () => {
  test('only a teacher invitation that is invited and unexpired is assignable', () => {
    expect(isAssignableInvitation(invitation(), NOW)).toBe(true);
    expect(isAssignableInvitation(invitation({ expires_at: '2026-09-01T00:00:00.000Z' }), NOW)).toBe(false);
    expect(isAssignableInvitation(invitation({ status: 'expired' }), NOW)).toBe(false);
    expect(isAssignableInvitation(invitation({ status: 'revoked' }), NOW)).toBe(false);
    expect(isAssignableInvitation(invitation({ status: 'accepted' }), NOW)).toBe(false);
    expect(isAssignableInvitation(invitation({ role: 'school_admin' }), NOW)).toBe(false);
  });
});

describe('the combined picker', () => {
  test('active teachers first, then invited teachers labelled as pending', () => {
    const options = teacherPickOptions([TEACHER], [invitation()], (name) => `${name} (Invited — pending)`);
    expect(options).toEqual([
      { value: 'usr-1', label: 'Grace Hopper' },
      { value: 'invite:inv-1', label: 'Ada Lovelace (Invited — pending)' },
    ]);
  });

  test('a nameless invitation falls back to its email', () => {
    const [option] = teacherPickOptions([], [invitation({ first_name: '', last_name: '' })], (name) => name);
    expect(option.label).toBe('ada@school.test');
  });

  test('picks map to the wire: users to teacher_documentIds, one invitation to pending', () => {
    expect(assignmentFromPicks(['usr-1'])).toEqual({ teacher_documentIds: ['usr-1'], pending_teacher_documentId: null });
    expect(assignmentFromPicks(['invite:inv-1'])).toEqual({ teacher_documentIds: [], pending_teacher_documentId: 'inv-1' });
    expect(assignmentFromPicks([''])).toEqual({ teacher_documentIds: [], pending_teacher_documentId: null });
    expect(assignmentFromPicks(['usr-1', 'invite:inv-1', 'usr-2'])).toEqual({
      teacher_documentIds: ['usr-1', 'usr-2'],
      pending_teacher_documentId: 'inv-1',
    });
  });

  test('teachers accumulate; an invitation is exclusive — a class holds real teachers OR one invited teacher', () => {
    let picks = togglePick([], 'usr-1', true);
    picks = togglePick(picks, 'usr-2', true);
    expect(picks).toEqual(['usr-1', 'usr-2']);
    picks = togglePick(picks, 'invite:inv-1', true);
    expect(picks).toEqual(['invite:inv-1']);
    picks = togglePick(picks, 'invite:inv-2', true);
    expect(picks).toEqual(['invite:inv-2']);
    picks = togglePick(picks, 'usr-1', true);
    expect(picks).toEqual(['usr-1']);
    expect(togglePick(picks, 'usr-1', false)).toEqual([]);
  });

  test('the edit select preselects the teacher, else a still-pending invitation, never a lapsed one', () => {
    const pending: ClassPendingTeacher = { documentId: 'inv-1', email: null, first_name: 'Ada', last_name: null, state: 'pending' };
    expect(currentTeacherPick('usr-1', pending)).toBe('usr-1');
    expect(currentTeacherPick(null, pending)).toBe('invite:inv-1');
    expect(currentTeacherPick(null, { ...pending, state: 'revoked' })).toBe('');
    expect(currentTeacherPick(undefined, undefined)).toBe('');
  });
});

describe('C-CLS-01 row schema', () => {
  test('a row without pending_teacher (older API) parses to null', () => {
    const row = schoolClassSchema.parse({ documentId: 'c', name: '7A', year_band: null, teachers: [], student_count: 0 });
    expect(row.pending_teacher).toBeNull();
  });
});

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderCell(row: SchoolClass) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ClassTeacherCell row={row} />
      </NextIntlClientProvider>,
    ),
  );
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

function klass(pending: ClassPendingTeacher | null, teachers: SchoolClass['teachers'] = []): SchoolClass {
  return { documentId: 'c', name: '7A', year_band: null, teachers, pending_teacher: pending, student_count: 0 };
}

const PENDING: ClassPendingTeacher = {
  documentId: 'inv-1',
  email: 'ada@school.test',
  first_name: 'Ada',
  last_name: 'Lovelace',
  state: 'pending',
};

describe('the Classes row teacher cell', () => {
  test('a pending invited teacher reads "Invited (pending)" beside their name', () => {
    const cell = renderCell(klass(PENDING));
    expect(cell.textContent).toContain('Ada Lovelace');
    expect(cell.textContent).toContain(enMessages.Classes.table.teacherPending);
    expect(cell.querySelector('[data-slot="class-pending-teacher"]')?.getAttribute('data-state')).toBe('pending');
  });

  test('a revoked invitation reads as a reassign call, not as "no teacher"', () => {
    const cell = renderCell(klass({ ...PENDING, state: 'revoked' }));
    expect(cell.textContent).toContain(enMessages.Classes.table.teacherReassignRevoked);
    expect(cell.textContent).not.toContain(enMessages.Classes.table.teacherPending);
  });

  test('an expired invitation reads as a reassign call too', () => {
    const cell = renderCell(klass({ ...PENDING, state: 'expired' }));
    expect(cell.textContent).toContain(enMessages.Classes.table.teacherReassignExpired);
  });

  test('an active teacher alone renders exactly as before', () => {
    const cell = renderCell(klass(null, [{ documentId: 'usr-1', first_name: 'Grace', last_name: 'Hopper' }]));
    expect(cell.textContent).toBe('Grace Hopper');
  });

  test('no teacher and nothing pending is the empty value', () => {
    const cell = renderCell(klass(null));
    expect(cell.textContent).toBe(enMessages.Classes.table.teacherNone);
  });
});

function renderPanel(detail: ClassDetail, pending: ClassPendingTeacher | null | undefined) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient();
  act(() =>
    root!.render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <ClassTeacherPanel schoolClass={detail} pendingTeacher={pending} />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    ),
  );
  return host;
}

const DETAIL: ClassDetail = {
  documentId: 'c',
  name: '7A',
  year_band: null,
  teacher: null,
  student_count: 0,
  summary: { students: 0, test_a_completed: 0, test_b_completed: 0, avg_reading_score: null },
  students: [],
};

describe('the class detail teacher panel', () => {
  test('C-CLS-05 stays strict and unchanged — the pending teacher never rides on it', () => {
    expect(() => classDetailSchema.parse({ ...DETAIL, pending_teacher: null })).toThrow();
    expect(classDetailSchema.parse(DETAIL).teacher).toBeNull();
  });

  test('no teacher + a pending invitation reads "Invited (pending)" with the invitee name', () => {
    const panel = renderPanel(DETAIL, PENDING);
    expect(panel.textContent).toContain('Ada Lovelace');
    expect(panel.textContent).toContain(enMessages.Classes.table.teacherPending);
    expect(panel.textContent).not.toContain(enMessages.Classes.detail.teacherUnassigned);
  });

  test('a revoked invitation reads as a reassign call on the detail page too', () => {
    const panel = renderPanel(DETAIL, { ...PENDING, state: 'revoked' });
    expect(panel.textContent).toContain(enMessages.Classes.table.teacherReassignRevoked);
  });

  test('nothing pending (or not known yet) keeps the unassigned text', () => {
    expect(renderPanel(DETAIL, null).textContent).toContain(enMessages.Classes.detail.teacherUnassigned);
    act(() => root?.unmount());
    host?.remove();
    expect(renderPanel(DETAIL, undefined).textContent).toContain(enMessages.Classes.detail.teacherUnassigned);
  });
});
