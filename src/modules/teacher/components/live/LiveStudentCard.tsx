'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { LiveRowMenu } from '@/modules/teacher/components/live/LiveRowMenu';
import { LiveSelectBox } from '@/modules/teacher/components/live/LiveSelectBox';
import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import {
  LIVE_CONNECTION_TONE,
  LIVE_STATUS_TONE,
} from '@/modules/teacher/constants/live-students.constants';
import { rowActionsFor } from '@/modules/teacher/lib/live-student-actions';
import { detailOf } from '@/modules/teacher/lib/live-students';
import type { LiveRowActionKey, LiveStudentRow } from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:1158–1205 — one student card: tick box, avatar,
// name over email (amber when the roster holds none), the status chip with the
// connection chip beside it, and the detail line.
function LiveStudentCard({
  row,
  selected,
  interactive,
  retried,
  onToggle,
  onAction,
}: {
  row: LiveStudentRow;
  selected: boolean;
  interactive: boolean;
  retried: ReadonlySet<string>;
  onToggle: (studentId: string) => void;
  onAction: (key: LiveRowActionKey, row: LiveStudentRow) => void;
}) {
  const t = useTranslations('TeacherPortal.live.students');
  const tKit = useTranslations('TeacherPortal.kit');
  const actions = rowActionsFor(row, retried);
  const detail = detailOf(row);

  return (
    <article
      data-slot="live-student-card"
      data-student-id={row.studentId}
      data-status={row.status}
      className={cn(
        'flex flex-col gap-[13px] rounded-[12px] border border-[#ECEEF2] px-4 py-[15px]',
        selected ? 'bg-[#F7F9FC]' : 'bg-transparent',
      )}
    >
      <div className="flex items-start gap-[11px]">
        <LiveSelectBox
          state={selected ? 'all' : 'none'}
          label={t('selectOne', { name: row.name })}
          onToggle={() => onToggle(row.studentId)}
          className="mt-px"
        />
        <InitialsAvatar name={row.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold text-navy-900">{row.name}</p>
          {row.hasIdentity ? (
            <p
              data-slot="live-student-email"
              className={cn('mt-px truncate text-[12px]', row.email === null ? 'text-[#92610B]' : 'text-[#6B7280]')}
            >
              {row.email ?? t('emailNeeded')}
            </p>
          ) : null}
        </div>
        {interactive && actions.length > 0 ? (
          <LiveRowMenu row={row} actions={actions} onSelect={onAction} />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ToneChip tone={LIVE_STATUS_TONE[row.status]} size="lg">
          {t(`status.${row.status}`)}
        </ToneChip>
        {row.connection === null ? null : (
          <ToneChip tone={LIVE_CONNECTION_TONE[row.connection]} size="sm" className="py-1 font-medium">
            {t(`connection.${row.connection}`)}
          </ToneChip>
        )}
      </div>
      <p data-slot="live-student-detail" className="text-[12.5px] leading-[1.4] text-[#6B7280]">
        {detail === null ? tKit('noValue') : t(`detail.${detail.key}`, detail.values)}
      </p>
    </article>
  );
}

export { LiveStudentCard };
