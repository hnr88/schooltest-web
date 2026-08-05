'use client';

import { useTranslations } from 'next-intl';

import {
  DataPanel,
  KeyValueList,
  KeyValueRow,
  PanelHeaderRow,
  StatusPill,
} from '@/modules/design-system';
import { StudentLevelBadge } from '@/modules/school-students/components/StudentLevelBadge';
import { toDiagnosticStatus, toFirstLanguage } from '@/modules/school-students/lib/student-level';

import type { StudentRecordPanelProps } from '@/modules/school-students/types/components.types';

// The C-CHD-06 record, one key/value row per roster column plus the email the
// table has no room for. Every label and every value is the roster's own —
// same picklist narrowing, same Level badge — so the detail view and the row
// the admin clicked can never disagree about a student.
export function StudentRecordPanel({ student }: StudentRecordPanelProps) {
  const t = useTranslations('SchoolStudents');
  const language = toFirstLanguage(student.first_language);

  return (
    <DataPanel data-slot="student-record-panel" className="flex max-w-2xl flex-col gap-4 p-6">
      <PanelHeaderRow as="h2" title={t('detail.panelTitle')} />
      <KeyValueList>
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
        <KeyValueRow label={t('form.email')}>{student.email ?? t('table.notSet')}</KeyValueRow>
        <KeyValueRow label={t('filters.statusLabel')}>
          {student.status === null ? (
            t('table.notSet')
          ) : (
            <StatusPill tone={student.status === 'archived' ? 'neutral' : 'success'}>
              {t(student.status === 'archived' ? 'table.statusArchived' : 'table.statusActive')}
            </StatusPill>
          )}
        </KeyValueRow>
      </KeyValueList>
    </DataPanel>
  );
}
