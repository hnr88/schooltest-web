'use client';

import { InfoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { InsightCallout, PanelHeaderRow } from '@/modules/design-system';

// Spec section 1, Mainstream readiness: an info banner, never metric cards.
// The trial plan carries no listening, writing or speaking allowance, so there
// is nothing to aggregate — the caller gates this on plan === 'trial'.
export function SchoolReadinessSection() {
  const t = useTranslations('SchoolAdmin.home');

  return (
    <section
      data-slot="school-readiness"
      aria-labelledby="school-readiness-title"
      className="flex flex-col gap-3"
    >
      <PanelHeaderRow
        as="h2"
        titleId="school-readiness-title"
        title={t('readinessTitle')}
      />
      <InsightCallout icon={InfoIcon} tone="info">
        {t('readinessUnavailable')}
      </InsightCallout>
    </section>
  );
}
