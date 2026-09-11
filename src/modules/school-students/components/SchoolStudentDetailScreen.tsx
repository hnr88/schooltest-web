'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import {
  BACK_CLASSES,
  STUDENT_STATUS_PILL_TONES,
} from '@/modules/school-students/constants/components.constants';
import { SchoolStudentEditDialog } from '@/modules/school-students/components/SchoolStudentEditDialog';
import { StudentClassPanel } from '@/modules/school-students/components/StudentClassPanel';
import { StudentLevelBadge } from '@/modules/school-students/components/StudentLevelBadge';
import { StudentRecordPanel } from '@/modules/school-students/components/StudentRecordPanel';
import { StudentSummaryCards } from '@/modules/school-students/components/StudentSummaryCards';
import { studentDisplayName } from '@/modules/school-students/hooks/use-student-row-actions';
import { toAcaraPhase, toFirstLanguage } from '@/modules/school-students/lib/student-level';
import { useSchoolStudentQuery } from '@/modules/school-students/queries/use-school-student.query';
import { RecordCrumb } from '@/modules/shell';

import type { SchoolStudentDetailScreenProps } from '@/modules/school-students/types/components.types';

// Spec §4 "each row ... navigates to an individual student detail view": the
// C-CHD-06 read of one student of the caller's own school, drawn to the School
// Admin Portal drill-down (VIEW 3, :449-475) — text-arrow back link, 60px navy
// initial avatar beside the 28px name with the phase + status pills and the
// "First language · Level · Class · ID" meta line, "Edit details" opening the
// screen-owned edit dialog. The pending, error and not-found states are the
// neighbouring screens' exactly — skeleton, error Alert with a retry, and the
// plain not-found Alert the class detail shows.
export function SchoolStudentDetailScreen({ documentId }: SchoolStudentDetailScreenProps) {
  const t = useTranslations('SchoolStudents');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const studentQuery = useSchoolStudentQuery(documentId, enabled);
  const classesQuery = useSchoolClassesQuery(enabled);
  const [editOpen, setEditOpen] = useState(false);

  const isPending = !enabled || studentQuery.isPending || classesQuery.isPending;
  const isError = studentQuery.isError || classesQuery.isError;
  const student = studentQuery.data ?? null;
  const classes = classesQuery.data ?? [];
  const name = student === null ? '' : studentDisplayName(student);
  const heading = name === '' ? t('detail.unnamed') : name;

  const refetchAll = () => {
    void studentQuery.refetch();
    void classesQuery.refetch();
  };

  const language = student === null ? null : toFirstLanguage(student.first_language);
  const level = student === null ? null : toAcaraPhase(student.acara_phase);
  const statusTone =
    student?.status === 'archived'
      ? STUDENT_STATUS_PILL_TONES.archived
      : STUDENT_STATUS_PILL_TONES.active;

  return (
    <main
      data-slot="school-student-detail"
      data-surface="school-admin-student-detail"
      className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div>
        <RecordCrumb label={heading} />
        <Link href="/dashboard/school/students" className={BACK_CLASSES}>
          <span aria-hidden="true">← </span>
          {t('form.back')}
        </Link>
        {isPending ? (
          <div className="mt-5 flex max-w-2xl flex-col gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : isError ? (
          <div className="mt-5">
            <Alert
              variant="error"
              title={t('errorTitle')}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={studentQuery.isFetching || classesQuery.isFetching}
                  onClick={refetchAll}
                >
                  {t('retry')}
                </Button>
              }
            >
              {t('errorDescription')}
            </Alert>
          </div>
        ) : student === null ? (
          <div className="mt-5">
            <Alert variant="error" title={t('detail.notFoundTitle')}>
              {t('detail.notFoundDescription')}
            </Alert>
          </div>
        ) : (
          /* Design :450-456 — the header block sits 14px under the back link. */
          <div className="mt-[14px] flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-[18px]">
              <span
                aria-hidden="true"
                className="grid size-[60px] shrink-0 place-items-center rounded-full bg-navy-900 text-xl font-semibold text-white"
              >
                {heading.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] text-foreground">
                    {heading}
                  </h1>
                  <StudentLevelBadge phase={student.acara_phase} />
                  {student.status === null ? null : (
                    <span
                      className="rounded-full px-[13px] py-1.5 text-xs font-semibold"
                      style={{ color: statusTone.fg, backgroundColor: statusTone.bg }}
                    >
                      {t(
                        student.status === 'archived'
                          ? 'table.statusArchived'
                          : 'table.statusActive',
                      )}
                    </span>
                  )}
                </div>
                <p className="mt-[5px] text-sm text-[#7C8698]">
                  {t('detail.metaLine', {
                    language: language
                      ? t(`form.firstLanguageOption.${language}`)
                      : t('table.notSet'),
                    level: level ? t(`form.acaraPhaseOption.${level}`) : t('table.notSet'),
                    class: student.class?.name ?? t('table.classNone'),
                    id: student.documentId,
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-[42px] rounded-xl border-[#D8DFEA] px-[18px] text-[13.5px] font-semibold text-foreground hover:border-navy-900 hover:bg-transparent"
                onClick={() => setEditOpen(true)}
              >
                {t('detail.editDetailsButton')}
              </Button>
            </div>
            <StudentSummaryCards student={student} />
            <div className="grid grid-cols-portal-two-up gap-5">
              <StudentRecordPanel student={student} onEdit={() => setEditOpen(true)} />
              <StudentClassPanel student={student} classes={classes} />
            </div>
            {editOpen ? (
              <SchoolStudentEditDialog
                student={student}
                classes={classes}
                onClose={() => setEditOpen(false)}
              />
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
