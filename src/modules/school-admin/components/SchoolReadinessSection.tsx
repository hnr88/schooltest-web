'use client';

import { LockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

// VIEW 1, Mainstream readiness, LOCKED state (School Admin Portal.dc.html
// :147-151, 1702-1707): a 20-radius banner on the recess tint with a DASHED
// #C4CEDC rule, a 38px icon tile and all-muted ink — the trial plan carries no
// listening, writing or speaking allowance, so there is nothing to aggregate.
// (The artboard's unlocked variant with its white surface and readiness tiles
// is reached only off-trial, which this screen never renders today.) The
// tile's own ink law applies: --color-body, not --muted-foreground, on the
// inset surface.
export function SchoolReadinessSection() {
  const t = useTranslations('SchoolAdmin.home');

  return (
    <section
      data-slot="school-readiness"
      aria-labelledby="school-readiness-title"
      className="flex items-start gap-3.5 rounded-result border border-dashed border-input bg-surface-inset py-5.5 px-6.5"
    >
      <span
        aria-hidden="true"
        className="grid size-9.5 shrink-0 place-items-center rounded-tile bg-surface-well text-slate-400"
      >
        <LockIcon className="size-4.5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="school-readiness-title" className="text-button font-semibold text-body">
          {t('readinessTitle')}
        </h2>
        <p className="mt-1.25 max-w-xl text-body-sm leading-relaxed text-body">
          {t('readinessUnavailable')}
        </p>
      </div>
    </section>
  );
}
