'use client';

import { useTranslations } from 'next-intl';

import { KeyValueList, KeyValueRow, PanelHeaderRow } from '@/modules/design-system';
import { StudentLevelBadge } from '@/modules/school-students/components/StudentLevelBadge';
import { toDiagnosticStatus, toFirstLanguage } from '@/modules/school-students/lib/student-level';

import type { StudentRecordPanelProps } from '@/modules/school-students/types/components.types';

// The C-CHD-06 record drawn as the design's "Student details" card (VIEW 3,
// :489-506): radius-24 white panel, the 17/600 title with the blue Edit link,
// and one hairline key/value row per roster column plus the email and the ID
// the table has no room for. Every label and every value is the roster's own —
// same picklist narrowing, same Level badge — so the detail view and the row
// the admin clicked can never disagree about a student.
export function StudentRecordPanel({ student, onEdit }: StudentRecordPanelProps) {
  const t = useTranslations('SchoolStudents');
  const language = toFirstLanguage(student.first_language);

  return (
    <section
      data-slot="student-record-panel"
      className="w-full rounded-card bg-card px-[30px] py-[26px] shadow-sm"
    >
      <PanelHeaderRow
        as="h2"
        title={t('detail.panelTitle')}
        action={
          <button
            type="button"
            className="cursor-pointer px-1 py-1.5 text-[13px] font-semibold text-blue-600"
            onClick={onEdit}
          >
            {t('detail.editButton')}
          </button>
        }
      />
      <KeyValueList>
        <KeyValueRow label={t('detail.studentIdLabel')}>{student.documentId}</KeyValueRow>
        <KeyValueRow label={t('form.email')}>{student.email ?? t('table.notSet')}</KeyValueRow>
        <KeyValueRow label={t('table.columnClass')}>
          {student.class?.name ?? t('table.classNone')}
        </KeyValueRow>
        <KeyValueRow label={t('table.columnFirstLanguage')}>
          {language ? t(`form.firstLanguageOption.${language}`) : t('table.notSet')}
        </KeyValueRow>
        <KeyValueRow label={t('table.columnLevel')}>
          <StudentLevelBadge phase={student.acara_phase} />
        </KeyValueRow>
        <KeyValueRow label={t('table.columnDiagnostic')}>
          {t(`table.diagnosticOption.${toDiagnosticStatus(student.diagnostic_status)}`)}
        </KeyValueRow>
        <KeyValueRow label={t('filters.statusLabel')}>
          {student.status === null
            ? t('table.notSet')
            : t(student.status === 'archived' ? 'table.statusArchived' : 'table.statusActive')}
        </KeyValueRow>
      </KeyValueList>
    </section>
  );
}
