'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/modules/design-system';

// Brief flow 26 / .qa/DESIGN.md §Results: the fourth tab carries a "Coming soon"
// badge and NO ACTIONABLE CONTENT. So this panel is deliberately inert — a
// heading, the badge, and one sentence. No button, no link, no input, no query,
// and above all no predicted number: exit prediction is not a capability this
// platform has, and a mocked-up figure here would be fabricated data.
function ExitPredictionsPanel() {
  const t = useTranslations('Teacher.results.exitPredictions');

  return (
    <section
      data-slot="exit-predictions-panel"
      aria-labelledby="exit-predictions-heading"
      className="flex flex-col gap-2 rounded-card border border-dashed border-border bg-card px-6 py-6 sm:px-7.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id="exit-predictions-heading"
          className="text-panel-title font-semibold text-foreground"
        >
          {t('title')}
        </h2>
        <Badge variant="secondary" className="text-meta font-semibold">
          {t('badge')}
        </Badge>
      </div>
      <p className="max-w-prose text-body-sm text-balance text-body">{t('description')}</p>
    </section>
  );
}

export { ExitPredictionsPanel };
