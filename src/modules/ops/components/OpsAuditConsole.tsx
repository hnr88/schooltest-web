'use client';

import { useTranslations } from 'next-intl';

import { OpsApiTokensPanel } from './OpsApiTokensPanel';
import { OpsAuditLogTable } from './OpsAuditLogTable';

// C-OPSA-01/02 (ledger 6) — the ops Audit console: the audit ledger over the
// server's own filters and pagination, and the API-token inventory with the one
// irreversible control. Two independent reads, so each owns its loading and
// error state rather than one spinner hiding both.
export function OpsAuditConsole() {
  const t = useTranslations('Ops.audit');

  return (
    <div data-slot="ops-audit-console" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </header>
      <OpsAuditLogTable />
      <OpsApiTokensPanel />
    </div>
  );
}
