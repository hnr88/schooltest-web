'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { LiveBatchKind } from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:1166–1178 — the batch bar over the selected
// students: each action prints how many of the selection it can act on, and
// runs the single-student endpoint over exactly those (there is no batch API).
function LiveBatchBar({
  tallies,
  selectedCount,
  onRun,
  onClear,
}: {
  tallies: readonly { kind: LiveBatchKind; hit: number }[];
  selectedCount: number;
  onRun: (kind: LiveBatchKind) => void;
  onClear: () => void;
}) {
  const t = useTranslations('TeacherPortal.live.students');
  return (
    <div data-slot="live-batch-bar" role="group" aria-label={t('batch.label')} className="flex flex-wrap items-center gap-2">
      {tallies.map(({ kind, hit }) => (
        <button
          key={kind}
          type="button"
          data-batch={kind}
          onClick={() => onRun(kind)}
          className={cn(
            'inline-flex h-8 items-center gap-[7px] rounded-[8px] border border-[#E5E7EB] bg-white px-[13px]',
            'text-[13px] font-semibold transition-colors hover:border-navy-900 motion-reduce:transition-none',
            KIT_FOCUS_RING,
            kind === 'absent' ? 'text-[#B42318]' : 'text-navy-900',
          )}
        >
          {t(`batch.${kind}.label`)}
          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            {t('batch.tally', { hit, selected: selectedCount })}
          </span>
        </button>
      ))}
      <button
        type="button"
        data-slot="live-batch-clear"
        onClick={onClear}
        className={cn('h-8 rounded-full px-3 text-[13px] font-semibold text-[#6B7280] hover:text-navy-900', KIT_FOCUS_RING)}
      >
        {t('clear')}
      </button>
    </div>
  );
}

export { LiveBatchBar };
