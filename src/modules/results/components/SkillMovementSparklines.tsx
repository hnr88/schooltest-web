'use client';

import { useTranslations } from 'next-intl';

import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER } from '@/modules/results/lib/display-skills';

/**
 * §4.5 movement sparklines — one row per display skill, from
 * `history[].attributes[skill]`, skipping null sittings (a null is a sitting
 * that did not assess the skill, never a 0).
 *
 * Carried rulings: the section is hidden ENTIRELY when history.length < 2 — a
 * single sitting gets no sparkline section, not an empty one; the row label is
 * the card's `delta_display` verbatim; and Critical gets NO movement row at all
 * (ruling 4a — the gate block carries no growth fields, so there is no movement
 * to chart). Sort: reliable gains desc, then reliable declines (most negative
 * first), then the rest in canonical order.
 */
export interface MovementRow {
  skill: DisplaySkill;
  deltaDisplay: string | null;
  /** One slot per history point; null where that sitting did not assess the skill. */
  points: Array<number | null>;
}

interface RowWithSort extends MovementRow {
  group: 0 | 1 | 2;
  value: number; // gains: the delta (desc); declines: the delta (asc); rest: canonical order
  order: number;
}

export function sparklineRows(view: ResultView): MovementRow[] {
  const history = view.history ?? [];
  if (history.length < 2) return [];

  const rows: RowWithSort[] = [];
  for (const skill of DISPLAY_SKILL_ORDER) {
    if (skill === 'Critical') continue; // ruling 4a: no movement row for the gate card
    const growth = growthOf(view, skill);
    if (growth === null) continue; // an unassessed skill has no movement to chart
    const group: 0 | 1 | 2 = growth.reliable && growth.value !== null && growth.value > 0 ? 0
      : growth.reliable && growth.value !== null && growth.value < 0 ? 1
        : 2;
    rows.push({
      skill,
      deltaDisplay: growth.display,
      points: history.map((point) => point.attributes[skill]),
      group,
      value: group === 0 ? growth.value ?? 0 : group === 1 ? growth.value ?? 0 : DISPLAY_SKILL_ORDER.indexOf(skill),
      order: DISPLAY_SKILL_ORDER.indexOf(skill),
    });
  }
  return rows
    .sort((a, b) => {
      if (a.group !== b.group) return a.group - b.group;
      if (a.group === 0) return b.value - a.value; // reliable gains, largest first
      if (a.group === 1) return a.value - b.value; // reliable declines, most negative first
      return a.order - b.order; // the rest, canonical order
    })
    .map(({ skill, deltaDisplay, points }) => ({ skill, deltaDisplay, points }));
}

type Growth = { reliable: boolean | null; value: number | null; display: string | null } | null;

/** The five attribute-backed skills only — Critical has no growth (ruling 4a), Vocabulary is the blend. */
function growthOf(view: ResultView, skill: Exclude<DisplaySkill, 'Critical'>): Growth {
  if (skill === 'Vocabulary') {
    return { reliable: view.vocab.delta_reliable, value: view.vocab.delta, display: view.vocab.delta_display };
  }
  const attribute = view.attributes[skill];
  if (attribute === undefined || attribute.status === 'not_assessed') return null;
  return {
    reliable: attribute.delta_reliable,
    value: attribute.delta,
    display: attribute.delta_display,
  };
}

const SKILL_KEY: Record<DisplaySkill, string> = {
  Decoding: 'skillDecoding',
  Vocabulary: 'skillVocabulary',
  Grammar: 'skillGrammar',
  Gist: 'skillGist',
  Detail: 'skillDetail',
  Inference: 'skillInference',
  Critical: 'skillCritical',
};

/** Tiny inline polyline over the real points; a single non-null point is a dot. */
export function Sparkline({ points, label }: { points: Array<number | null>; label?: string }) {
  const height = 24;
  const coords = points.map((score, index) =>
    score === null ? null : `${(index / Math.max(points.length - 1, 1)) * 100},${height - (score / 100) * height}`,
  );
  const drawn = coords.filter((c): c is string => c !== null);
  return (
    <svg data-slot="movement-sparkline" viewBox={`0 0 100 ${height}`} className="h-6 w-24" role="img" aria-label={label}>
      {drawn.length >= 2 ? <polyline points={drawn.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /> : null}
      {drawn.map((point) => {
        const [cx, cy] = point.split(',');
        return <circle key={point} cx={cx} cy={cy} r="1.5" className="fill-primary" />;
      })}
    </svg>
  );
}

export function SkillMovementSparklines({ view }: { view: ResultView }) {
  const t = useTranslations('Results');
  const rows = sparklineRows(view);
  if (rows.length === 0) return null;
  return (
    <section data-slot="movement-sparklines" aria-label={t('movementHeading')} className="flex flex-col gap-2">
      <h2 className="text-caption font-bold uppercase tracking-wide text-muted-foreground">{t('movementHeading')}</h2>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.skill} data-slot="movement-row" data-skill={row.skill} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-caption font-semibold">{t(SKILL_KEY[row.skill] ?? row.skill)}</span>
            <Sparkline points={row.points} label={t('ariaScoreMovement')} />
            {row.deltaDisplay !== null ? (
              <span data-slot="movement-delta" data-delta={row.deltaDisplay} className="text-caption font-semibold">
                {row.deltaDisplay === 'steady'
                  ? t('steady')
                  : row.deltaDisplay === 'band_movement'
                    ? t('bandMovement')
                    : t('deltaPts', { arrow: row.deltaDisplay.startsWith('-') ? '↓' : '↑', growth: row.deltaDisplay })}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
