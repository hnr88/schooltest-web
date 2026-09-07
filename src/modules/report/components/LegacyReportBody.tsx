'use client';

import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { bandSchema } from '@schooltest/scoring-contracts';

import type {
  LegacyResultView,
  LegacyStoredStatus,
} from '@/modules/report/schemas/result-view.schema';

function statusLabelKey(status: LegacyStoredStatus): string {
  return bandSchema.safeParse(status).success
    ? `attributeStatus.${status}`
    : `legacyStatus.${status}`;
}

// Legacy-r7 (and any other non-v2 view): the model split retired these rows'
// scores, so the report shows the stored statuses as localized TEXT ONLY under
// the pilot caveat — no bars, no scores, no recomputation, and never a 0 for a
// not-assessed attribute.
export function LegacyReportBody({ view }: { view: LegacyResultView }) {
  const t = useTranslations('Report');
  const entries = Object.entries(view.attributes ?? {});

  return (
    <section
      data-surface="legacy-report"
      className="flex w-full max-w-3xl flex-col gap-5"
    >
      <p
        role="note"
        className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{t('legacyModelCaveat')}</span>
      </p>

      {entries.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {entries.map(([code, entry]) => {
            const status = typeof entry === 'string' ? entry : entry.status;
            return (
              <li
                key={code}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="text-sm font-medium text-foreground">{code}</span>
                <span className="text-sm text-muted-foreground">
                  {t(statusLabelKey(status))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
