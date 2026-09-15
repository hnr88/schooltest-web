'use client';

import { useTranslations } from 'next-intl';

import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import { resultViewsOf } from '@/modules/results';
import { PATTERN_KEY } from '@/modules/results/lib/commentary-fallback';
import type { RosterRow } from '@/modules/results';

interface ClassErrorPatternRow {
  readonly type: string;
  readonly keyFragment: string | null;
  readonly students: number;
  readonly avgPct: number;
}

export interface ClassErrorPatternsCardProps {
  readonly rows: readonly RosterRow[];
}

/**
 * Teaching insights · Error patterns (TEA-005). The class-level roll-up of the
 * same `error_patterns` the R scorer writes per result — one row per slip type,
 * with how many students show it and their average share of wrong answers.
 * Built ONLY from the result views the panel already holds: a class with no
 * pattern data renders nothing, so the section can never claim a pattern the
 * scoring data does not carry.
 */
export function ClassErrorPatternsCard({ rows }: ClassErrorPatternsCardProps) {
  const t = useTranslations('TeacherPortal.insights');
  const tResults = useTranslations('Results');

  const views = resultViewsOf(rows);
  const total = views.length;
  const seen = new Map<string, { students: number; pctSum: number }>();
  for (const view of views) {
    for (const pattern of view.error_patterns) {
      const entry = seen.get(pattern.type) ?? { students: 0, pctSum: 0 };
      entry.students += 1;
      entry.pctSum += pattern.pct;
      seen.set(pattern.type, entry);
    }
  }
  if (seen.size === 0 || total === 0) return null;

  const rowsOut: readonly ClassErrorPatternRow[] = [...seen.entries()]
    .map(([type, entry]) => ({
      type,
      keyFragment: PATTERN_KEY[type] ?? null,
      students: entry.students,
      avgPct: Math.round(entry.pctSum / entry.students),
    }))
    .sort((a, b) => b.students - a.students || b.avgPct - a.avgPct)
    .slice(0, 4);
  const maxPct = Math.max(...rowsOut.map((row) => row.avgPct));

  return (
    <SectionCard
      data-insights-section="error-patterns"
      title={t('errorPatterns.title')}
      description={t('errorPatterns.description')}
    >
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {rowsOut.map((row) => (
          <li
            key={row.type}
            data-slot="insights-error-pattern"
            data-type={row.type}
            data-students={row.students}
            className="rounded-[10px] border border-[#ECEEF2] px-5 py-[18px]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span
                className="truncate text-[15px] font-semibold text-navy-900"
                title={row.keyFragment === null ? row.type : tResults(`errorPattern.${row.keyFragment}.label`)}
              >
                {row.keyFragment === null ? row.type : tResults(`errorPattern.${row.keyFragment}.label`)}
              </span>
              <span className="text-[12.5px] tabular-nums text-[#6B7280]">{row.avgPct}%</span>
            </div>
            <span className="mt-2 block h-1.5 w-full rounded-full bg-[#EEF1F6]">
              <span
                data-slot="insights-error-pattern-bar"
                className="block h-full rounded-full bg-warning"
                style={{ width: `${maxPct === 0 ? 0 : (row.avgPct / maxPct) * 100}%` }}
              />
            </span>
            <div className="mt-[3px] text-[12.5px] text-[#6B7280]">
              {t('errorPatterns.students', { count: row.students, total })}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
