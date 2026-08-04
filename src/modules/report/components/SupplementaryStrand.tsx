'use client';

import { useTranslations } from 'next-intl';

import { Eyebrow, StatusPill } from '@/modules/design-system';
import { SupplementaryBandRow } from '@/modules/report/components/SupplementaryBandRow';
import { useBarReveal } from '@/modules/report/hooks/useBarReveal';
import type { SupplementaryStrandView } from '@/modules/report/types/supplementary.types';
import { SUPPLEMENTARY_SECTION_CLASS } from '@/modules/report/constants/components.constants';

// E11-05 — the vocabulary strand as a SEPARATE card outside the seven modelled
// attribute bars, carrying its own "out of model" pill. Doc 2a s.5.2: the strand
// never touches the R2/L2 switch, so it is never drawn as an eighth attribute
// and never coloured with a mastery status.
export function SupplementaryStrand({ view }: { view: SupplementaryStrandView }) {
  const t = useTranslations('Report');
  const revealed = useBarReveal();

  if (view.state !== 'bands') {
    const key = view.state === 'pending' ? 'supplementaryPending' : 'supplementaryNotApplicable';
    return (
      <section data-slot="report-supplementary" data-state={view.state} className={SUPPLEMENTARY_SECTION_CLASS}>
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow>{t('supplementaryEyebrow')}</Eyebrow>
          <StatusPill tone="info">{t('supplementaryOutOfModel')}</StatusPill>
        </div>
        <p
          data-slot="report-supplementary-absent"
          className="text-body-lg font-semibold text-balance text-muted-foreground"
        >
          {t(key)}
        </p>
        <p className="text-caption text-muted-foreground">{t(`${key}Description`)}</p>
      </section>
    );
  }

  return (
    <section
      data-slot="report-supplementary"
      data-state="bands"
      aria-label={t('supplementaryEyebrow')}
      className={SUPPLEMENTARY_SECTION_CLASS}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow>{t('supplementaryEyebrow')}</Eyebrow>
          <StatusPill tone="info">{t('supplementaryOutOfModel')}</StatusPill>
        </div>
        <p className="text-body-md text-muted-foreground">{t('supplementaryDescription')}</p>
      </div>

      <ul className="flex flex-col">
        {view.bands.map((band, index) => (
          <SupplementaryBandRow key={band.code} band={band} revealed={revealed} index={index} />
        ))}
      </ul>

      {view.qualifiers.length > 0 ? (
        <p data-slot="report-supplementary-qualifier-link" className="text-caption text-body">
          {t('supplementaryQualifierLink', {
            count: view.qualifiers.length,
            qualifiers: view.qualifiers.join(', '),
          })}
        </p>
      ) : null}

      <p className="text-caption text-muted-foreground">{t('supplementarySource')}</p>
    </section>
  );
}
