'use client';

import { PencilIcon, UploadIcon, UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { teacherDisplayName } from '@/modules/classes/lib/class-detail.helpers';

import type { ClassDetailHeaderProps } from '@/modules/classes/types/components.types';

// Spec §1 header: class name as the page h1, the assigned teacher and the
// student count as a subtitle, and the two actions. The teacher is DISPLAYED
// here — assignment moved into the edit dialog, so this surface holds no
// checkbox and no save button.
export function ClassDetailHeader({
  schoolClass,
  onEdit,
  onImport,
}: ClassDetailHeaderProps) {
  const t = useTranslations('Classes.detail');
  const teacher = teacherDisplayName(schoolClass.teacher);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{schoolClass.name}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-body">
          <span className="flex items-center gap-1.5">
            <UserIcon className="size-4" aria-hidden />
            {teacher === null ? t('teacherUnassigned') : teacher}
          </span>
          <span aria-hidden className="text-muted-foreground">
            |
          </span>
          <span>{t('studentCount', { count: schoolClass.student_count })}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" variant="outline" onClick={onEdit}>
          <PencilIcon className="size-4" aria-hidden />
          {t('editClass')}
        </Button>
        <Button type="button" size="lg" variant="accent" onClick={onImport}>
          <UploadIcon className="size-4" aria-hidden />
          {t('importStudents')}
        </Button>
      </div>
    </div>
  );
}
