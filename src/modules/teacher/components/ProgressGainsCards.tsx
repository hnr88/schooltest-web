'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { formatDelta } from '@/modules/teacher/lib/teacher-kit';
import type { ProgressMover } from '@/modules/teacher/types/v2-class-tabs.types';
import type { ProgressGainsCardsProps } from '@/modules/teacher/types/progress-tab.types';

/**
 * §3c — "Highest overall gains" / "Lowest overall gains": up to four students each,
 * ranked by the SERVER's reliability-gated `overall.delta` (never a raw first→latest
 * recomputation). The printed number is the server delta spelled "+{n} pts".
 */

const GAIN_TOP = { icon: TrendingUp, iconFg: '#1F7A4D', noteFg: '#4B5563' } as const;
const GAIN_LOW = { icon: TrendingDown, iconFg: '#B42318', noteFg: '#92610B' } as const;

/** A negative reliable delta reads red with a down arrow; a small positive one stays amber (mock `.note`/`.arrow`). */
const GAIN_BACK_FG = '#B42318';

interface GainsCardProps {
  variant: 'top' | 'low';
  movers: readonly ProgressMover[];
}

function GainsCard({ variant, movers }: GainsCardProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const skin = variant === 'top' ? GAIN_TOP : GAIN_LOW;
  const Icon = skin.icon;
  const headingId = `progress-gains-${variant}`;

  return (
    <section
      data-slot={variant === 'top' ? 'progress-gains-top' : 'progress-gains-low'}
      aria-labelledby={headingId}
      className="min-w-[200px] flex-[1_1_220px] rounded-[11px] border border-[#ECEEF2] bg-white px-[18px] py-4"
    >
      <h3 id={headingId} className="flex items-center gap-2 text-[13px] font-semibold text-navy-900">
        <Icon aria-hidden="true" strokeWidth={2} className="size-[15px] flex-none" style={{ color: skin.iconFg }} />
        {t(variant === 'top' ? 'gains.topTitle' : 'gains.lowTitle')}
      </h3>
      {movers.length === 0 ? (
        <p data-slot="progress-gains-empty" className="mt-2.5 border-t border-[#F3F4F6] pt-2.5 text-[12.5px] text-[#6B7280]">
          {t('gains.empty')}
        </p>
      ) : (
        <ul className="mt-2.5 flex flex-col">
          {movers.map((mover) => {
            // The server's own delta; `points` is its display parse — never a recomputation.
            const value = mover.growth.points ?? mover.growth.delta;
            const { text, direction } = formatDelta(value, 'signed');
            const back = variant === 'low' && direction === 'down';
            const fg = back ? GAIN_BACK_FG : skin.noteFg;
            return (
              <li
                key={mover.studentDocumentId}
                data-slot="progress-gain"
                data-student-id={mover.studentDocumentId}
                data-direction={direction}
                className="flex items-center gap-2.5 border-t border-[#F3F4F6] py-2"
              >
                <span
                  data-slot="progress-gain-name"
                  title={mover.name}
                  className="max-w-[78px] flex-none truncate text-[13.5px] font-medium text-navy-900"
                >
                  {mover.firstName}
                </span>
                <span data-slot="progress-gain-note" className="ml-auto text-[12px] whitespace-nowrap tabular-nums" style={{ color: fg }}>
                  {t('points', { value: text })}
                </span>
                {direction === 'up' || direction === 'down' ? (
                  <span aria-hidden="true" className="text-[13px] font-bold" style={{ color: variant === 'top' ? skin.iconFg : fg }}>
                    {direction === 'down' ? '↓' : '↑'}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ProgressGainsCards({ top, low }: ProgressGainsCardsProps) {
  return (
    <div data-slot="progress-gains" className="rounded-[12px] border border-[#ECEEF2] bg-[#FAFBFC] px-6 py-[22px]">
      <div className="flex flex-wrap gap-3.5">
        <GainsCard variant="top" movers={top} />
        <GainsCard variant="low" movers={low} />
      </div>
    </div>
  );
}

export { ProgressGainsCards };
