import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { ClassesScreen } from '@/modules/classes/components/ClassesScreen';

// BUG-005: a disabled "Add class" never stands alone. When the school has no
// teacher to assign, the hint under the button says what to do next (invite a
// teacher) and is tied to the button for assistive tech; once a teacher is
// assignable the hint is gone and the button is live.

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as { Classes: { addButton: string; addForm: { teacherRequiredHint: string } } };

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const useTeachersQuery = vi.fn();
const NO_INVITATIONS = { data: [], isPending: false, isError: false, isSuccess: true, isFetching: false };
const useInvitationsQuery = vi.fn(() => NO_INVITATIONS);

vi.mock('@/modules/teachers', () => ({
  useTeachersQuery: () => useTeachersQuery(),
  useInvitationsQuery: () => useInvitationsQuery(),
}));
vi.mock('@/modules/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuthStore: (select: (state: { token: string; hydrated: boolean }) => unknown) =>
    select({ token: 'jwt', hydrated: true }),
}));
vi.mock('@/modules/school-admin', () => ({
  useParticipationQuery: () => ({ data: undefined, isPending: false, isError: false }),
}));
vi.mock('@/modules/classes/queries/use-school-classes.query', () => ({
  useSchoolClassesQuery: () => ({ data: [], isPending: false, isError: false, isFetching: false }),
}));
vi.mock('@/modules/classes/components/ClassesTable', () => ({ ClassesTable: () => null }));

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ClassesScreen />
      </NextIntlClientProvider>,
    ),
  );
}

function teachers(data: unknown[]) {
  return { data, isPending: false, isError: false, isSuccess: true, isFetching: false };
}

function addClassButton(): HTMLButtonElement {
  const button = [...document.body.querySelectorAll('button')].find(
    (candidate) => candidate.textContent?.trim() === enMessages.Classes.addButton,
  );
  if (!button) throw new Error('Add class button not rendered');
  return button;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = '';
  useTeachersQuery.mockReset();
  useInvitationsQuery.mockReset();
  useInvitationsQuery.mockImplementation(() => NO_INVITATIONS);
});

function invitation(status: string, expiresAt: string, role = 'teacher') {
  return {
    documentId: `inv-${status}`,
    email: 'ada@school.test',
    first_name: 'Ada',
    last_name: 'Lovelace',
    role,
    status,
    expires_at: expiresAt,
    created_at: '2026-09-23T00:00:00.000Z',
  };
}

describe('Classes screen — teacher-required hint (BUG-005)', () => {
  test('no assignable teacher: Add class is disabled and the hint explains the next step', () => {
    useTeachersQuery.mockReturnValue(teachers([{ blocked: false, role: 'school_admin' }]));
    mount();
    const button = addClassButton();
    expect(button.disabled).toBe(true);
    const hint = document.querySelector('[data-slot="add-class-blocked-hint"]');
    expect(hint?.textContent).toBe(enMessages.Classes.addForm.teacherRequiredHint);
    expect(hint?.textContent).toMatch(/^Invite a teacher first/);
    expect(button.getAttribute('aria-describedby')).toBe(hint?.id);
  });

  test('a blocked teacher is not assignable — the hint stays', () => {
    useTeachersQuery.mockReturnValue(teachers([{ blocked: true, role: 'teacher' }]));
    mount();
    expect(addClassButton().disabled).toBe(true);
    expect(document.querySelector('[data-slot="add-class-blocked-hint"]')).not.toBeNull();
  });

  test('an active teacher exists: no hint, and Add class is enabled', () => {
    useTeachersQuery.mockReturnValue(teachers([{ blocked: false, role: 'teacher' }]));
    mount();
    expect(document.querySelector('[data-slot="add-class-blocked-hint"]')).toBeNull();
    expect(addClassButton().disabled).toBe(false);
    expect(addClassButton().hasAttribute('aria-describedby')).toBe(false);
  });

  test('while teachers load, no hint is guessed', () => {
    useTeachersQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, isSuccess: false });
    mount();
    expect(document.querySelector('[data-slot="add-class-blocked-hint"]')).toBeNull();
  });

  // BUG-006 consistency: an invited (pending) teacher is assignable, so it
  // suppresses the hint exactly like an active teacher does.
  test('a pending teacher invitation suppresses the hint and enables Add class', () => {
    useTeachersQuery.mockReturnValue(teachers([{ blocked: false, role: 'school_admin' }]));
    useInvitationsQuery.mockImplementation(
      () => ({ ...NO_INVITATIONS, data: [invitation('invited', '2999-01-01T00:00:00.000Z')] }) as never,
    );
    mount();
    expect(document.querySelector('[data-slot="add-class-blocked-hint"]')).toBeNull();
    expect(addClassButton().disabled).toBe(false);
  });

  test('lapsed, revoked and school-admin invitations do not count — the hint stays', () => {
    useTeachersQuery.mockReturnValue(teachers([]));
    useInvitationsQuery.mockImplementation(
      () =>
        ({
          ...NO_INVITATIONS,
          data: [
            invitation('invited', '2000-01-01T00:00:00.000Z'),
            invitation('revoked', '2999-01-01T00:00:00.000Z'),
            invitation('invited', '2999-01-01T00:00:00.000Z', 'school_admin'),
          ],
        }) as never,
    );
    mount();
    expect(document.querySelector('[data-slot="add-class-blocked-hint"]')).not.toBeNull();
    expect(addClassButton().disabled).toBe(true);
  });
});
