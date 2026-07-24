'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Eyebrow } from '@/modules/design-system';
import { observationValues } from '@/modules/report/lib/observation-message';
import type { AssessedAttributeStatus } from '@/modules/report/types/attribute.types';
import type { ObservationsView } from '@/modules/report/types/observation.types';

const SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-250 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

const ABSENT_KEY = {
  not_derived: 'observationsNotDerived',
  not_applicable: 'observationsNotApplicable',
  unclassified: 'observationsUnclassified',
} as const;

// E11-06 — the teaching observations. Every sentence is a catalog string filled
// with values the generator read off this very result; the component composes no
// prose, applies no threshold and adds no recommendation.
export function ObservationList({ view }: { view: ObservationsView }) {
  const t = useTranslations('Report');
  const format = useFormatter();

  if (view.state !== 'observations') {
    const key = ABSENT_KEY[view.state];
    return (
      <section data-slot="report-observations" data-state={view.state} className={SECTION_CLASS}>
        <Eyebrow>{t('observationsEyebrow')}</Eyebrow>
        <p
          data-slot="report-observations-absent"
          className="text-body-lg font-semibold text-balance text-muted-foreground"
        >
          {t(key)}
        </p>
        <p className="text-caption text-muted-foreground">{t(`${key}Description`)}</p>
      </section>
    );
  }

  const formatters = {
    list: (codes: string[]) => format.list(codes, { type: 'conjunction' }),
    percent: (value: number) =>
      format.number(value, { style: 'percent', maximumFractionDigits: 0 }),
    status: (status: AssessedAttributeStatus) => t(`attributeStatus.${status}`),
  };

  return (
    <section
      data-slot="report-observations"
      data-state="observations"
      aria-label={t('observationsEyebrow')}
      className={SECTION_CLASS}
    >
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{t('observationsEyebrow')}</Eyebrow>
        <p className="text-body-md text-muted-foreground">{t('observationsDescription')}</p>
      </div>

      <ol className="flex flex-col gap-3">
        {view.observations.map((observation, index) => (
          <li
            key={observation.key}
            data-slot="report-observation"
            data-observation={observation.key}
            className="animate-in border-l-2 border-primary/35 pl-4 text-body-md text-pretty text-foreground duration-300 ease-out-expo fade-in slide-in-from-left-1 motion-reduce:animate-none"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            {t(`observations.${observation.key}`, observationValues(observation, formatters))}
          </li>
        ))}
      </ol>

      <p className="text-caption text-muted-foreground">{t('observationsSource')}</p>
    </section>
  );
}
