'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { SubjectProgressTone } from '@/modules/design-system';
import { CEFR_LADDER_SIZE, getBandRank } from '@/modules/children/lib/child-skills';
import type { ChildSkillSummary } from '@/modules/children/types/children.types';

interface ChildSkillTileProps {
  summary: ChildSkillSummary;
  skillLabel: string;
}

// Same class table as the DS SubjectProgressCard so the painted tile is
// pixel-identical to §5.3: white card, hairline, 14px radius, 18/20 padding,
// 10px stack, 7px track with the subject-categorical fill.
const VALUE_CLASSES: Record<SubjectProgressTone, string> = {
  primary: 'text-primary',
  accent: 'text-teal-600',
  warning: 'text-warning-ink',
  success: 'text-success-ink',
  danger: 'text-danger-ink',
};

const FILL_CLASSES: Record<SubjectProgressTone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  warning: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-destructive',
};

// §5.3 subject tile for a CEFR band.
//
// This does NOT route through the DS SubjectProgressCard, and the reason is
// semantic, not cosmetic: that card renders a ProgressBar, i.e. a base-ui
// `role="progressbar"` that publishes `aria-valuenow` AND an auto-formatted
// `aria-valuetext="83%"`. The parent contract publishes no percentage anywhere —
// the only ordinal it has is the CEFR band — so a screen reader was being told
// "83%" about a card whose visible value is "B2". That is a false statement
// about a child's result.
//
// Here the bar is what it actually is: a picture of the band's place on the
// published six-band ladder. It carries `role="img"` with an honest, non-
// percentage name ("Reading: CEFR B2, level 5 of 6"), and an unbanded skill —
// which has no ladder position — gets no claim at all, only `aria-hidden`.
// The visible value label is unchanged and still prints the band.
export function ChildSkillTile({ summary, skillLabel }: ChildSkillTileProps) {
  const t = useTranslations('Children');
  const ladderLabel = summary.band
    ? t('skillLadderLabel', {
        skill: skillLabel,
        band: summary.band,
        rank: getBandRank(summary.band),
        total: CEFR_LADDER_SIZE,
      })
    : undefined;

  return (
    <article
      data-slot="child-skill-tile"
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-card px-5 py-4.5"
    >
      <div className="flex items-baseline justify-between gap-2 text-body-sm">
        <span className="truncate font-bold text-foreground">{skillLabel}</span>
        <span className={cn('shrink-0 font-bold tabular-nums', VALUE_CLASSES[summary.tone])}>
          {summary.band ?? t('notBanded')}
        </span>
      </div>
      <div
        data-slot="child-skill-ladder"
        role={ladderLabel ? 'img' : undefined}
        aria-label={ladderLabel}
        aria-hidden={ladderLabel ? undefined : true}
        className="h-1.75 w-full overflow-hidden rounded-full bg-divider"
      >
        {/* transform, never width — rules/tailwind.md §9 */}
        <div
          className={cn(
            'h-full w-full origin-left rounded-full transition-transform duration-500 ease-out-expo motion-reduce:transition-none',
            FILL_CLASSES[summary.tone],
          )}
          style={{ transform: `scaleX(${summary.value / 100})` }}
        />
      </div>
      <span className="text-meta text-muted-foreground">
        {t('skillResultCount', { count: summary.count })}
      </span>
    </article>
  );
}
