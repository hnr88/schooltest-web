'use client';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ClassDeleteDialog } from '@/modules/classes/components/ClassDeleteDialog';
import { useClassRowActions } from '@/modules/classes/hooks/use-class-row-actions';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
} from '@/modules/design-system';

import type { ClassRowActionsProps } from '@/modules/classes/types/components.types';

// Row actions for the class roster: edit (opens the screen-level form dialog)
// and delete behind the C-CLS-04 confirm dialog.
export function ClassRowActions({ schoolClass, onEdit }: ClassRowActionsProps) {
  const t = useTranslations('Classes.actions');
  const { deleteOpen, setDeleteOpen, deletePending, handleDelete } =
    useClassRowActions(schoolClass);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<IconButton icon={MoreHorizontal} label={t('menuLabel', { name: schoolClass.name })} />}
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="min-h-11" onClick={onEdit}>
            {t('edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="min-h-11"
            onClick={() => setDeleteOpen(true)}
          >
            {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ClassDeleteDialog
        schoolClass={schoolClass}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        pending={deletePending}
        onConfirm={handleDelete}
      />
    </>
  );
}
