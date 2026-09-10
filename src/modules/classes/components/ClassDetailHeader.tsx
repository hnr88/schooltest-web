'use client';

import { PencilIcon, UploadIcon, UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ClassTeacherPanel } from '@/modules/classes/components/ClassTeacherPanel';
import { Button } from '@/modules/design-system';

import type { ClassDetailHeaderProps } from '@/modules/classes/types/components.types';

// Spec §1 header: class name as the page h1, the student count as a subtitle,
// the assigned teachers as removable chips with their own picker dialog, and
// the two actions. This surface still holds no checkbox and no save button.
export function ClassDetailHeader({
  schoolClass,
  onEdit,
  onImport,
}: ClassDetailHeaderProps) {
  const t = useTranslations('Classes.detail');

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{schoolClass.name}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-body">
          <span className="flex items-center gap-1.5">
            <UserIcon className="size-4" aria-hidden />
            {t('studentCount', { count: schoolClass.student_count })}
          </span>
        </div>
        <ClassTeacherPanel schoolClass={schoolClass} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" variant="secondary" onClick={onEdit}>
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
