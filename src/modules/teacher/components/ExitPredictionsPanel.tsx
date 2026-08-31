'use client';

import { useTranslations } from 'next-intl';

// Teacher Portal.dc.html:654-663 (the Exit-predictions tab block): the design
// ships this tab as an empty state — the heading and body below are its own
// words, and it deliberately carries NO "Coming soon" badge: a forward promise
// would imply capability this platform does not have. The panel stays inert on
// purpose — no button, no link, no input, no query, and above all no predicted
// number: a mocked-up figure here would be fabricated data.
function ExitPredictionsPanel() {
  const t = useTranslations('Teacher.results.exitPredictions');

  return (
    <section
      data-slot="exit-predictions-panel"
      aria-labelledby="exit-predictions-heading"
      className="flex flex-col gap-2 rounded-card border border-dashed border-border bg-card px-6 py-6 sm:px-7.5"
    >
      <h2
        id="exit-predictions-heading"
        className="text-panel-title font-semibold text-foreground"
      >
        {t('title')}
      </h2>
      <p className="max-w-prose text-body-sm text-balance text-body">{t('description')}</p>
    </section>
  );
}

export { ExitPredictionsPanel };
