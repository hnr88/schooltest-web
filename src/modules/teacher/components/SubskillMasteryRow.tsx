'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { ProgressBar } from '@/modules/design-system';
import type { SubskillMasteryRowProps } from '@/modules/teacher/types/class-analytics.types';

// One bar of the insights tab (task 34, dashboard §3): the skill's name, the
// class AVERAGE as the bar's WIDTH ONLY, the "Mastered n of N" count read as
// `status === "secure"` from the API — never recomputed from a score — and the
// exclusion stated in words when any student lacks the skill ("n of N assessed").
//
// The bar carries no band colour and no cut: a class AVERAGE is not a posterior,
// the ACARA band cuts live on posteriors, and no client-side threshold maps one
// to the other (open-risk R2c). Length is decoration; the numbers are the claim.
function SubskillMasteryRow({ entry, secure, totalStudents }: SubskillMasteryRowProps) {
  const t = useTranslations('Teacher.results.insights');
  const format = useFormatter();
  const assessed = totalStudents - entry.excluded;

  return (
    <li
      data-slot="subskill-mastery-row"
      data-attribute={entry.skill}
      data-excluded={entry.excluded}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm font-medium text-foreground">{entry.skill}</span>
        <span className="shrink-0 text-meta font-semibold text-muted-foreground tabular-nums">
          {secure === null
            ? t('averageOnly', { average: format.number(entry.average, { maximumFractionDigits: 1 }) })
            : t('masteredCount', { mastered: secure, assessed })}
        </span>
      </div>

      <ProgressBar value={entry.average} ariaLabel={t('barLabel', { name: entry.skill })} />

      {entry.excluded > 0 ? (
        <p className="text-meta text-muted-foreground">
          {t('excludedNote', { assessed, total: totalStudents })}
        </p>
      ) : null}
    </li>
  );
}

export { SubskillMasteryRow };
