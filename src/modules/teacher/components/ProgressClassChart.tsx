'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { CLASS_CHART_STYLE, PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { CHART_LABEL_KEY, VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import type { ProgressClassChartProps } from '@/modules/teacher/types/progress-tab.types';

const STYLE = CLASS_CHART_STYLE;

// The ACARA-banded class chart (`Teacher Portal v2.dc.html:901–919`). Every coordinate is
// `acaraChart()`'s: one point per sitting the roster history really holds, its month from
// that sitting's own `sat_at`. With no sitting the bands and axes draw and no line does.
function ProgressClassChart({ chart }: ProgressClassChartProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);
  const format = useFormatter();
  const month = (iso: string | null) =>
    iso === null ? '' : format.dateTime(new Date(iso), { month: 'short', timeZone: 'UTC' });
  const monthYear = (iso: string | null) =>
    iso === null ? '' : format.dateTime(new Date(iso), { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <svg
      data-slot="class-progress-chart"
      data-points={chart.points.length}
      viewBox={`0 0 ${chart.W} ${chart.H}`}
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label={t('chart.label')}
      className="block h-auto w-full overflow-visible"
    >
      {chart.bands.map((band) => (
        <g key={band.phase}>
          <rect x={chart.axisX} y={band.y} width={chart.bandW} height={band.h} fill={band.fill} />
          <text x={chart.phaseLabelX} y={band.midY} dy={4} fontSize={11} fontWeight={600} fill={STYLE.bandLabel} textAnchor="end">
            {tVm(band.labelKey)}
          </text>
        </g>
      ))}
      <line x1={chart.axisX} x2={chart.axisX} y1={chart.axisTop} y2={chart.axisY} stroke={STYLE.axis} strokeWidth={1.5} />
      <line x1={chart.axisX} x2={chart.axisRight} y1={chart.axisY} y2={chart.axisY} stroke={STYLE.axis} strokeWidth={1.5} />
      <polyline points={chart.polyline} fill="none" stroke={STYLE.line} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {chart.points.map((point) => (
        <g key={point.n} data-slot="class-chart-point" data-sitting={point.n} data-value={point.value} className="cursor-pointer">
          <title>{tVm(CHART_LABEL_KEY.classTip, { n: point.n, when: monthYear(point.satAt), value: point.value })}</title>
          <circle cx={point.cx} cy={point.cy} r={15} fill="transparent" />
          <circle cx={point.cx} cy={point.cy} r={5} fill={STYLE.pointFill} stroke={STYLE.line} strokeWidth={2.5} />
          <text x={point.valueX} y={point.cy} dy={-13} fontSize={13} fontWeight={700} fill={point.valueFill} textAnchor={point.valueAnchor}>
            {t('percent', { value: point.value })}
          </text>
          <text x={point.labelX} y={chart.xLabelY} fontSize={11.5} fontWeight={500} fill={STYLE.xLabel} textAnchor="middle">
            {tVm(CHART_LABEL_KEY.sitting, { n: point.n })}
          </text>
          <text x={point.labelX} y={chart.xSubY} fontSize={10.5} fill={STYLE.xSub} textAnchor="middle">
            {month(point.satAt)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export { ProgressClassChart };
