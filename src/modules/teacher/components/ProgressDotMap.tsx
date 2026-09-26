'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  ProgressBandHeader,
  ProgressBandTrack,
  TRACK_NAME_COL,
  TRACK_SCORE_COL,
  trackPct,
} from '@/modules/teacher/components/ProgressBandTrack';
import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { acaraPhaseKey } from '@/modules/teacher/lib/teacher-kit';
import type { DotMapRow, DotMapView } from '@/modules/teacher/types/v2-class-tabs.types';
import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';
import type { ProgressDotMapProps } from '@/modules/teacher/types/progress-tab.types';

/**
 * §3b "Reading progress by student" — the dot map. Dot = first sitting, arrowhead = latest,
 * each placed by the ACARA band geometry (`bandPosition` on the row model); the ARROW is
 * drawn only for server-RELIABLE movers (`overall.delta_reliable` on the model) — otherwise
 * a single dot. "Latest only" is client UI state and never changes the model.
 */

/** Navy right arrow = moved up; red left arrow = went back (§0.1). */
const MOVEMENT_FG = { up: '#0E2350', back: '#B42318' } as const;

/** The held/latest marker's fill deepens with the band (mock `rows[].fill`). */
const LATEST_FILL: Readonly<Record<AcaraPhaseName, string>> = {
  Beginning: '#A9C4EE',
  Emerging: '#5A82CE',
  Developing: '#2C4C97',
  Consolidating: '#16295A',
};

type DotMode = 'growth' | 'latest';

/** The tooltip's "{month}" slot, in the reading locale; months arrive as 1–12 on the model. */
function monthLabel(locale: string, month: number): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2026, month - 1, 1)),
  );
}

/** The start dot (10px, movement ink) at the first sitting's position. */
function StartDot({ position, fg }: { position: number; fg: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
      style={{
        left: trackPct(position),
        background: fg,
        boxShadow: `0 0 0 1px ${fg}`,
        boxSizing: 'border-box',
      }}
    />
  );
}

/** The single latest marker (16px, band-deepened fill): 'held' rows, and every row in "Latest only". */
function LatestDot({ position, fill }: { position: number; fill: string }) {
  return (
    <div
      aria-hidden="true"
      data-dot="latest"
      className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
      style={{
        left: trackPct(position),
        background: fill,
        boxShadow: '0 0 0 1px #0E2350',
        boxSizing: 'border-box',
      }}
    />
  );
}

function DotMapRowView({ row, mode, tip }: { row: DotMapRow; mode: DotMode; tip: string }) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const firstPct = row.first.position * 100;
  const latestPct = row.latest.position * 100;
  const draws = mode === 'growth' && row.movement !== 'held';
  const fg = row.movement === 'back' ? MOVEMENT_FG.back : MOVEMENT_FG.up;
  const span = Math.abs(latestPct - firstPct);
  // The 8px head-end gap keeps the line clear of the arrowhead (mock `lineW`).
  const lineStyle =
    row.movement === 'back'
      ? { left: `calc(${latestPct}% + 8px)`, width: `calc(${span}% - 8px)` }
      : { left: `${firstPct}%`, width: `calc(${span}% - 8px)` };

  return (
    <div
      data-slot="progress-dot-row"
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
                row.movement === 'back'
                  ? {
                      left: `${latestPct}%`,
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent',
                      borderRight: `12px solid ${fg}`,
                    }
                  : {
                      left: `${latestPct}%`,
                      marginLeft: '-12px',
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent',
                      borderLeft: `12px solid ${fg}`,
                    }
              }
            />
            <StartDot position={row.first.position} fg={fg} />
          </>
        ) : (
          <LatestDot position={row.latest.position} fill={LATEST_FILL[row.latest.phase]} />
        )}
      </ProgressBandTrack>
      <span
        className={cn(
          TRACK_SCORE_COL,
          'py-1 pr-1.5 text-right text-[12.5px] font-semibold text-navy-900 tabular-nums',
        )}
      >
        {t('percent', { value: row.latest.score })}
      </span>
    </div>
  );
}

