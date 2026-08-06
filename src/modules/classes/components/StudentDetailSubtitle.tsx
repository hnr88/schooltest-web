'use client';

import { useTranslations } from 'next-intl';

import { StudentLevelBadge, toFirstLanguage } from '@/modules/school-students';

import type { StudentDetailSubtitleProps } from '@/modules/classes/types/components.types';

// Spec §2 subtitle: class, first language and proficiency level. The language
// and level vocabularies are the SHARED ones the Students page uses, so a value
// can never read differently on the two surfaces, and an unrecognised or absent
// value shows as "not set" rather than a raw enum.
export function StudentDetailSubtitle({ student }: StudentDetailSubtitleProps) {
  const t = useTranslations('Classes.studentDetail');
  const tStudents = useTranslations('SchoolStudents');
  const language = toFirstLanguage(student.first_language);

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-body">
      <span>{student.class.name}</span>
      <span aria-hidden className="text-muted-foreground">
        |
      </span>
      <span>
        {t('firstLanguageLabel')}{' '}
        {language === null
          ? tStudents('table.notSet')
          : tStudents(`form.firstLanguageOption.${language}`)}
      </span>
      <span aria-hidden className="text-muted-foreground">
        |
      </span>
      <span className="flex items-center gap-1.5">
        {t('levelLabel')} <StudentLevelBadge phase={student.acara_phase} />
      </span>
    </p>
  );
}
