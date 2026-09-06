'use client';

import { useFormatter, useTranslations } from 'next-intl';

import {
  Badge,
  DataPanel,
  KeyValueList,
  KeyValueRow,
  PanelHeaderRow,
  Skeleton,
} from '@/modules/design-system';
import { StudentLevelBadge } from '@/modules/school-students/components/StudentLevelBadge';
import { toFirstLanguage } from '@/modules/school-students/lib/student-level';
import { noValueIfMissing } from '@/modules/ops/lib/ops-class-detail.helpers';
import {
  opsStudentFullName,
  opsStudentStatusLabelKey,
  opsStudentStatusTone,
} from '@/modules/ops/lib/ops-students-list.helpers';
import { useOpsStudentProfileQuery } from '@/modules/ops/queries/use-ops-student-profile.query';

interface OpsStudentProfilePanelProps {
  schoolDocumentId: string;
  studentDocumentId: string | null;
}

// C-OPS-PORTAL-036 — the profile behind the directory row. Reuses the
// school-students record vocabulary (the same Level badge, the same language
// picklist labels, the same not-set dash) so the profile and the school-admin
// record can never disagree about a student, and the SAME official-result rule
// as the list: `latest_result` and every attempt's official flag come from the
// one server selector. Unknown DOB and language render as not-set; no parent
// credentials, reset tokens or raw responses exist in the payload at all.
export function OpsStudentProfilePanel({ schoolDocumentId, studentDocumentId }: OpsStudentProfilePanelProps) {
  const t = useTranslations('Ops.schoolTables');
  const tStudents = useTranslations('SchoolStudents');
  const format = useFormatter();
  const profile = useOpsStudentProfileQuery(schoolDocumentId, studentDocumentId);

  if (studentDocumentId === null || profile.isPending) {
    return (
      <div
        role="status"
        aria-label={t('studentsLoading')}
        data-slot="ops-student-profile-loading"
        className="flex flex-col gap-2"
      >
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (profile.isError || profile.data === undefined) {
    return (
      <DataPanel className="p-6">
        <PanelHeaderRow as="h2" title={t('errorTitle')} />
        <p className="text-sm text-body">{t('errorDescription')}</p>
      </DataPanel>
    );
  }

  const student = profile.data;
  const language = toFirstLanguage(student.first_language);
  const formatDate = (isoDate: string): string =>
    format.dateTime(new Date(isoDate), { day: 'numeric', month: 'short' });

  return (
    <DataPanel data-slot="ops-student-profile" className="flex max-w-2xl flex-col gap-4 p-6">
      <PanelHeaderRow as="h2" title={opsStudentFullName(student)} />
      <KeyValueList>
        <KeyValueRow label={tStudents('table.columnClass')}>
          {student.class?.name ?? tStudents('table.classNone')}
        </KeyValueRow>
        <KeyValueRow label={tStudents('form.dateOfBirth')}>
          {student.date_of_birth === null
            ? tStudents('table.notSet')
            : format.dateTime(new Date(student.date_of_birth), { day: 'numeric', month: 'short', year: 'numeric' })}
        </KeyValueRow>
        <KeyValueRow label={tStudents('table.columnFirstLanguage')}>
          {language === null
            ? tStudents('table.notSet')
            : tStudents(`form.firstLanguageOption.${language}`)}
        </KeyValueRow>
        <KeyValueRow label={t('columnLevel')}>
          <StudentLevelBadge phase={student.acara_phase} />
        </KeyValueRow>
        <KeyValueRow label={t('columnLatestResult')}>
          {student.latest_result === null
            ? t('studentsNoResult')
            : `${student.latest_result.percentage === null ? '' : `${student.latest_result.percentage}% · `}${formatDate(student.latest_result.completed_at)}`}
        </KeyValueRow>
        <KeyValueRow label={t('studentsStatusLabel')}>
          <Badge variant={opsStudentStatusTone(student.status)}>
            {t(opsStudentStatusLabelKey(student.status))}
          </Badge>
        </KeyValueRow>
      </KeyValueList>

      <div className="flex flex-col gap-2">
        <p className="text-meta font-medium text-body">{t('opsProfileAttemptsTitle')}</p>
        {student.attempts.length === 0 ? (
          <p className="text-sm text-body">{t('studentsNoResult')}</p>
        ) : (
          student.attempts.map((attempt) => (
            <div
              key={attempt.documentId}
              data-testid="ops-student-attempt"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span className="text-sm text-body">
                {noValueIfMissing(attempt.skill)}
                {attempt.ended_at === null ? '' : ` · ${formatDate(attempt.ended_at)}`}
              </span>
              {attempt.invalidated_at !== null ? (
                <Badge variant="warning">{t('opsProfileAttemptInvalidated')}</Badge>
              ) : attempt.official ? (
                <Badge variant="success">{t('opsProfileAttemptOfficial')}</Badge>
              ) : null}
            </div>
          ))
        )}
      </div>
    </DataPanel>
  );
}
