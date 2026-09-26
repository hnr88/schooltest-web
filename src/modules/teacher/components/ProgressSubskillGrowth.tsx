'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  ProgressBandHeader,
  ProgressBandTrack,
  TRACK_NAME_COL,
} from '@/modules/teacher/components/ProgressBandTrack';
import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { BAND_RANK } from '@/modules/teacher/constants/v2-thresholds.constants';
import type { AssessedBand } from '@schooltest/scoring-contracts';
import type { SubMapRow, SubSkillMap } from '@/modules/teacher/types/v2-class-tabs.types';
import type { ProgressSubskillGrowthProps } from '@/modules/teacher/types/progress-tab.types';

/**
 * §3d "Subskill growth by student" — chips pick one of the EIGHT band-carrying
 * subskills (Critical is absent by construction, §0.1); rows are PHASES ONLY:
 * dot = the server band at the first sitting (`attribute_bands`), arrowhead = the
 * server band at the latest (`attributes[skill].status` / `academic_vocab.band`).
 * A row whose first sitting predates BUG-009 draws a dot at its latest band and
 * asserts no movement. BAND_RANK here only places a server band on the four-band
 * strip — no score is ever thresholded.
 */

const MOVE_FG = { up: '#0E2350', held: '#5B6472', down: '#B42318' } as const;

/** The held dot's grey (mock `dotFill`). */
const HELD_FILL = '#5B6472';

/** A server band's column on the four-equal-band strip: the band's own centre. */
function bandCenter(band: AssessedBand): number {
  return (BAND_RANK[band] + 0.5) * 25;
}

/** A band reads the ACARA phase of the same rank (not_yet → Beginning … secure → Consolidating). */
function phaseKey(band: AssessedBand): 'beginning' | 'emerging' | 'developing' | 'consolidating' {
  return band === 'not_yet' ? 'beginning' : band === 'secure' ? 'consolidating' : band;
}

function SubMapRowView({ row, tip }: { row: SubMapRow; tip: string }) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const fg = MOVE_FG[row.movement];
  const draws = row.movement !== 'held' && row.first !== null;
  const from = row.first === null ? bandCenter(row.latest.band) : bandCenter(row.first.band);
  const to = bandCenter(row.latest.band);
  const span = Math.abs(to - from);
  // Down rows point LEFT at the latest band, so the line reserves its 8px head gap there.
  const lineStyle =
    row.movement === 'down'
      ? { left: `calc(${to}% + 8px)`, width: `calc(${span}% - 8px)` }
      : { left: `${from}%`, width: `calc(${span}% - 8px)` };

  return (
    <div
      data-slot="progress-submap-row"
      data-student-id={row.studentDocumentId}
      data-movement={row.movement}
      title={tip}
      className="flex items-center gap-3 rounded-[7px] hover:bg-[#F5F6F8]"
    >
      <span
        className={cn(TRACK_NAME_COL, 'truncate py-1 pl-1.5 text-[13px] font-medium text-navy-900')}
        title={row.name}
      >
        {row.firstName}
      </span>
      <span className="sr-only">{tip}</span>
      <ProgressBandTrack>
        {draws ? (
          <>
            <div
              aria-hidden="true"
              className="absolute top-[14px] h-[2.5px]"
              style={{ ...lineStyle, background: fg }}
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 -translate-y-1/2"
              style={
                row.movement === 'down'
                  ? {
                      left: `${to}%`,
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent',
                      borderRight: `12px solid ${fg}`,
                    }
                  : {
                      left: `${to}%`,
                      marginLeft: '-12px',
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent',
                      borderLeft: `12px solid ${fg}`,
                    }
              }
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
              style={{
                left: `${from}%`,
                background: fg,
                boxShadow: `0 0 0 1px ${fg}`,
                boxSizing: 'border-box',
              }}
            />
          </>
        ) : (
          <div
            aria-hidden="true"
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
            style={{
              left: `${to}%`,
              background: HELD_FILL,
              boxShadow: `0 0 0 1px ${HELD_FILL}`,
              boxSizing: 'border-box',
            }}
          />
        )}
      </ProgressBandTrack>
      <span
        data-slot="progress-submap-move"
        data-movement={row.movement}
        className="w-[76px] flex-none py-1 pr-1.5 text-right text-[12px] font-semibold whitespace-nowrap"
        style={{ color: fg }}
      >
        {row.movement === 'up'
          ? t('subMap.moveUp', { count: row.phases })
          : row.movement === 'down'
            ? t('subMap.moveDown', { count: row.phases })
            : t('subMap.moveHeld')}
      </span>
    </div>
  );
}

