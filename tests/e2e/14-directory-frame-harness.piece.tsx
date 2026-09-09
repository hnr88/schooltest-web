import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import { OPS_CAPABILITIES_QUERY_KEY } from '@/modules/ops/constants/capabilities.constants';
import { DirectoryChips } from '@/modules/directory/components/DirectoryChips';
import { DirectoryHeader } from '@/modules/directory/components/DirectoryHeader';

// ops/14 — the harness PIECE for the tab-body frame proof. Rendered through
// the in-process Vite SSR server (see 14-directory-frame-harness.spec.ts):
// the REAL kit units compile here, dressed by the spec in the app's live CSS.
// No app route mounts these units yet — their consumers are the six
// school-admin rows and school-admin/02's dispatcher — so this piece is the
// photograph vehicle, exactly like the figure-kit harness before it.

const MESSAGES = {
  DesignSystem: {
    directory: { exportCsv: 'Export CSV', primaryAction: 'Open', chipAll: 'All' },
  },
  Ops: {
    capabilities: { readOnlyWriteBlocked: 'This session is read-only.' },
    toast: { retry: 'Retry' },
  },
};

function FrameTable(): ReactNode {
  const rows = [
    { name: 'Ada Ngu', email: 'ada.ngu@schooltest.local', status: 'Active' },
    { name: 'Bilal Rahimi', email: '—', status: 'Archived' },
    { name: 'Cora Lindqvist', email: 'cora.l@schooltest.local', status: 'Invited' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <th className="px-4 py-3">Admin</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
              <td className="px-4 py-3">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function buildTabFrameHarness(): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={MESSAGES}>
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <DirectoryHeader
          header={{
            title: 'School admins',
            summary: '2 invited · 1 active',
            primary: { label: 'Invite admin', onSelect: () => {} },
            secondary: { onSelect: () => {} },
          }}
        />
        <FrameTable />
      </div>
    </NextIntlClientProvider>,
  );
}

/**
 * The orchestrator's live ops_support check: a `write: true` primary in a
 * read-only session. The onSelect plants a window flag, so the spec can prove
 * a click BOTH issues no request AND never reaches the handler.
 *
 * The gate reads the capabilities through TanStack Query, so the client is
 * PRE-SEEDED with the contract-exact `ops_support` payload
 * (`capabilitiesForRole('ops_support')` — write:false): the SSR render then
 * shows the gated (greyed, refusal-titled) state deterministically, with no
 * network needed behind the static page.
 */
export function buildSupportHarness(): string {
  const queryClient = new QueryClient();
  queryClient.setQueryData(OPS_CAPABILITIES_QUERY_KEY, {
    actor: {
      documentId: 'zz14supportsessionactor01',
      first_name: 'Support',
      last_name: 'Session',
      email: 'support@schooltest.local',
      role: 'ops_support',
      updatedAt: '2026-09-09T21:00:00+00:00',
    },
    capabilities: { read: true, write: false, export: true, view_as_teacher: false, edit_self: true },
    status_page_url: null,
  });
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={MESSAGES}>
        <div className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
          <DirectoryHeader
            header={{
              title: 'School admins',
              summary: '2 invited · 1 active',
              primary: {
                label: 'Invite admin',
                write: true,
                onSelect: () => {
                  (window as { __inviteClicked?: boolean }).__inviteClicked = true;
                },
              },
            }}
          />
          <FrameTable />
        </div>
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

export function buildChipsHarness(): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={MESSAGES}>
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <DirectoryHeader
          header={{ title: 'Teachers', summary: '9 teachers · 4 classes covered' }}
        />
        <DirectoryChips
          filter={{
            key: 'status',
            label: 'Status',
            options: [
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'invited', label: 'Invited' },
              { value: 'suspended', label: 'Suspended' },
            ],
          }}
          value="active"
          onValueChange={() => {}}
        />
        <FrameTable />
      </div>
    </NextIntlClientProvider>,
  );
}
