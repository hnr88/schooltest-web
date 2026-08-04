'use client';

import { useTranslations } from 'next-intl';

import { ClassMemberChecklist } from '@/modules/classes/components/ClassMemberChecklist';
import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import { childDisplayName, type SchoolChild } from '@/modules/school-children';

import type { ClassStudentPickerProps } from '@/modules/classes/types/components.types';

function toOption(child: SchoolChild): ClassMemberOption {
  return {
    value: child.documentId,
    label: childDisplayName(child),
    // The child's current class, so a move in from another class is visible.
    hint: child.class?.name ?? undefined,
  };
}

// Active children (C-CHD-01) as a controlled multi-select for the class
// roster. Archived members are not offered here; the assignment hook keeps
// them in the replacement list so a save never unlinks them.
export function ClassStudentPicker({ students, value, onChange }: ClassStudentPickerProps) {
  const t = useTranslations('Classes.detail');

  return (
    <section
      aria-labelledby="class-detail-students-heading"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="class-detail-students-heading" className="text-lg font-semibold text-foreground">
          {t('studentsTitle')}
        </h2>
        <p className="text-sm text-body">{t('studentsDescription')}</p>
      </div>
      <ClassMemberChecklist
        idPrefix="class-detail-student"
        options={students.map(toOption)}
        value={value}
        onChange={onChange}
        emptyText={t('studentsEmpty')}
      />
    </section>
  );
}
