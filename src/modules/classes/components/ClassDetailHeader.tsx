'use client';

import { UploadIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ClassTeacherPanel } from '@/modules/classes/components/ClassTeacherPanel';
import { classBadge } from '@/modules/classes/lib/classes-table.helpers';
import { Button } from '@/modules/design-system';

import type { ClassDetailHeaderProps } from '@/modules/classes/types/components.types';

// Spec §1 header: the design's 56px navy badge with the class's leading word,
// the class name as the ONLY h1, the student count and the assigned-teacher
// panel beneath it, and the two 42px radius-12 actions (white Edit class, navy
// Import students). This surface still holds no checkbox and no save button.
export function ClassDetailHeader({
  schoolClass,
  onEdit,
  onImport,
}: ClassDetailHeaderProps) {
  const t = useTranslations('Classes.detail');

  return (
    <div className="flex flex-wrap items-center gap-[18px]">
      <span
        aria-hidden="true"
        className="grid size-14 flex-none place-items-center rounded-panel bg-navy-900 text-base font-bold text-white"
      >
        {classBadge(schoolClass.name)}
      </span>
      <div className="min-w-[200px] flex-1">
        <h1 className="text-portal-heading font-medium text-foreground">{schoolClass.name}</h1>
        <p className="mt-1 text-body-md text-[#7C8698]">
          {t('studentCount', { count: schoolClass.student_count })}
        </p>
        <ClassTeacherPanel schoolClass={schoolClass} />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="white"
          className="h-[42px] rounded-tile border border-portal-input px-[18px] text-[13.5px] font-semibold hover:border-navy-900 hover:bg-white"
          onClick={onEdit}
        >
          {t('editClass')}
        </Button>
        <Button
          type="button"
          variant="navy"
          className="h-[42px] gap-2 rounded-tile px-[18px] text-[13.5px] font-semibold"
          onClick={onImport}
        >
          <UploadIcon className="size-3.5" strokeWidth={2} aria-hidden />
          {t('importStudents')}
        </Button>
      </div>
    </div>
  );
}
