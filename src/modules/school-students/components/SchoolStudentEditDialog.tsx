'use client';

import { useTranslations } from 'next-intl';

import { SCHOOL_ADMIN_ROLE_TYPE } from '@/modules/auth';
import { useMeQuery } from '@/modules/auth';
import { useAuthStore } from '@/modules/auth';
import type { SchoolClass } from '@/modules/classes';
import {
  OpsDialog,
  OpsDialogContent,
  OpsDialogHeader,
} from '@/modules/design-system';
import { SchoolStudentForm } from '@/modules/school-students/components/SchoolStudentForm';
import { studentDisplayName } from '@/modules/school-students/hooks/use-student-row-actions';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

import type { SchoolStudentEditDialogProps } from '@/modules/school-students/types/components.types';

// Edit shell (C-CHD-03): mounts the form fresh per student so its defaults
// always match the row being edited. The ACARA phase control stays behind the
// school_admin role check (D-10), same as the add form. Modal chrome on the
// OpsDialog kit (School Admin design: student modal, 560px).
export function SchoolStudentEditDialog({ student, classes, onClose }: SchoolStudentEditDialogProps) {
  const t = useTranslations('SchoolStudents.form');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const meQuery = useMeQuery(hydrated && Boolean(token));
  const showAcaraPhase = meQuery.data?.role?.type === SCHOOL_ADMIN_ROLE_TYPE;

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[560px]">
        <OpsDialogHeader
          title={t('editTitle', { name: studentDisplayName(student) })}
          sub={t('editDescription')}
        />
        <SchoolStudentForm
          target={{ mode: 'edit', student }}
          classes={classes}
          showAcaraPhase={showAcaraPhase}
          onCancel={onClose}
          onDone={onClose}
          modal
        />
      </OpsDialogContent>
    </OpsDialog>
  );
}
