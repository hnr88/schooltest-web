'use client';

import { useTranslations } from 'next-intl';

import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { INSIGHTS_FLAG_CHIP_TONE } from '@/modules/teacher/constants/results.constants';
import type { SubskillMasteryRowProps } from '@/modules/teacher/types/class-analytics.types';

// One Reading mastery row (`:782–795`): the subskill, its Class focus / Class strength
// chip, the class mean in its band colour over an 8px bar, and "n of N secure" counted
// from the API's `secure` status (Critical reading: how many passed the exit gate).
function SubskillMasteryRow({ row }: SubskillMasteryRowProps) {
  const t = useTranslations('TeacherPortal.insights');
  const tv = useTranslations('TeacherPortal.viewModel');
  const noValue = useTranslations('TeacherPortal.kit')('noValue');
  const count =
    row.assessed === 0
      ? t('mastery.notAssessed')
      : row.secure !== null
        ? t('mastery.secure', { secure: row.secure, total: row.assessed })
        : row.gatePassed !== null
          ? t('mastery.gatePassed', { passed: row.gatePassed, total: row.assessed })
          : noValue;

  return (
    <li
      data-slot="insights-mastery-row"
      data-skill={row.skill}
      data-mean={row.mean ?? undefined}
      data-secure={row.secure ?? undefined}
      data-assessed={row.assessed}
      data-flag={row.flag?.kind}
    >
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className="text-[13.5px] font-semibold text-navy-900">{tv(row.labelKey)}</span>
        {row.flag === null ? null : (
          <ToneChip tone={INSIGHTS_FLAG_CHIP_TONE[row.flag.kind]} size="xs">
            {tv(row.flag.labelKey)}
          </ToneChip>
        )}
        <span className="ml-auto text-[13px] font-semibold tabular-nums" style={{ color: row.tone.fg }}>
          {row.mean === null ? noValue : t('percent', { value: row.mean })}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-[9px]">
        <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: row.tone.bg }}>
          <div className="h-full rounded-full" style={{ width: `${row.mean ?? 0}%`, background: row.tone.fg }} />
        </div>
        <span className="min-w-16 text-right text-[11.5px] whitespace-nowrap text-[#6B7280]">{count}</span>
      </div>
    </li>
  );
}

export { SubskillMasteryRow };
