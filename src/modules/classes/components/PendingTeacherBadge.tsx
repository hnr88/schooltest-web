'use client';

import { useTranslations } from 'next-intl';

import { invitedTeacherName } from '@/modules/classes/lib/class-teacher-picker';
import { pendingTeacherLabelKey } from '@/modules/classes/lib/classes-table.helpers';
import type { ClassPendingTeacher } from '@/modules/classes/types/classes.types';

// BUG-006: the ONE rendering of a class's invited teacher — the classes row and
// the class detail header both use it, so the two can never word it
// differently. "Invited (pending)" while the invitation is open; a reassign
// call once it expired or was revoked.
export function PendingTeacherBadge({
  pending,
  showName,
}: {
  pending: ClassPendingTeacher;
  showName: boolean;
}) {
  const table = useTranslations('Classes.table');
  const name = invitedTeacherName(pending);
  const label = table(pendingTeacherLabelKey(pending.state));

  return (
    <span
      className="flex min-w-0 items-center gap-1.5"
      data-slot="class-pending-teacher"
      data-state={pending.state}
      title={`${name} — ${label}`}
    >
      {showName && name !== '' ? <span className="truncate">{name}</span> : null}
      <span
        className={
          pending.state === 'pending'
            ? 'shrink-0 rounded-full bg-[#EEF1F6] px-2 py-0.5 text-[11.5px] font-semibold text-[#0E2350]'
            : 'shrink-0 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11.5px] font-semibold text-[#92400E]'
        }
      >
        {label}
      </span>
    </span>
  );
}
