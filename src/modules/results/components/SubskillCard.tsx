'use client';

import { useTranslations } from 'next-intl';

import type { Band, DisplaySkill } from '@schooltest/scoring-contracts';

import { cn } from '@/lib/utils';

/**
 * One of the seven subskill cards (dashboard §4.4), driven by the data layer's
 * displaySkills() mapping (task 29) plus the view for the per-skill growth and
 * the vocab/critical detail lines.
 *
 * Honest-rendering rules (data contract §8): a not-assessed skill is a VISIBLE
 * GAP — grey card, "Not yet assessed", no bar, no percentage, never 0. The
 * delta is `delta_display` VERBATIM from the contract ("steady" muted,
 * "band_movement" rendered as "{band_before} → {band_after}", a signed integer
 * as-is); the client never computes or re-thresholds a delta. Critical Reading
 * is a deliberately DIFFERENT card: no band chip exists for it (ruling — the
 * four bands are posterior cuts and the gate has no posterior), so it shows a
 * gate state line instead, styled as designed rather than looking broken.
 */
const SKILL_KEY: Record<DisplaySkill, string> = {
  Decoding: 'skillDecoding',
  Vocabulary: 'skillVocabulary',
  Grammar: 'skillGrammar',
  Gist: 'skillGist',
  Detail: 'skillDetail',
  Inference: 'skillInference',
  Critical: 'skillCritical',
};

export function SubskillCard({
  skill,
  domainScore,
  status,
  deltaDisplay,
  bandBefore,
  bandAfter,
  strandLine,
  gatePassed,
  tag,
}: {
  skill: DisplaySkill;
  domainScore: number | null;
  /** A real band for the six banded cards; null on the gate-state card (Critical). */
  status: Band | null;
  deltaDisplay: string | null;
  bandBefore?: string;
  bandAfter?: string;
  strandLine?: string | null;
  gatePassed?: boolean | null;
  tag?: 'strength' | 'focus';
}) {
  const t = useTranslations('Results');
  const assessed = domainScore !== null;

  return (
    <li
      data-slot="skill-card"
      data-skill={skill}
      data-band={status === null ? undefined : status}
      data-assessed={assessed}
      data-tag={tag}
      className={cn(
        'flex min-h-28 flex-col gap-1 rounded-tile px-3.5 py-3',
        assessed ? 'bg-card' : 'bg-muted text-muted-foreground',
        tag === 'strength' && 'ring-1 ring-success',
        tag === 'focus' && 'ring-1 ring-warning',
      )}
    >
      <span className="text-meta font-semibold">{t(SKILL_KEY[skill] ?? skill)}</span>

      {!assessed ? (
        <span data-slot="skill-gap" className="text-caption font-semibold">
          {t('notYetAssessed')}
        </span>
      ) : (
        <>
          <span data-slot="skill-score" className="text-h3 font-bold tabular-nums">
            {domainScore}%
          </span>
          {/* The bar is the score's own length — a visual of the number above it, never a threshold. */}
          <span className="h-1.5 w-full rounded-full bg-muted">
            <span data-slot="skill-bar" className="block h-full rounded-full bg-primary" style={{ width: `${domainScore}%` }} />
          </span>
        </>
      )}

      {assessed && isAssessedBand(status) ? (
        <span
          data-slot="skill-band"
          data-band={status}
          className={cn('w-fit rounded-full px-2 py-0.5 text-caption font-bold uppercase', BAND_CHIP_CLASS[status])}
        >
          {t(BAND_KEY[status] ?? status)}
        </span>
      ) : null}

      {deltaDisplay === 'band_movement' ? (
        <span data-slot="skill-delta" data-delta="band_movement" className="text-caption font-semibold">
          {bandBefore !== undefined &&
          bandAfter !== undefined &&
          Object.hasOwn(BAND_KEY, bandBefore) &&
          Object.hasOwn(BAND_KEY, bandAfter)
            ? `${t(BAND_KEY[bandBefore as keyof typeof BAND_KEY])} → ${t(BAND_KEY[bandAfter as keyof typeof BAND_KEY])}`
            : t('bandMovement')}
        </span>
      ) : deltaDisplay === 'steady' ? (
        <span data-slot="skill-delta" data-delta="steady" className="text-caption text-muted-foreground">
          {t('steady')}
        </span>
      ) : deltaDisplay !== null ? (
        <span data-slot="skill-delta" data-delta={deltaDisplay} className="text-caption font-semibold">
          {t('deltaPts', { arrow: deltaDisplay.startsWith('-') ? '↓' : '↑', growth: deltaDisplay })}
        </span>
      ) : null}

      {strandLine !== undefined && strandLine !== null ? (
        <span data-slot="vocab-strand-line" className="text-caption text-muted-foreground">{strandLine}</span>
      ) : null}

      {gatePassed !== undefined ? (
        <span
          data-slot="gate-state"
          data-gate={gatePassed === null ? 'not_reached' : gatePassed ? 'passed' : 'not_yet'}
          className="text-caption font-semibold"
        >
          {gatePassed === null ? t('section3NotReached') : t('exitGate', { state: gatePassed ? t('gatePassedState') : t('gateNotYetState') })}
        </span>
      ) : null}
    </li>
  );
}

export const BAND_CHIP_CLASS = {
  secure: 'bg-success-soft text-success-ink',
  developing: 'bg-info-soft text-info-ink',
  emerging: 'bg-warning-soft text-warning-ink',
  not_yet: 'bg-danger-soft text-danger-ink',
} as const;

const BAND_KEY: Record<keyof typeof BAND_CHIP_CLASS, string> = {
  secure: 'bandSecure',
  developing: 'bandDeveloping',
  emerging: 'bandEmerging',
  not_yet: 'bandNotYet',
};

const ASSESSED_BANDS: readonly string[] = Object.keys(BAND_KEY);

/** A gap card (including a not-assessed vocab blend) never renders a chip. */
function isAssessedBand(status: Band | null): status is keyof typeof BAND_CHIP_CLASS {
  return status !== null && ASSESSED_BANDS.includes(status);
}
