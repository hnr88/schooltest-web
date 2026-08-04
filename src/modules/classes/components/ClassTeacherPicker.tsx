'use client';

import { useTranslations } from 'next-intl';

import { ClassMemberChecklist } from '@/modules/classes/components/ClassMemberChecklist';
import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import type { SchoolTeacher } from '@/modules/teachers';

import type { ClassTeacherPickerProps } from '@/modules/classes/types/components.types';

function toOption(teacher: SchoolTeacher): ClassMemberOption {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return { value: teacher.documentId, label: name || teacher.email };
}

// C-TCH-01 staff as a controlled multi-select for the class's teacher owners
// (documentId working set; saved as a full-replacement list through C-CLS-03).
export function ClassTeacherPicker({ teachers, value, onChange }: ClassTeacherPickerProps) {
  const t = useTranslations('Classes.detail');

  return (
    <section
      aria-labelledby="class-detail-teachers-heading"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="class-detail-teachers-heading" className="text-lg font-semibold text-foreground">
          {t('teachersTitle')}
        </h2>
        <p className="text-sm text-body">{t('teachersDescription')}</p>
      </div>
      <ClassMemberChecklist
        idPrefix="class-detail-teacher"
        options={teachers.map(toOption)}
        value={value}
        onChange={onChange}
        emptyText={t('teachersEmpty')}
      />
    </section>
  );
}
