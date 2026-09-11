'use client';

import { useTranslations } from 'next-intl';

import { STUDENT_CHART_STYLE, STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import { useStudentText } from '@/modules/teacher/hooks/useStudentText';
import type { StudentProgressChartProps } from '@/modules/teacher/types/student-drill-down.types';

const STYLE = STUDENT_CHART_STYLE;

// The overall score per sitting against the ACARA phase levels
// (`Teacher Portal v2.dc.html:404–425`, points `:2039–2043`). Every coordinate is
// `studentChart()`'s; the tooltip names the sitting's month and year, as the design does.
function StudentProgressChart({ chart }: StudentProgressChartProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);
  const { month, monthYear } = useStudentText();

  return (
    <svg
      data-slot="student-progress-chart"
      viewBox={`0 0 ${chart.W} ${chart.H}`}
      role="img"
      aria-label={t('chartLabel')}
      className="block h-auto w-full overflow-visible"
    >
      {chart.bounds.map((bound) => (
        <line
          key={bound.y}
          x1={chart.axisX}
          x2={chart.axisRight}
          y1={bound.y}
          y2={bound.y}
          stroke={STYLE.grid}
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      ))}
      {chart.acara.map((level) => (
        <text key={level.phase} x={chart.phaseLabelX} y={level.y} dy={4} fontSize={11.5} fontWeight={600} fill={STYLE.phaseLabel} textAnchor="end">
          {tVm(level.labelKey)}
        </text>
      ))}
      <line x1={chart.axisX} x2={chart.axisX} y1={STYLE.axisTopY} y2={chart.axisY} stroke={STYLE.axis} strokeWidth={2} />
      <line x1={chart.axisX} x2={chart.axisRight} y1={chart.axisY} y2={chart.axisY} stroke={STYLE.axis} strokeWidth={2} />
      {chart.areaPath === '' ? null : <path d={chart.areaPath} fill={STYLE.line} fillOpacity={0.06} />}
      <polyline points={chart.polyline} fill="none" stroke={STYLE.line} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {chart.points.map((point) => (
        <g key={point.n} data-slot="student-chart-point" data-value={point.value} className="cursor-pointer">
          <title>{tVm('chart.studentTip', { n: point.n, when: monthYear(point.satAt), value: point.value })}</title>
          <circle cx={point.cx} cy={point.cy} r={14} fill="transparent" />
          <circle cx={point.cx} cy={point.cy} r={5} fill={STYLE.pointFill} stroke={STYLE.line} strokeWidth={2.5} />
          <text x={point.valueX} y={point.cy} dy={-13} fontSize={13} fontWeight={600} fill={point.valueFill} textAnchor={point.valueAnchor}>
            {t('percent', { value: point.value })}
          </text>
          <text x={point.labelX} y={chart.xLabelY} fontSize={12} fontWeight={500} fill={STYLE.xLabel} textAnchor="middle">
            {tVm('chart.sitting', { n: point.n })}
          </text>
          <text x={point.labelX} y={chart.xSubY} fontSize={10.5} fill={STYLE.xSub} textAnchor="middle">
            {month(point.satAt)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export { StudentProgressChart };
