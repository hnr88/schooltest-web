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
import { ArchiveStudentDialog } from '@/modules/school-students/components/ArchiveStudentDialog';
import {
  studentDisplayName,
  useStudentRowActions,
} from '@/modules/school-students/hooks/use-student-row-actions';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

import type { StudentRowActionsProps } from '@/modules/school-students/types/components.types';

// Row actions for the students roster: edit (opens the screen-level edit
// dialog) and, for active students, archive behind the C-CHD-04 confirm.
export function StudentRowActions({ student, onEdit }: StudentRowActionsProps) {
  const t = useTranslations('SchoolStudents.actions');
  const { archiveOpen, setArchiveOpen, archivePending, handleArchive } =
    useStudentRowActions(student);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton icon={MoreHorizontal} label={t('menuLabel', { name: studentDisplayName(student) })} />
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="min-h-11" onClick={onEdit}>
            {t('edit')}
          </DropdownMenuItem>
          {student.status === 'active' ? (
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
      <ArchiveStudentDialog
        student={student}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        pending={archivePending}
        onConfirm={handleArchive}
      />
    </>
  );
}
