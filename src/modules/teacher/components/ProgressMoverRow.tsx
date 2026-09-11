'use client';

import { useTranslations } from 'next-intl';

import { DeltaText } from '@/modules/teacher/components/v2/DeltaText';
import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { GROWTH_STEADY_KEY, VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import type { ProgressMoverRowProps } from '@/modules/teacher/types/progress-tab.types';

// One student in Top progress / Students to watch (`Teacher Portal v2.dc.html:929–934`):
// first name, latest score, and the server's growth claim — its signed step, "steady"
// within error, or the dash when the server compared nothing.
function ProgressMoverRow({ mover }: ProgressMoverRowProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);
  const tKit = useTranslations('TeacherPortal.kit');
  const { growth } = mover;

  return (
    <li
      data-slot="progress-mover"
      data-student-id={mover.studentDocumentId}
      data-growth={growth.kind}
      className="flex items-center gap-2.5 border-t border-[#F3F4F6] py-2"
    >
      <span
        data-slot="progress-mover-name"
        title={mover.name}
        className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-navy-900"
      >
        {mover.firstName}
      </span>
      <span data-slot="progress-mover-score" className="text-[12.5px] text-[#6B7280] tabular-nums">
        {mover.score === null ? tKit('noValue') : t('percent', { value: mover.score })}
      </span>
      <span data-slot="progress-mover-delta" className="min-w-[34px] text-right">
        {growth.kind === 'steady' ? (
          <span className="text-[12.5px] font-semibold text-[#6B7280]">{tVm(GROWTH_STEADY_KEY)}</span>
        ) : (
          <DeltaText value={growth.points} format="signed" size="sm" />
        )}
      </span>
    </li>
  );
}

export { ProgressMoverRow };
