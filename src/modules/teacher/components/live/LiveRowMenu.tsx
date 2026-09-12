'use client';

import { EllipsisVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { LiveRowAction, LiveRowActionKey, LiveStudentRow } from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:1180–1196 (S23a) — the row's kebab popover: 220px
// wide on #FAFBFC, items 13.5px/500, the destructive one in #B42318.
function LiveRowMenu({
  row,
  actions,
  onSelect,
}: {
  row: LiveStudentRow;
  actions: readonly LiveRowAction[];
  onSelect: (key: LiveRowActionKey, row: LiveStudentRow) => void;
}) {
  const t = useTranslations('TeacherPortal.live.students');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="live-row-menu"
        aria-label={t('menuLabel', { name: row.name })}
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-[8px] bg-transparent text-[#6B7280]',
          'transition-colors hover:bg-[#F5F6F8] data-[popup-open]:bg-[#EEF1F6] motion-reduce:transition-none',
        )}
      >
        <EllipsisVertical aria-hidden="true" className="size-[17px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="w-auto min-w-[220px] rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] p-1.5 shadow-[0_18px_34px_rgba(14,35,80,0.16)] ring-0"
      >
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            data-action={action.key}
            className={cn(
              'rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium focus:bg-[#F5F6F8]',
              action.destructive ? 'text-[#B42318] focus:text-[#B42318]' : 'text-navy-900 focus:text-navy-900',
            )}
            onClick={() => onSelect(action.key, row)}
          >
            {t(`action.${action.key}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { LiveRowMenu };
