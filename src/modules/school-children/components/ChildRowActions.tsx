'use client';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
} from '@/modules/design-system';
import { ArchiveChildDialog } from '@/modules/school-children/components/ArchiveChildDialog';
import {
  childDisplayName,
  useChildRowActions,
} from '@/modules/school-children/hooks/use-child-row-actions';
import type { SchoolChild } from '@/modules/school-children/types/school-children.types';

import type { ChildRowActionsProps } from '@/modules/school-children/types/components.types';

// Row actions for the children roster: edit (opens the screen-level edit
// dialog) and, for active children, archive behind the C-CHD-04 confirm.
export function ChildRowActions({ child, onEdit }: ChildRowActionsProps) {
  const t = useTranslations('SchoolChildren.actions');
  const { archiveOpen, setArchiveOpen, archivePending, handleArchive } =
    useChildRowActions(child);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton icon={MoreHorizontal} label={t('menuLabel', { name: childDisplayName(child) })} />
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="min-h-11" onClick={onEdit}>
            {t('edit')}
          </DropdownMenuItem>
          {child.status === 'active' ? (
            <DropdownMenuItem
              variant="destructive"
              className="min-h-11"
              onClick={() => setArchiveOpen(true)}
            >
              {t('archive')}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <ArchiveChildDialog
        child={child}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        pending={archivePending}
        onConfirm={handleArchive}
      />
    </>
  );
}
