import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { AssignTeachersDialog } from '@/modules/classes/components/AssignTeachersDialog';
import { ClassTeachersPickerDialog } from '@/modules/classes/components/ClassTeachersPickerDialog';
import { droppedByToggle, togglePick } from '@/modules/classes/lib/class-teacher-picker';

// BUG-005 a11y follow-up: ticking an invited teacher unticks every other pick
// (a class holds real teachers OR one invited teacher). That used to happen
// silently; the picker now says what it unticked in a polite live region that
// is mounted up front (so screen readers announce the change) and visible.

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8')) as Record<
  string,
  unknown
>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no PointerEvent; Base UI's checkbox builds one on click.
if (typeof window.PointerEvent === 'undefined') {
  (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = MouseEvent;
}

const TEACHERS = [
  { documentId: 'usr-1', email: 'grace@school.test', first_name: 'Grace', last_name: 'Hopper', blocked: false, classes: [] },
  { documentId: 'usr-2', email: 'alan@school.test', first_name: 'Alan', last_name: 'Turing', blocked: false, classes: [] },
];
const INVITATIONS = [
  {
    documentId: 'inv-1',
    email: 'ada@school.test',
    first_name: 'Ada',
    last_name: 'Lovelace',
    role: 'teacher',
    status: 'invited',
    expires_at: '2999-01-01T00:00:00.000Z',
    created_at: '2026-09-23T00:00:00.000Z',
  },
];
const loaded = (data: unknown[]) => ({ data, isPending: false, isError: false, isSuccess: true, isFetching: false });

vi.mock('@/modules/teachers', () => ({
  TEACHERS_QUERY_KEY: ['teachers'],
  useTeachersQuery: () => loaded(TEACHERS),
  useInvitationsQuery: () => loaded(INVITATIONS),
}));

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

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = '';
});

// The picker row a checkbox sits in: named by aria-label (class detail picker)
// or by the row's own label text (bulk dialog).
function checkbox(name: string): HTMLElement {
  const box = [...document.querySelectorAll<HTMLElement>('[role="checkbox"]')].find(
    (candidate) =>
      candidate.getAttribute('aria-label') === name || candidate.parentElement?.textContent?.trim() === name,
  );
  if (!box) throw new Error(`no checkbox named ${name}`);
  return box;
}

const click = (name: string) => act(() => checkbox(name).click());
const status = () => document.querySelector('[data-slot="teacher-picks-cleared"]');
const INVITED = 'Ada Lovelace (Invited — pending)';

describe('droppedByToggle', () => {
  test('names what a toggle took away besides the toggled value', () => {
    const before = ['usr-1', 'usr-2'];
    expect(droppedByToggle(before, togglePick(before, 'invite:inv-1', true), 'invite:inv-1')).toEqual(['usr-1', 'usr-2']);
    expect(droppedByToggle(['invite:inv-1'], togglePick(['invite:inv-1'], 'usr-1', true), 'usr-1')).toEqual(['invite:inv-1']);
    expect(droppedByToggle(['usr-1'], togglePick(['usr-1'], 'usr-2', true), 'usr-2')).toEqual([]);
    expect(droppedByToggle(['usr-1'], togglePick(['usr-1'], 'usr-1', false), 'usr-1')).toEqual([]);
  });
});

for (const [label, ui] of [
  ['the bulk Assign teachers dialog', () => <AssignTeachersDialog classes={[]} onClose={() => {}} />],
  [
    'the class detail teacher picker',
    () => (
      <ClassTeachersPickerDialog
        className="7A"
        currentTeacher={null}
        allowInvited
        pending={false}
        onSubmit={async () => true}
        onClose={() => {}}
      />
    ),
  ],
] as const) {
  describe(`${label} announces what an invited pick unticked`, () => {
    test('the polite live region is mounted, empty, before anything changes', () => {
      mount(ui());
      expect(status()?.getAttribute('role')).toBe('status');
      expect(status()?.getAttribute('aria-live')).toBe('polite');
      expect(status()?.textContent).toBe('');
    });

    test('ticking the invitation after two teachers names both teachers it unticked', () => {
      mount(ui());
      click('Grace Hopper');
      click('Alan Turing');
      expect(status()?.textContent).toBe('');
      click(INVITED);
      expect(checkbox('Grace Hopper').getAttribute('aria-checked')).toBe('false');
      expect(checkbox('Alan Turing').getAttribute('aria-checked')).toBe('false');
      expect(status()?.textContent).toBe(
        'An invited teacher is assigned on their own, so Grace Hopper and Alan Turing were unticked.',
      );
    });

    test('ticking a teacher while the invitation is picked says the invitation was unticked', () => {
      mount(ui());
      click(INVITED);
      click('Grace Hopper');
      expect(checkbox(INVITED).getAttribute('aria-checked')).toBe('false');
      expect(status()?.textContent).toBe(`An invited teacher is assigned on their own, so ${INVITED} was unticked.`);
    });

    test('a plain toggle that unticks nothing else clears the notice', () => {
      mount(ui());
      click('Grace Hopper');
      click(INVITED);
      expect(status()?.textContent).not.toBe('');
      click(INVITED);
      expect(status()?.textContent).toBe('');
    });
  });
}
