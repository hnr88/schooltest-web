'use client';

import type { ReactNode } from 'react';

/**
 * The mock's four-equal-band strip, shared by the dot map (§3b) and the
 * subskill growth rows (§3d): four equal tints, lightest on the left, with
 * dashed dividers at 25/50/75%. Pure pixels — every mark on the track is
 * positioned by the view model (band geometry or server bands).
 */

/** Beginning → Consolidating, left to right. */
const TRACK_TINTS = ['#F5F7FB', '#EAF0F9', '#DCE6F6', '#C9D8F2'] as const;

const TRACK_GRADIENT = `linear-gradient(90deg, ${TRACK_TINTS[0]} 0 25%, ${TRACK_TINTS[1]} 25% 50%, ${TRACK_TINTS[2]} 50% 75%, ${TRACK_TINTS[3]} 75% 100%)`;

/** The band columns' spacers, shared with the band header so the four columns line up with the tracks. */
export const TRACK_NAME_COL = 'w-16 flex-none sm:w-28';
export const TRACK_SCORE_COL = 'w-11 flex-none';

/** A fraction (0–1) as the track's percentage string. */
export function trackPct(position: number): string {
  return `${position * 100}%`;
}

/** The banded 30px strip: gradient + dashed dividers, marks absolutely positioned inside. */
function ProgressBandTrack({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[30px] min-w-0 flex-1" style={{ background: TRACK_GRADIENT }}>
      <div aria-hidden="true" className="absolute top-0 bottom-0 border-l border-dashed left-1/4" style={{ borderColor: '#C9D4E8' }} />
      <div aria-hidden="true" className="absolute top-0 bottom-0 border-l border-dashed left-1/2" style={{ borderColor: '#C9D4E8' }} />
      <div aria-hidden="true" className="absolute top-0 bottom-0 border-l border-dashed left-3/4" style={{ borderColor: '#C9D4E8' }} />
      {children}
    </div>
  );
}

/** One labelled band column of the header row: phase name + live "{n} students". */
export interface ProgressBandColumn {
  id: string;
  label: string;
  count: string;
}

/** The band header: name spacer, four equal labelled columns, end spacer — widths match the rows. */
function ProgressBandHeader({ columns, endCol }: { columns: readonly ProgressBandColumn[]; endCol: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={TRACK_NAME_COL} aria-hidden="true" />
      <div className="grid min-w-0 flex-1 grid-cols-4">
        {columns.map((column) => (
          <div key={column.id} data-slot="progress-band-column" data-band={column.id} className="flex min-w-0 flex-col items-center gap-0.5 pb-2">
            <span className="max-w-full truncate px-1 text-[12px] font-semibold text-navy-900">{column.label}</span>
            <span className="max-w-full truncate px-1 text-[11px] text-[#6B7280] tabular-nums">{column.count}</span>
          </div>
        ))}
      </div>
      <div className={endCol} aria-hidden="true" />
    </div>
  );
}

export { ProgressBandTrack, ProgressBandHeader };
