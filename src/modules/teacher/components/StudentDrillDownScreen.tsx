'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardList } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState, getInitials } from '@/modules/design-system';
import { useRecordCrumb } from '@/modules/shell';
import { StudentResultScreen } from '@/modules/results';
import { ComingSoonPanel } from '@/modules/teacher/components/ComingSoonPanel';
import { SkillSelect } from '@/modules/teacher/components/SkillSelect';
import { TeacherExportButton } from '@/modules/teacher/components/TeacherExportButton';
import { TEACHER_RETRY_BUTTON_CLASS } from '@/modules/teacher/constants/a11y.constants';
import { DEFAULT_SKILL_SCOPE } from '@/modules/teacher/lib/skill-scope';
import { drillDownCrumb } from '@/modules/teacher/lib/student-drill-down-view';
import type { SkillScopeValue } from '@/modules/teacher/types/results-shell.types';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useStudentDrillDownQuery } from '@/modules/teacher/queries/use-student-drill-down.query';
import type { StudentDrillDownScreenProps } from '@/modules/teacher/types/student-drill-down.types';

// /dashboard/results/<classDocumentId>/students/<studentDocumentId> — the
// drill-down behind every row of the Students tab, served by the CANONICAL
// reads: the class roster names the student and carries their latest result
// reference, and ONE `GET /results/{id}` returns the v2 view with `history`.
// The retired C-TR-2 read is gone from this page.
//
// teacher/15 — the success branch re-parents the RICH body (R-NARROW-01):
// `StudentResultScreen` — header with initials, confidence strip, trend chart,
// seven subskill cards, sparklines, error patterns, checklist, print — replaces
// the seven-row skill list. `SkillSelect` + the S04d coming-soon panel present
// the three skills the contract marks "soon" (no enum change, no notify
// control — OP-2); Back to Reading restores Reading.
//
// States are the shared hooks': pending -> skeleton, error -> retryable alert
// (a failed read renders the error branch and nothing else), empty -> the
// server's own "no completed test yet" for a roster student without an
// official Result.
function StudentDrillDownScreen({
  classDocumentId,
  studentDocumentId,
}: StudentDrillDownScreenProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const tSkills = useTranslations('Teacher.results.skills');
  const tExport = useTranslations('Teacher.results.export');
  const tSection = useTranslations('Teacher.results');
  const drillDown = useStudentDrillDownQuery(classDocumentId, studentDocumentId);
  const dashboard = useTeacherDashboardQuery();
  const [skill, setSkill] = useState<SkillScopeValue>(DEFAULT_SKILL_SCOPE);
  const knownClassName =
    dashboard.data?.classes.find((entry) => entry.class_document_id === classDocumentId)?.name ??
    null;
  const className = knownClassName ?? classDocumentId;
  const crumb = drillDownCrumb(
    drillDown.status === 'success' ? drillDown.data.displayName : null,
    knownClassName,
    classDocumentId,
  );

  useRecordCrumb(crumb?.label ?? null, crumb?.ancestors);

  return (
    <div
      data-surface="teacher-student-drill-down"
      data-status={drillDown.status}
      data-class-id={classDocumentId}
      data-student-id={studentDocumentId}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      {drillDown.status === 'pending' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-13 w-2/5" />
          <Skeleton className="h-72 w-full rounded-card" />
        </div>
      ) : null}

      {/*
        A failed read has no student name, so the header's h1 cannot render —
        axe measured `page-has-heading-one` on that frame (task 047). The
        route's section name is the honest level-one heading in its place.
      */}
      {drillDown.status === 'error' ? (
        <h1 className="text-portal-title font-bold text-foreground">{tSection('title')}</h1>
      ) : null}

      {drillDown.status === 'error' ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              className={TEACHER_RETRY_BUTTON_CLASS}
              onClick={() => drillDown.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}

      {drillDown.status === 'empty' ? (
        <EmptyState
          icon={ClipboardList}
          tone="brand"
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : null}

      {drillDown.status === 'success' ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SkillSelect skill={skill} onValueChange={setSkill} />
            {skill === 'reading' ? (
              <TeacherExportButton
                request={{
                  kind: 'student',
                  classDocumentId,
                  studentDocumentId,
                }}
                label={tExport('studentButton')}
                variant="outline"
              />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSkill('reading')}>
                {t('backToReading')}
              </Button>
            )}
          </div>
          {skill === 'reading' ? (
            <StudentResultScreen
              view={drillDown.data.view}
              student={{
                name: drillDown.data.displayName,
                className,
                initials: getInitials(drillDown.data.displayName),
              }}
            />
          ) : (
            <ComingSoonPanel
              title={tSkills('comingSoonTitle', { skill: tSkills(skill) })}
              description={t('comingSoonBody', {
                student: drillDown.data.displayName.split(' ')[0] ?? drillDown.data.displayName,
                skill: tSkills(skill),
              })}
            />
          )}
        </>
      ) : null}
    </div>
  );
}

export { StudentDrillDownScreen };
