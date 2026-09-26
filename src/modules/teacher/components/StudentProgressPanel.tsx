'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { cn } from '@/lib/utils';
import { StudentProgressChart } from '@/modules/teacher/components/StudentProgressChart';
import { DELTA_COLOURS } from '@/modules/teacher/constants/teacher-kit.constants';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { useStudentText } from '@/modules/teacher/hooks/useStudentText';
import { studentBandChart } from '@/modules/teacher/lib/v2/chart-geometry';
import type { StudentProgressPanelProps } from '@/modules/teacher/types/student-drill-down.types';

// "Reading progress" (Spec 02 §3b, `02 Student report.html:207–285`): the
// equal-height ACARA band chart and, beside it, the 2×2 grid of baseline, latest,
// growth and sittings — all from the v2 view model's scored sittings. A tile
// without a value prints the kit dash, never a number.
function StudentProgressPanel({ view }: StudentProgressPanelProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tKit = useTranslations('TeacherPortal.kit');
  const { month } = useStudentText();
  const headingId = useId();
  const chart = studentBandChart(
    view.chartPoints.map((point, index) => ({ n: index + 1, satAt: point.satAt, value: point.overall })),
  );

  const datedLabel = (key: string, undatedKey: string, satAt: string | null) =>
    satAt === null ? t(undatedKey) : t(key, { month: month(satAt) });

  const { baseline, latest, sittings } = view.tiles;
  const { growth } = view;
  const growthValue =
    growth.direction === null
      ? null
      : growth.direction === 'flat'
        ? t('tiles.growthFlat')
        : t(growth.direction === 'up' ? 'tiles.growthUp' : 'tiles.growthDown', { points: Math.abs(growth.delta ?? 0) });

  const tiles = [
    {
      id: 'baseline' as const,
      label: datedLabel('tiles.baseline', 'tiles.baselineUndated', baseline?.satAt ?? null),
      value: baseline === null ? null : t('percent', { value: baseline.overall }),
      fg: null,
    },
    {
      id: 'latest' as const,
      label: datedLabel('tiles.latest', 'tiles.latestUndated', latest?.satAt ?? null),
      value: latest === null ? null : t('percent', { value: latest.overall }),
      fg: null,
    },
    { id: 'growth' as const, label: t('tiles.growth'), value: growthValue, fg: growth.direction === null ? null : DELTA_COLOURS[growth.direction] },
    {
      id: 'sittings' as const,
      label: t('tiles.sittings'),
      value:
        sittings === 0
          ? null
          : baseline === null
            ? t('tiles.sittingsCount', { count: sittings })
            : t('tiles.sittingsSince', { count: sittings, month: month(baseline.satAt) }),
      fg: null,
    },
  ];

  return (
    <section
      data-slot="student-progress"
      aria-labelledby={headingId}
      className="rounded-[16px] border border-[#E6EBF3] bg-white px-[22px] py-5 shadow-[0_1px_3px_rgba(14,35,80,0.05)]"
    >
      <div className="min-w-0">
        <h2 id={headingId} className="text-[16px] font-semibold text-navy-900">
          {t('progressCardTitle')}
        </h2>
        <p className="mt-[3px] text-[12.5px] text-[#6B7280]">{t('progressCardSubtitle')}</p>
      </div>
      <div className="mt-[14px] flex flex-wrap items-center gap-6">
        <div className="max-w-[520px] min-w-[min(280px,100%)] flex-[1_1_380px]">
          <StudentProgressChart chart={chart} />
        </div>
        <dl
          data-slot="student-progress-tiles"
          className="grid min-w-[min(190px,100%)] flex-[1_1_200px] grid-cols-2 gap-2.5"
        >
          {tiles.map((tile) => (
            <div key={tile.id} data-tile={tile.id} className="rounded-[12px] bg-[#F5F8FD] px-[15px] py-[13px]">
              <dt className="text-[10.5px] font-semibold tracking-[0.05em] text-[#6B7280] uppercase">
                {tile.label}
              </dt>
              <dd
                className={cn('mt-[5px] text-[17px] font-semibold tabular-nums', tile.fg ?? 'text-navy-900')}
              >
                {tile.value ?? tKit('noValue')}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export { StudentProgressPanel };
