import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { AddClassDialog } from '@/modules/classes/components/AddClassDialog';

// The eligibility rule for class creation: a class needs at least one
// ELIGIBLE (not blocked) teacher, and that is judged BEFORE the form renders.
// The admin never fills a form they cannot submit — no name field, no submit
// button — the refusal says why and points at inviting a teacher.

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const useTeachersQuery = vi.fn();
const NO_INVITATIONS = { data: [], isPending: false, isError: false, isSuccess: true, isFetching: false, refetch: vi.fn() };
const useInvitationsQuery = vi.fn(() => NO_INVITATIONS);

vi.mock('@/modules/teachers', () => ({
  useTeachersQuery: () => useTeachersQuery(),
  useInvitationsQuery: () => useInvitationsQuery(),
}));

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() =>
    root!.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <AddClassDialog onClose={vi.fn()} />
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
  useTeachersQuery.mockReset();
  useInvitationsQuery.mockReset();
  useInvitationsQuery.mockImplementation(() => NO_INVITATIONS);
});

function buttonNamed(label: string): HTMLButtonElement | undefined {
  return [...document.body.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === label,
  );
}

describe('AddClassDialog eligibility gate', () => {
  test('zero eligible teachers refuses creation: no form, no submit — the refusal says why', () => {
    useTeachersQuery.mockReturnValue({
      data: [{ blocked: true }, { blocked: true }],
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mount();
    expect(document.body.textContent).toContain('No teacher to assign yet');
    // BUG-005/006 wording: invite first — never "wait for an active teacher".
    expect(document.body.textContent).toContain('Invite a teacher first');
    expect(document.body.textContent).not.toContain('active teacher');
    // The form never mounts — nothing to fill, nothing to press.
    expect(document.querySelector('input')).toBeNull();
    expect(buttonNamed('Add class')).toBeUndefined();
    expect(buttonNamed('Cancel')).toBeDefined();
  });

  test('an admin-only staff list is NOT eligible — the admin is not a class teacher', () => {
    useTeachersQuery.mockReturnValue({
      data: [{ blocked: false, role: 'school_admin' }],
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mount();
    expect(document.body.textContent).toContain('No teacher to assign yet');
    expect(document.querySelector('input')).toBeNull();
    expect(buttonNamed('Add class')).toBeUndefined();
  });

  test('an eligible teacher exists → the form renders with its submit', () => {
    useTeachersQuery.mockReturnValue({
      data: [{ blocked: false, role: 'teacher' }],
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mount();
    expect(document.body.textContent).not.toContain('No teacher to assign yet');
    expect(document.querySelector('input')).not.toBeNull();
    expect(buttonNamed('Add class')).toBeDefined();
  });

  test('while the teachers load, the form waits — it never guesses eligibility', () => {
    useTeachersQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mount();
    expect(document.querySelector('[data-slot="add-class-pending"]')).not.toBeNull();
    expect(document.querySelector('input')).toBeNull();
    expect(buttonNamed('Add class')).toBeUndefined();
  });

  test('a failed teachers load blocks creation too — eligibility cannot be verified', () => {
    useTeachersQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: vi.fn(),
    });
    mount();
    expect(document.body.textContent).toContain('We could not load your teachers');
    expect(document.querySelector('input')).toBeNull();
    expect(buttonNamed('Add class')).toBeUndefined();
    expect(buttonNamed('Try again')).toBeDefined();
  });

  // BUG-006: an invited teacher still pending activation is assignable, so a
  // school whose only teacher is invited can create a class right away.
  test('only a pending invitation → the form renders and offers the invited teacher', () => {
    useTeachersQuery.mockReturnValue({
      data: [{ blocked: false, role: 'school_admin' }],
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    useInvitationsQuery.mockImplementation(() => ({
      ...NO_INVITATIONS,
      data: [
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
      ],
    }) as never);
    mount();
    expect(document.body.textContent).not.toContain('No teacher to assign yet');
    expect(document.querySelector('input')).not.toBeNull();
    expect(buttonNamed('Add class')).toBeDefined();
  });

  test('an expired or revoked invitation is NOT assignable — the refusal stays', () => {
    useTeachersQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    useInvitationsQuery.mockImplementation(() => ({
      ...NO_INVITATIONS,
      data: [
        { documentId: 'inv-x', email: 'x@s.test', first_name: 'X', last_name: 'Y', role: 'teacher', status: 'revoked', expires_at: '2999-01-01T00:00:00.000Z', created_at: '' },
        { documentId: 'inv-y', email: 'y@s.test', first_name: 'Y', last_name: 'Z', role: 'teacher', status: 'invited', expires_at: '2000-01-01T00:00:00.000Z', created_at: '' },
      ],
    }) as never);
    mount();
    expect(document.body.textContent).toContain('No teacher to assign yet');
    expect(buttonNamed('Add class')).toBeUndefined();
  });
});
