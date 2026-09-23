'use client';

import { useTranslations } from 'next-intl';

import { invitedTeacherName } from '@/modules/classes/lib/class-teacher-picker';
import { pendingTeacherLabelKey } from '@/modules/classes/lib/classes-table.helpers';
import type { ClassPendingTeacher } from '@/modules/classes/types/classes.types';

// BUG-006: the ONE rendering of a class's invited teacher — the classes row and
// the class detail header both use it, so the two can never word it
// differently. "Teacher: invited (pending)" while the invitation is open; a reassign
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

  // The name sits ABOVE the badge and the badge may wrap (whitespace-normal
  // beats the table cell's truncate): side by side in a narrow column the long
  // reassign label squeezed the name to nothing and was itself clipped.
  return (
    <span
      className="flex min-w-0 max-w-full flex-col items-start gap-0.5"
      data-slot="class-pending-teacher"
      data-state={pending.state}
      title={`${name} — ${label}`}
    >
      {showName && name !== '' ? (
        <span className="max-w-full truncate" data-slot="class-pending-teacher-name">
          {name}
        </span>
      ) : null}
      <span
        data-slot="class-pending-teacher-badge"
        className={
          pending.state === 'pending'
            ? 'max-w-full whitespace-normal rounded-xl bg-[#EEF1F6] px-2 py-0.5 text-[11.5px] font-semibold leading-snug text-[#0E2350]'
            : 'max-w-full whitespace-normal rounded-xl bg-[#FEF3C7] px-2 py-0.5 text-[11.5px] font-semibold leading-snug text-[#92400E]'
        }
      >
        {label}
      </span>
    </span>
  );
}
