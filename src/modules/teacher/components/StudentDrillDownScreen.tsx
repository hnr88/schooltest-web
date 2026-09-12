'use client';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { StudentAskAiDrawer } from '@/modules/teacher/components/StudentAskAiDrawer';
import { StudentComingSoon } from '@/modules/teacher/components/StudentComingSoon';
import { StudentDrillDownBody } from '@/modules/teacher/components/StudentDrillDownBody';
import { StudentDrillDownHeader } from '@/modules/teacher/components/StudentDrillDownHeader';
import { Breadcrumbs } from '@/modules/teacher/components/v2/Breadcrumbs';
import { TeacherPageCard } from '@/modules/teacher/components/v2/TeacherPageCard';
import { TEACHER_RETRY_BUTTON_CLASS } from '@/modules/teacher/constants/a11y.constants';
import { useStudentDrillDownPage } from '@/modules/teacher/hooks/useStudentDrillDownPage';
import { isSkillLive } from '@/modules/teacher/lib/skill-scope';
import type { StudentDrillDownScreenProps } from '@/modules/teacher/types/student-drill-down.types';

// /dashboard/results/<classDocumentId>/students/<studentDocumentId> — the Teacher
// Portal v2 student page (`Teacher Portal v2.dc.html:301–513`, card 27/31/32, gap 22)
// over the canonical reads: the class roster names the student and ONE GET /results/:id
// carries the v2 view with `history`. Pending -> skeleton, error -> retryable alert,
// empty -> the server's "no completed test yet". Listening, Writing and Speaking swap
// the Reading header and body for the coming-soon block, as the design does.
function StudentDrillDownScreen({ classDocumentId, studentDocumentId }: StudentDrillDownScreenProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const tSection = useTranslations('Teacher.results');
  const page = useStudentDrillDownPage(classDocumentId, studentDocumentId);
  const reading = isSkillLive(page.skill);
  const ready =
    page.status === 'success' && page.view !== null && page.studentName !== null
      ? { view: page.view, studentName: page.studentName }
      : null;

  return (
    <TeacherPageCard
      variant="padded"
      data-surface="teacher-student-drill-down"
      data-status={page.status}
      data-class-id={classDocumentId}
      data-student-id={studentDocumentId}
      data-skill={page.skill}
      className="mb-2 gap-[22px] px-[31px] pt-[27px] pb-8"
    >
      <Breadcrumbs back={page.crumbs.back} items={page.crumbs.items} />

      {page.status === 'pending' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-14 w-2/5" />
          <Skeleton className="h-72 w-full rounded-[12px]" />
        </div>
      ) : null}

      {page.status === 'error' ? (
        <>
          <h1 className="text-[25px] font-semibold tracking-[-0.02em] text-navy-900">{tSection('title')}</h1>
          <Alert
            variant="error"
            title={t('errorTitle')}
            action={
              <Button variant="outline" size="sm" className={TEACHER_RETRY_BUTTON_CLASS} onClick={page.retry}>
                {t('retry')}
              </Button>
            }
          >
            {t('errorDescription')}
          </Alert>
        </>
      ) : null}

      {page.status === 'empty' ? (
        <EmptyState icon={ClipboardList} tone="brand" title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : null}

      {ready !== null && reading ? (
        <>
          <StudentDrillDownHeader
            studentName={ready.studentName}
            className={page.className}
            overall={ready.view.overall.score === null ? null : ready.view.overall}
            actions={page.actions}
            skill={page.skill}
            onValueChange={page.setSkill}
          />
          <StudentDrillDownBody view={ready.view} firstName={page.firstName} onCopy={page.actions.copy} />
          <StudentAskAiDrawer
            view={ready.view}
            firstName={page.firstName}
            classDocumentId={classDocumentId}
            studentDocumentId={studentDocumentId}
          />
        </>
      ) : null}

      {ready !== null && !reading ? (
        <>
          <h1 className="sr-only">{ready.studentName}</h1>
          <StudentComingSoon skill={page.skill} onValueChange={page.setSkill} firstName={page.firstName} />
        </>
      ) : null}
    </TeacherPageCard>
  );
}

export { StudentDrillDownScreen };
