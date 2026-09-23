import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { strapi } from '@/lib/axios/strapi';
import { AssignTeachersDialog } from '@/modules/classes/components/AssignTeachersDialog';
import { ClassTeacherPanel } from '@/modules/classes/components/ClassTeacherPanel';
import { EditClassDialog } from '@/modules/classes/components/EditClassDialog';
import { classesForInvitedAssign, editTeacherChange } from '@/modules/classes/lib/class-teacher-picker';
import type { ClassDetail } from '@/modules/classes/types/class-detail.types';
import type { ClassPendingTeacher } from '@/modules/classes/types/classes.types';
import { StaffClassesCell } from '@/modules/teachers/components/StaffTableRow';
import { useStaffRows } from '@/modules/teachers/hooks/use-staff-rows';
import type { StaffRow } from '@/modules/teachers/types/teachers.types';

// BUG-006 follow-up (web half):
//  1. the bulk Assign teachers dialog never removes a class's teachers — with an
//     invited pick, selected classes that already have a teacher are skipped and
//     named, and only teacher-less classes get the PATCH;
//  2. Edit class sends teacher/pending keys ONLY when the pick changed, so a
//     rename keeps an expired invite's "reassign teacher" state; an invited pick
//     on a staffed class is the explicit replace (replace_teachers: true);
//  3. the class detail panel (reviewer (b)): an invitation is offered only when
//     the class has no teacher, so its body never names a teacher AND a pending one;
//  4. the Teachers list names the classes already waiting on an invitation.

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8')) as Record<
  string,
  unknown
>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
if (typeof window.PointerEvent === 'undefined') {
  (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = MouseEvent;
}

const TEACHERS = [
  { documentId: 'usr-1', email: 'grace@school.test', first_name: 'Grace', last_name: 'Hopper', blocked: false, classes: [] },
];
const INVITATION = {
  documentId: 'inv-1',
  email: 'ada@school.test',
  first_name: 'Ada',
  last_name: 'Lovelace',
  role: 'teacher',
  status: 'invited',
  expires_at: '2999-01-01T00:00:00.000Z',
  created_at: '2026-09-23T00:00:00.000Z',
};
const loaded = (data: unknown[]) => ({ data, isPending: false, isError: false, isSuccess: true, isFetching: false });

vi.mock('@/modules/teachers', () => ({
  TEACHERS_QUERY_KEY: ['teachers'],
  useTeachersQuery: () => loaded(TEACHERS),
  useInvitationsQuery: () => loaded([INVITATION]),
}));
vi.mock('@/lib/axios/strapi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/axios/strapi')>()),
  strapi: { patch: vi.fn() },
}));
vi.mock('@/modules/ops/actions', () => ({ showOpsToast: vi.fn() }));

const patchMock = vi.mocked(strapi.patch);
const CLASS_ROW = { documentId: 'c', name: '7A', year_band: null, teachers: [], pending_teacher: null, student_count: 0 };

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(ui: ReactElement) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <QueryClientProvider client={new QueryClient()}>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          {ui}
        </NextIntlClientProvider>
      </QueryClientProvider>,
    ),
  );
}

beforeEach(() => {
  patchMock.mockReset();
  patchMock.mockResolvedValue({ data: { data: CLASS_ROW } } as never);
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = '';
});

const flush = () => act(async () => {
  await new Promise((settle) => setTimeout(settle, 0));
});

function checkbox(name: string): HTMLElement {
  const box = [...document.querySelectorAll<HTMLElement>('[role="checkbox"]')].find(
    (candidate) =>
      candidate.getAttribute('aria-label') === name || candidate.parentElement?.textContent?.trim() === name,
  );
  if (!box) throw new Error(`no checkbox named ${name}`);
  return box;
}

function button(name: string): HTMLButtonElement {
  const found = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) => candidate.textContent?.trim() === name,
  );
  if (!found) throw new Error(`no button named ${name}`);
  return found;
}

const INVITED = 'Ada Lovelace (Invited — pending)';
const EXPIRED: ClassPendingTeacher = { documentId: 'inv-9', email: null, first_name: 'Old', last_name: 'Invite', state: 'expired' };
const PENDING: ClassPendingTeacher = { ...EXPIRED, documentId: 'inv-1', state: 'pending' };