function ProgressSubskillGrowth({ maps }: ProgressSubskillGrowthProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const tKit = useTranslations('TeacherPortal.kit');
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const active = maps[index] ?? maps[0];

  if (active === undefined) return null;

  const skillLabel = t(`subMap.skills.${active.skill}`);
  const monthOf = (month: number | null) =>
    month === null
      ? tKit('noValue')
      : new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(
          new Date(Date.UTC(2026, month - 1, 1)),
        );
  const phaseLabel = (band: AssessedBand) => t(`subMap.phases.${phaseKey(band)}`);

  return (
    <section
      data-slot="progress-submap"
      aria-labelledby="progress-submap-heading"
      className="rounded-[12px] border border-[#ECEEF2] bg-[#FAFBFC] px-6 py-[22px]"
    >
      <div className="min-w-0">
        <h3 id="progress-submap-heading" className="text-[15px] font-semibold text-navy-900">
          {t('subMap.title')}
        </h3>
        <p className="mt-[3px] max-w-[62ch] text-[12.5px] text-[#6B7280]">{t('subMap.sub')}</p>
      </div>
      <div data-slot="progress-submap-chips" className="mt-3.5 flex flex-wrap gap-1.5">
        {maps.map((map, at) => (
          <button
            key={map.skill}
            type="button"
            data-slot="progress-submap-chip"
            data-skill={map.skill}
            aria-pressed={at === index}
            onClick={() => setIndex(at)}
            className={cn(
              'h-8 rounded-full border px-[13px] text-[12.5px] font-semibold whitespace-nowrap',
              at === index
                ? 'border-[#0E2350] bg-[#0E2350] text-white'
                : 'border-[#E4E9F2] bg-white text-navy-900',
            )}
          >
            {t(`subMap.skills.${map.skill}`)}
          </button>
        ))}
      </div>

      {active.rows.length === 0 ? (
        <p data-slot="progress-submap-empty" className="mt-4 text-[12.5px] text-[#6B7280]">
          {t('subMap.empty')}
        </p>
      ) : (
        <>
          <div
            role="region"
            tabIndex={0}
            aria-label={t('subMap.title')}
            className="mt-[18px] overflow-x-auto"
          >
            <div className="min-w-[520px] sm:min-w-0">
              <div>
                <ProgressBandHeader
                  columns={active.phases.map((phase) => ({
                    id: phase.band,
                    label: phaseLabel(phase.band),
                    count: t('subMap.studentsCount', { count: phase.count }),
                  }))}
                  endCol="w-[76px] flex-none"
                />
              </div>
              <div className="flex flex-col">
                {active.rows.map((row) => (
                  <SubMapRowView
                    key={row.studentDocumentId}
                    row={row}
                    tip={
                      row.first === null
                        ? t('subMap.tooltipLatest', {
                            name: row.name,
                            skill: skillLabel,
                            latestPhase: phaseLabel(row.latest.band),
                            latestMonth: monthOf(row.latest.month),
                          })
                        : t('subMap.tooltip', {
                            name: row.name,
                            skill: skillLabel,
                            firstPhase: phaseLabel(row.first.band),
                            firstMonth: monthOf(row.first.month),
                            latestPhase: phaseLabel(row.latest.band),
                            latestMonth: monthOf(row.latest.month),
                          })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-[18px] border-t border-[#ECEEF2] pt-3.5">
            <span className="inline-flex items-center text-[12px] text-[#4B5563]">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ background: MOVE_FG.up }}
              />
              <span
                aria-hidden="true"
                className="h-[2.5px] w-[22px]"
                style={{ background: MOVE_FG.up }}
              />
              <span
                aria-hidden="true"
                className="mr-2 border-y-[6px] border-l-[10px] border-y-transparent"
                style={{ borderLeftColor: MOVE_FG.up }}
              />
              {t('subMap.legendUp')}
            </span>
            <span className="inline-flex items-center text-[12px] text-[#4B5563]">
              <span
                aria-hidden="true"
                className="border-y-[6px] border-r-[10px] border-y-transparent"
                style={{ borderRightColor: MOVE_FG.down }}
              />
              <span
                aria-hidden="true"
                className="h-[2.5px] w-[22px]"
                style={{ background: MOVE_FG.down }}
              />
              <span
                aria-hidden="true"
                className="mr-2 size-2.5 rounded-full"
                style={{ background: MOVE_FG.down }}
              />
              {t('subMap.legendBack')}
            </span>
            <span className="inline-flex items-center gap-2 text-[12px] text-[#4B5563]">
              <span
                aria-hidden="true"
                className="size-3 rounded-full border-2 border-white"
                style={{
                  background: HELD_FILL,
                  boxShadow: `0 0 0 1px ${HELD_FILL}`,
                  boxSizing: 'border-box',
                }}
              />
              {t('subMap.legendHeld')}
            </span>
            <span
              data-slot="progress-submap-summary"
              className="ml-auto text-[13px] font-medium text-[#4B5563]"
            >
              {t('subMap.summary', {
                skill: skillLabel,
                up: active.summary.up,
                held: active.summary.held,
                down: active.summary.down,
              })}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export { ProgressSubskillGrowth };
