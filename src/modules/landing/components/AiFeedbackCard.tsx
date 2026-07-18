import { Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Badge, ProgressBar } from '@/modules/design-system';

const SCORE_TILES = [
  {
    labelKey: 'featureDetail.card.grammar',
    scoreKey: 'featureDetail.card.scoreGrammar',
    value: 85,
    indicatorClassName: '[&_[data-slot=progress-indicator]]:bg-blue-600',
  },
  {
    labelKey: 'featureDetail.card.vocabulary',
    scoreKey: 'featureDetail.card.scoreVocabulary',
    value: 70,
    indicatorClassName: '[&_[data-slot=progress-indicator]]:bg-teal-500',
  },
  {
    labelKey: 'featureDetail.card.coherence',
    scoreKey: 'featureDetail.card.scoreCoherence',
    value: 65,
    indicatorClassName: '[&_[data-slot=progress-indicator]]:bg-navy-900',
  },
] as const;

async function AiFeedbackCard() {
  const t = await getTranslations('Home');

  return (
    <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-teal-50 p-7 dark:border-navy-800 dark:from-navy-900 dark:to-navy-950">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-lg bg-navy-900"
        >
          <Sparkles className="size-4 text-teal-300" />
        </span>
        <span className="text-base font-bold">{t('featureDetail.card.title')}</span>
        <Badge variant="accent" className="ml-auto">
          {t('featureDetail.card.badge')}
        </Badge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {SCORE_TILES.map((tile) => (
          <div key={tile.scoreKey} className="rounded-xl border border-border bg-card p-3.5">
            <div className="text-xs text-muted-foreground">{t(tile.labelKey)}</div>
            <div className="mt-0.5 text-xl font-bold tabular-nums">{t(tile.scoreKey)}</div>
            <ProgressBar
              value={tile.value}
              ariaLabel={t('featureDetail.card.scoreLabel', {
                skill: t(tile.labelKey),
                score: t(tile.scoreKey),
              })}
              className={`mt-2 ${tile.indicatorClassName}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-border bg-card p-3.5 text-sm leading-relaxed text-muted-foreground">
        {t.rich('featureDetail.card.suggestion', {
          mark: (chunks) => (
            <mark className="rounded-md bg-teal-100 px-1.5 py-0.5 font-semibold text-foreground dark:bg-teal-900">
              {chunks}
            </mark>
          ),
        })}
      </div>
    </div>
  );
}

export { AiFeedbackCard };
