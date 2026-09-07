import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsAuditConsole } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.audit.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Ledger 6 — the ops Audit console (audit ledger + API tokens). The OpsGuard in
// the section layout keeps this ops-only; `/dashboard/ops/audit` was already a
// registered trail level (trail.constants.ts) waiting for this page, so the
// breadcrumb entry becomes valid as this route lands (D-010 / ledger 19b).
export default function OpsAuditPage() {
  return <OpsAuditConsole />;
}
