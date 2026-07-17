import { Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { Badge, Card, CardContent, ProgressBar } from '@/modules/design-system';

const SCORE_ROWS = [
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
    <Card className="rounded-2xl shadow-lg">
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-navy-900"
          >
            <Sparkles className="size-4 text-teal-300" />
          </span>
          <span className="text-sm font-bold">{t('featureDetail.card.title')}</span>
          <Badge variant="accent" className="ml-auto">
            {t('featureDetail.card.badge')}
          </Badge>
        </div>
        <div className="flex flex-col gap-4">
          {SCORE_ROWS.map((row) => (
            <div key={row.scoreKey}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs text-muted-foreground">{t(row.labelKey)}</span>
                <span className="text-xl font-bold tabular-nums">{t(row.scoreKey)}</span>
              </div>
              <ProgressBar
                value={row.value}
                ariaLabel={t('featureDetail.card.scoreLabel', {
                  skill: t(row.labelKey),
                  score: t(row.scoreKey),
                })}
                className={cn('mt-2', row.indicatorClassName)}
              />
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-blue-50 p-4 text-sm leading-relaxed dark:bg-blue-950/40">
          {t.rich('featureDetail.card.suggestion', {
            mark: (chunks) => (
              <mark className="rounded bg-teal-100 px-0.5 text-inherit dark:bg-teal-900">
                {chunks}
              </mark>
            ),
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { AiFeedbackCard };
