import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import {
  revokeStaffInvitationResultSchema,
} from '@/modules/ops/queries/use-revoke-invitation.mutation';
import { OpsStaffInvitationRowActions } from '@/modules/ops/components/OpsStaffInvitationRowActions';
import { OpsStaffInvitationTable } from '@/modules/ops/components/OpsStaffInvitationTable';

import type { StaffInvitationRow } from '@schooltest/ops-contracts';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// GAP-1 (task 15) — the row-actions eligibility rule the wired invitations
// table now renders: a pending `invited` or lapsed `expired` row offers
// Resend and Revoke; `accepted` belongs to the account-actions surface and
// `revoked` is terminal, so neither shows a control. The header column only
// exists when the table is given a renderActions callback.
const NOW_MS = 1_800_000_000_000;

function row(overrides: Partial<StaffInvitationRow>): StaffInvitationRow {
  return {
    documentId: 'inv00000000000000000000aa',
    email: 'new.teacher@school.edu.au',
    first_name: null,
    last_name: null,
    role: 'teacher',
    status: 'invited',
    expires_at: null,
    accepted_at: null,
    revoked_at: null,
    school: { documentId: 'sch00000000000000000000aa', name: 'Riverview Grammar' },
    display_name: 'Elena Alvarez',
    invited_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

let host: HTMLElement | undefined;
let root: Root | undefined;
let queryClient: QueryClient;

function renderTable(rows: readonly StaffInvitationRow[], withActions: boolean): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  root = createRoot(host);
  const table = createElement(OpsStaffInvitationTable, {
    rows,
    nowMs: NOW_MS,
    ...(withActions
      ? {
          renderActions: (r: StaffInvitationRow) =>
            createElement(OpsStaffInvitationRowActions, {
              row: r,
              cooldownSeconds: 0,
              onCooldown: () => undefined,
            }),
        }
      : {}),
  });
  act(() => {
    root!.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
          {table}
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
  return host;
}

beforeEach(() => {
  host = undefined;
  root = undefined;
});

afterEach(() => {
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host.remove();
  }
});

function actionButtons(host: HTMLElement): { resend: number; revoke: number } {
  const cells = host.querySelectorAll('[data-slot="ops-staff-invitation-row-actions"]');
  let resendCount = 0;
  let revokeCount = 0;
  for (const cell of cells) {
    const buttons = cell.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent === 'Resend') resendCount += 1;
      if (button.textContent === 'Revoke') revokeCount += 1;
    }
  }
  return { resend: resendCount, revoke: revokeCount };
}

describe('staff invitation row actions eligibility (GAP-1, task 15)', () => {
  test('an invited row offers Resend and Revoke under an Actions column', () => {
    const host = renderTable([row({})], true);
    expect(host.querySelector('table')?.textContent).toContain('Actions');
    const counts = actionButtons(host);
    expect(counts.resend).toBe(1);
    expect(counts.revoke).toBe(1);
  });

  test('an expired row can still be resent and revoked', () => {
    const host = renderTable([row({ status: 'expired' })], true);
    const counts = actionButtons(host);
    expect(counts.resend).toBe(1);
    expect(counts.revoke).toBe(1);
  });

  test('an accepted row offers nothing — the account, not the invitation, is active', () => {
    const host = renderTable([row({ status: 'accepted', accepted_at: '2026-09-02T00:00:00.000Z' })], true);
    const counts = actionButtons(host);
    expect(counts.resend).toBe(0);
    expect(counts.revoke).toBe(0);
  });

  test('a revoked row is terminal and offers nothing', () => {
    const host = renderTable(
      [row({ status: 'revoked', revoked_at: '2026-09-03T00:00:00.000Z' })],
      true,
    );
    const counts = actionButtons(host);
    expect(counts.resend).toBe(0);
    expect(counts.revoke).toBe(0);
  });

  test('a row with no stored status is unknown and acts on nothing', () => {
    const host = renderTable([row({ status: null })], true);
    const counts = actionButtons(host);
    expect(counts.resend).toBe(0);
    expect(counts.revoke).toBe(0);
  });

  test('without renderActions the table renders no Actions column at all', () => {
    const host = renderTable([row({})], false);
    expect(host.querySelector('table')?.textContent).not.toContain('Actions');
    expect(actionButtons(host).resend).toBe(0);
  });
});

// The live revoke answers 200 with the FULL projected row (email, role,
// timestamps, school). The parser must strip it to {documentId, status} — a
// strict parse here threw on every real response, so the mutation rejected a
// SUCCESS and the list never refetched.
describe('revoke result parse (GAP-1 regression)', () => {
  test('the full projected revoke response parses down to the pair the UI reads', () => {
    const parsed = revokeStaffInvitationResultSchema.parse({
      documentId: 'frroqohhyrdu1paunchxczar',
      email: 'invite-e2e-cleanup@schooltest.local',
      first_name: '',
      last_name: '',
      role: 'teacher',
      status: 'revoked',
      expires_at: '2026-09-21T20:01:48.490Z',
      accepted_at: null,
      revoked_at: '2026-09-07T20:01:49.316Z',
      school: { documentId: 'spfdyd7080vk8mum9gkz5xq6', name: 'A B Paterson College' },
    });
    expect(parsed).toEqual({
      documentId: 'frroqohhyrdu1paunchxczar',
      status: 'revoked',
    });
  });

  test('a response without a status is refused, never guessed', () => {
    expect(
      revokeStaffInvitationResultSchema.safeParse({ documentId: 'frroqohhyrdu1paunchxczar' }).success,
    ).toBe(false);
  });
});