describe('Edit class — the teacher goes on the wire only when it changed', () => {
  test('a rename touches nothing else, whatever the class holds', () => {
    expect(editTeacherChange('', '', { teacher: null, pending_teacher: EXPIRED })).toEqual({});
    expect(editTeacherChange('usr-1', 'usr-1', { teacher: { documentId: 'usr-1' }, pending_teacher: null })).toEqual({});
    expect(editTeacherChange('invite:inv-1', 'invite:inv-1', { teacher: null, pending_teacher: PENDING })).toEqual({});
  });

  test('reassigning an expired invite to a teacher sends the teacher and clears the pending link', () => {
    expect(editTeacherChange('usr-1', '', { teacher: null, pending_teacher: EXPIRED })).toEqual({
      teacher_documentIds: ['usr-1'],
      pending_teacher_documentId: null,
    });
  });

  test('an invited pick on a staffed class is the explicit replace; on an empty class it is not', () => {
    expect(editTeacherChange('invite:inv-1', 'usr-1', { teacher: { documentId: 'usr-1' }, pending_teacher: null })).toEqual({
      teacher_documentIds: [],
      pending_teacher_documentId: 'inv-1',
      replace_teachers: true,
    });
    expect(editTeacherChange('invite:inv-1', '', { teacher: null, pending_teacher: null })).toEqual({
      teacher_documentIds: [],
      pending_teacher_documentId: 'inv-1',
    });
  });

  test('unassigning a teacher on a class with no pending teacher never sends the pending key', () => {
    expect(editTeacherChange('', 'usr-1', { teacher: { documentId: 'usr-1' }, pending_teacher: null })).toEqual({
      teacher_documentIds: [],
    });
  });

  test('THE DIALOG: renaming a class whose invite expired sends only the name — the reassign state survives', async () => {
    mount(<EditClassDialog schoolClass={{ documentId: 'c', name: '7A', teacher: null, pending_teacher: EXPIRED }} onClose={() => {}} />);
    const input = document.querySelector<HTMLInputElement>('#edit-class-name');
    expect(input).not.toBeNull();
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    act(() => {
      setValue?.call(input, '7A renamed');
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(patchMock).toHaveBeenCalledTimes(1);
    expect(patchMock.mock.calls[0]).toEqual(['/api/schools/me/classes/c', { name: '7A renamed' }]);
  });
});

describe('bulk Assign teachers — an invited pick skips classes that have a teacher', () => {
  const classes = [
    { documentId: 'cls-staffed', name: '7A Staffed', hasPendingTeacher: false, hasTeacher: true },
    { documentId: 'cls-empty', name: '7B Empty', hasPendingTeacher: false, hasTeacher: false },
  ];

  test('classesForInvitedAssign splits the selection', () => {
    expect(classesForInvitedAssign(classes, ['cls-staffed', 'cls-empty'])).toEqual({
      eligible: ['cls-empty'],
      skipped: [classes[0]],
    });
  });

  test('the dialog names the skipped class and PATCHes only the teacher-less one', async () => {
    mount(<AssignTeachersDialog classes={classes} onClose={() => {}} />);
    act(() => checkbox('7A Staffed').click());
    act(() => checkbox('7B Empty').click());
    act(() => checkbox(INVITED).click());
    const notice = document.querySelector('[data-slot="assign-teachers-skipped"]');
    expect(notice?.textContent).toContain('1 class keeps its teacher');
    expect(notice?.textContent).toContain("7A Staffed won't be changed");
    act(() => button('Assign').click());
    await flush();
    expect(patchMock.mock.calls).toEqual([
      ['/api/schools/me/classes/cls-empty', { teacher_documentIds: [], pending_teacher_documentId: 'inv-1' }],
    ]);
  });

  test('only staffed classes selected with an invited pick: nothing can be sent', () => {
    mount(<AssignTeachersDialog classes={classes} onClose={() => {}} />);
    act(() => checkbox('7A Staffed').click());
    act(() => checkbox(INVITED).click());
    expect(button('Assign').disabled).toBe(true);
    act(() => button('Assign').click());
    expect(patchMock).not.toHaveBeenCalled();
  });

  test('REAL teachers still go to every selected class (unchanged wholesale set), with no notice', async () => {
    mount(<AssignTeachersDialog classes={classes} onClose={() => {}} />);
    act(() => checkbox('7A Staffed').click());
    act(() => checkbox('7B Empty').click());
    act(() => checkbox('Grace Hopper').click());
    expect(document.querySelector('[data-slot="assign-teachers-skipped"]')).toBeNull();
    act(() => button('Assign').click());
    await flush();
    expect(patchMock.mock.calls.map((call) => call[0]).sort()).toEqual([
      '/api/schools/me/classes/cls-empty',
      '/api/schools/me/classes/cls-staffed',
    ]);
  });
});

const DETAIL: ClassDetail = {
  documentId: 'c',
  name: '7A',
  year_band: null,
  teacher: null,
  student_count: 0,
  summary: { students: 0, test_a_completed: 0, test_b_completed: 0, avg_reading_score: null },
  students: [],
};

describe('class detail panel (reviewer b) — never a teacher AND a pending one in one body', () => {
  test('a class WITH a teacher is not offered invitations, so adding sends teachers only', async () => {
    mount(<ClassTeacherPanel schoolClass={{ ...DETAIL, teacher: { documentId: 'usr-0', first_name: 'Old', last_name: 'Primary' } }} pendingTeacher={null} />);
    act(() => button(String((enMessages.Classes as { detail: { teachers: { add: string } } }).detail.teachers.add)).click());
    expect(() => checkbox(INVITED)).toThrow();
    act(() => checkbox('Grace Hopper').click());
    act(() => button('Add to class').click());
    await flush();
    expect(patchMock.mock.calls).toEqual([['/api/schools/me/classes/c', { teacher_documentIds: ['usr-0', 'usr-1'] }]]);
  });

  test('a class WITHOUT a teacher may take the invitation: an empty teacher list plus the pending id', async () => {
    mount(<ClassTeacherPanel schoolClass={DETAIL} pendingTeacher={null} />);
    act(() => button(String((enMessages.Classes as { detail: { teachers: { add: string } } }).detail.teachers.add)).click());
    act(() => checkbox(INVITED).click());
    act(() => button('Add to class').click());
    await flush();
    expect(patchMock.mock.calls).toEqual([
      ['/api/schools/me/classes/c', { teacher_documentIds: [], pending_teacher_documentId: 'inv-1' }],
    ]);
  });
});

function StaffRowsProbe({ onRows }: { onRows: (rows: StaffRow[]) => void }) {
  onRows(
    useStaffRows({
      teachers: [],
      invitations: [INVITATION as never, { ...INVITATION, documentId: 'inv-2', email: 'b@school.test' } as never],
      classes: [
        { ...CLASS_ROW, documentId: 'c1', name: '7A', pending_teacher: { ...PENDING, documentId: 'inv-1' } },
        { ...CLASS_ROW, documentId: 'c2', name: '7B', pending_teacher: { ...PENDING, documentId: 'inv-1' } },
      ],
      participation: undefined,
    }),
  );
  return null;
}

describe('Teachers list — an invitation names the classes already waiting on it', () => {
  test('the merged row carries the waiting classes; an invite with none reads "No classes yet"', () => {
    let rows: StaffRow[] = [];
    mount(<StaffRowsProbe onRows={(value) => (rows = value)} />);
    const waiting = rows.find((row) => row.documentId === 'inv-1');
    const none = rows.find((row) => row.documentId === 'inv-2');
    expect(waiting?.classes.map((klass) => klass.name)).toEqual(['7A', '7B']);
    act(() => root?.unmount());
    host?.remove();
    mount(<StaffClassesCell row={waiting as StaffRow} />);
    expect(host?.textContent).toBe('Assigned to 7A and 7B once they join');
    act(() => root?.unmount());
    host?.remove();
    mount(<StaffClassesCell row={none as StaffRow} />);
    expect(host?.textContent).toBe('No classes yet');
  });
});