function ProgressDotMap({ dotMap }: ProgressDotMapProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const locale = useLocale();
  const [mode, setMode] = useState<DotMode>('growth');
  const { rows, phases, summary } = dotMap;

  return (
    <section
      data-slot="progress-dot-map"
      aria-labelledby="progress-dot-map-heading"
      className="rounded-[12px] border border-[#ECEEF2] bg-[#FAFBFC] px-6 py-[22px]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3.5">
        <div className="min-w-0">
          <h3 id="progress-dot-map-heading" className="text-[15px] font-semibold text-navy-900">
            {t('dotMap.title')}
          </h3>
          <p className="mt-[3px] max-w-[60ch] text-[12.5px] text-[#6B7280]">{t('dotMap.sub')}</p>
        </div>
        <div
          role="group"
          aria-label={t('dotMap.title')}
          data-slot="progress-dot-modes"
          className="flex flex-none gap-0.5 rounded-[9px] bg-[#EEF1F6] p-[3px]"
        >
          {(
            [
              ['growth', t('dotMap.modeGrowth')],
              ['latest', t('dotMap.modeLatest')],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              data-slot="progress-dot-mode"
              data-mode={value}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'h-[30px] rounded-[7px] px-[13px] text-[12.5px] font-semibold',
                mode === value
                  ? 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(14,35,80,0.12)]'
                  : 'text-[#4B5563]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p data-slot="progress-dot-empty" className="mt-4 text-[12.5px] text-[#6B7280]">
          {t('dotMap.empty')}
        </p>
      ) : (
        <>
          <div
            role="region"
            tabIndex={0}
            aria-label={t('dotMap.title')}
            className="mt-[18px] overflow-x-auto"
          >
            <div className="min-w-[520px] sm:min-w-0">
              <div>
                <ProgressBandHeader
                  columns={phases.map((phase) => ({
                    id: phase.phase,
                    label: t(`dotMap.phases.${acaraPhaseKey(phase.phase)}`),
                    count: t('dotMap.studentsCount', { count: phase.count }),
                  }))}
                  endCol={TRACK_SCORE_COL}
                />
              </div>
              <div className="flex flex-col">
                {rows.map((row) => (
                  <DotMapRowView
                    key={row.studentDocumentId}
                    row={row}
                    mode={mode}
                    tip={t('dotMap.tooltip', {
                      name: row.name,
                      firstMonth: monthLabel(locale, row.first.month),
                      firstPct: row.first.score,
                      firstPhase: t(`dotMap.phases.${acaraPhaseKey(row.first.phase)}`),
                      latestMonth: monthLabel(locale, row.latest.month),
                      latestPct: row.latest.score,
                      latestPhase: t(`dotMap.phases.${acaraPhaseKey(row.latest.phase)}`),
                    })}
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
                style={{ background: MOVEMENT_FG.up }}
              />
              <span
                aria-hidden="true"
                className="h-[2.5px] w-[22px]"
                style={{ background: MOVEMENT_FG.up }}
              />
              <span
                aria-hidden="true"
                className="mr-2 border-y-[6px] border-l-[10px] border-y-transparent"
                style={{ borderLeftColor: MOVEMENT_FG.up }}
              />
              {t('dotMap.legendUp')}
            </span>
            <span className="inline-flex items-center text-[12px] text-[#4B5563]">
              <span
                aria-hidden="true"
                className="border-y-[6px] border-r-[10px] border-y-transparent"
                style={{ borderRightColor: MOVEMENT_FG.back }}
              />
              <span
                aria-hidden="true"
                className="h-[2.5px] w-[22px]"
                style={{ background: MOVEMENT_FG.back }}
              />
              <span
                aria-hidden="true"
                className="mr-2 size-2.5 rounded-full"
                style={{ background: MOVEMENT_FG.back }}
              />
              {t('dotMap.legendBack')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[#4B5563]">
              <span
                aria-hidden="true"
                className="size-3.5 rounded-full border-2 border-white"
                style={{
                  background: LATEST_FILL.Emerging,
                  boxShadow: '0 0 0 1px #0E2350',
                  boxSizing: 'border-box',
                }}
              />
              {t('dotMap.endLabel')}
            </span>
            <span
              data-slot="progress-dot-summary"
              className="ml-auto text-[13px] font-medium text-[#4B5563]"
            >
              {t('dotMap.classSummary', {
                up: summary.up,
                total: rows.length,
                held: summary.held,
                down: summary.down,
              })}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export { ProgressDotMap };
