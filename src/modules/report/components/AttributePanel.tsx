'use client';

import { useTranslations } from 'next-intl';

import { Eyebrow } from '@/modules/design-system';
import { AttributeMasteryRow } from '@/modules/report/components/AttributeMasteryRow';
import { useBarReveal } from '@/modules/report/hooks/useBarReveal';
import type { AttributePanelView } from '@/modules/report/types/attribute.types';

const SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-150 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

// E11-03 — the modelled attribute bars, built from the live C-4 `attributes`
// map. An absent map is NOT an empty list: it resolves through the same
// derived/pending/not_applicable machine as every other crosswalk-derived field
// on this report, so the panel can never contradict the header.
export function AttributePanel({ view }: { view: AttributePanelView }) {
  const t = useTranslations('Report');
  const revealed = useBarReveal();

  if (view.state !== 'rows') {
    const key = view.state === 'not_derived' ? 'attributesNotDerived' : 'attributesNotApplicable';
    return (
      <section data-slot="report-attributes" data-state={view.state} className={SECTION_CLASS}>
        <Eyebrow>{t('attributesEyebrow')}</Eyebrow>
        <p
          data-slot="report-attributes-absent"
          className="text-body-lg font-semibold text-balance text-muted-foreground"
        >
          {t(key)}
        </p>
        <p className="text-caption text-muted-foreground">{t(`${key}Description`)}</p>
      </section>
    );
  }

  const scaleMax = view.evidence.state === 'assessed' ? view.evidence.maxItems : 0;

  return (
    <section
      data-slot="report-attributes"
      data-state="rows"
      aria-label={t('attributesEyebrow')}
      className={SECTION_CLASS}
    >
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{t('attributesEyebrow')}</Eyebrow>
        <p className="text-body-md text-muted-foreground">{t('attributesDescription')}</p>
      </div>

      <ul className="flex flex-col gap-0.5">
        {view.rows.map((row, index) => (
          <AttributeMasteryRow
            key={row.code}
            row={row}
            scaleMax={scaleMax}
            revealed={revealed}
            index={index}
          />
        ))}
      </ul>

      {view.missingStandardError ? (
        <p data-slot="report-attributes-se-absent" className="text-caption text-muted-foreground">
          {t('confidenceIntervalAbsent')}
        </p>
      ) : null}

      <p className="text-caption text-muted-foreground">{t('attributesSource')}</p>
    </section>
  );
}
