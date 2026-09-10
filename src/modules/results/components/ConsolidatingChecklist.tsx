'use client';

import { useTranslations } from 'next-intl';

import type { ResultView } from '@schooltest/scoring-contracts';

import { cn } from '@/lib/utils';

/**
 * §4.7 — the Path to Consolidating checklist. DISPLAY LOGIC ONLY: the phase
 * itself still comes from `acara_phase`; this screen derives nothing. Rows are
 * Inference / Vocab_B1 / Gist / Detail with `met = status === "secure"` — and
 * the Vocab B1 row deliberately reads the RAW `Vocab_B1` attribute, not the
 * blended Vocabulary display skill: that is the spec's intent and the one
 * place the two vocabularies legitimately diverge. The gate row is
 * `met = gate.passed === true` — null is NOT false, it is "Section 3 not
 * reached" (the same distinction the critical card renders).
 *
 * When `acara_phase === "consolidating"` the checklist is replaced by the
 * meets-all-requirements banner.
 */
const ATTRIBUTE_KEY: Record<string, string> = {
  Inference: 'attrInference',
  'Vocab_B1': 'attrVocabularyB1',
  Gist: 'attrGist',
  Detail: 'attrDetail',
};

export function ConsolidatingChecklist({ view }: { view: ResultView }) {
  const t = useTranslations('Results');

  if (view.acara_phase === 'consolidating') {
    return (
      <section data-slot="consolidating-banner" aria-label={t('checklistHeading')} className="flex flex-col gap-1">
        <h2 className="text-caption font-bold uppercase tracking-wide text-muted-foreground">{t('checklistHeading')}</h2>
        <p data-slot="consolidating-banner-text" className="rounded-tile bg-success-soft px-3 py-2 text-body font-semibold text-success-ink">
          {t('consolidatingMet')}
        </p>
      </section>
    );
  }

  const attributeRows = (['Inference', 'Vocab_B1', 'Gist', 'Detail'] as const).map((attribute) => {
    const entry = view.attributes[attribute];
    const assessed = entry !== undefined && entry.status !== 'not_assessed';
    return {
      key: attribute,
      label: t(ATTRIBUTE_KEY[attribute] ?? attribute),
      met: assessed && entry.status === 'secure',
      current: assessed ? entry.domain_score : null,
    };
  });

  return (
    <section data-slot="consolidating-checklist" aria-label={t('checklistHeading')} className="flex flex-col gap-2">
      <h2 className="text-caption font-bold uppercase tracking-wide text-muted-foreground">{t('checklistHeading')}</h2>
      <ul className="flex flex-col gap-1.5">
        {attributeRows.map((row) => (
          <li key={row.key} data-slot="checklist-row" data-row={row.key} data-met={row.met} className="flex items-center justify-between gap-2">
            <span className="text-body-md font-semibold">
              <span aria-hidden className={cn('mr-2', row.met ? 'text-success-ink' : 'text-muted-foreground')}>
                {row.met ? '✓' : '○'}
              </span>
              {row.label}
            </span>
            <span className="text-caption tabular-nums text-muted-foreground">
              {row.current === null ? t('notAssessedThisSitting') : t('scorePercent', { score: row.current })}
            </span>
          </li>
        ))}
        <li data-slot="checklist-row" data-row="gate" data-met={view.gate.passed === true} className="flex items-center justify-between gap-2">
          <span className="text-body-md font-semibold">
            <span aria-hidden className={cn('mr-2', view.gate.passed === true ? 'text-success-ink' : 'text-muted-foreground')}>
              {view.gate.passed === true ? '✓' : '○'}
            </span>
            {t('exitGateSection3')}
          </span>
          <span className="text-caption tabular-nums text-muted-foreground">
            {view.gate.passed === null
              ? t('section3NotReached')
              : view.gate.domain_score === null
                ? '—'
                : t('scorePercent', { score: view.gate.domain_score })}
          </span>
        </li>
      </ul>
    </section>
  );
}
