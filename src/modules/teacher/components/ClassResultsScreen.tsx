'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, Tabs } from '@/modules/design-system';
import { useRecordCrumb } from '@/modules/shell';
import { ClassReportsDialog } from '@/modules/teacher/components/ClassReportsDialog';
import { ClassResultsHeader } from '@/modules/teacher/components/ClassResultsHeader';
import { ClassResultsTabPanels } from '@/modules/teacher/components/ClassResultsTabPanels';
import { ClassResultsTabs } from '@/modules/teacher/components/ClassResultsTabs';
import { ComingSoonPanel } from '@/modules/teacher/components/ComingSoonPanel';
import { SkillTabs } from '@/modules/teacher/components/SkillTabs';
import { TeacherPageCard } from '@/modules/teacher/components/v2/TeacherPageCard';
import { TEACHER_RETRY_BUTTON_CLASS } from '@/modules/teacher/constants/a11y.constants';
import { CLASS_DETAIL_STICKY_CLASS } from '@/modules/teacher/constants/results.constants';
import { useClassDetailParams } from '@/modules/teacher/hooks/useClassDetailParams';
import { deriveResultsStatus, isResultsTabValue } from '@/modules/teacher/lib/results-shell';
import { isSkillLive } from '@/modules/teacher/lib/skill-scope';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useClassResultsQuery } from '@/modules/results/queries/use-class-results.query';
import type { ClassResultsScreenProps } from '@/modules/teacher/types/results-shell.types';

// /dashboard/results/<classDocumentId> — Teacher Portal v2 class detail (`:518–661`):
// header and switcher from the cached C-TD-1 read, tab bodies from the ONE roster
// read; a failed read or a class outside the teacher's list renders the error
// branch. Tab, skill and sitting live in the URL (`?tab=&skill=&session=`).
function ClassResultsScreen({ classDocumentId }: ClassResultsScreenProps) {
  const t = useTranslations('Teacher.results.detail');
  const tSection = useTranslations('Teacher.results');
  const tDetail = useTranslations('TeacherPortal.classDetail');
  const roster = useClassResultsQuery(classDocumentId);
  const dashboard = useTeacherDashboardQuery();
  const detail = useClassDetailParams();
  const classes = dashboard.data?.classes ?? [];
  const classCard = classes.find((entry) => entry.class_document_id === classDocumentId);
  const rows = roster.data ?? [];
  const status = deriveResultsStatus({
    isLoading: roster.isPending || dashboard.isPending,
    isError: roster.isError || dashboard.isError || (dashboard.isSuccess && classCard === undefined),
    isSuccess: roster.isSuccess && dashboard.isSuccess,
    itemCount: rows.length,
  });
  const reading = isSkillLive(detail.skill);
  const skillLabel = tDetail(`skills.${detail.skill}`);

  useRecordCrumb(classCard?.name);

  return (
    <TeacherPageCard
      variant="padded"
      data-surface="teacher-class-results"
      data-status={status}
      data-class-id={classDocumentId}
      className="mb-2"
    >
      {status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/5" />
          <Skeleton className="h-14 w-full rounded-[10px]" />
          <Skeleton className="h-64 w-full rounded-[11px]" />
        </div>
      ) : null}
      {status === 'error' ? (
        <>
          <h1 className="text-[28px] font-medium tracking-[-0.02em] text-navy-900">
            {classCard?.name ?? tSection('title')}
          </h1>
          <Alert
            variant="error"
            title={t('errorTitle')}
            action={
              <Button
                variant="outline"
                size="sm"
                className={TEACHER_RETRY_BUTTON_CLASS}
                loading={roster.isFetching || dashboard.isFetching}
                onClick={() => {
                  void roster.refetch();
                  void dashboard.refetch();
                }}
              >
                {t('retry')}
              </Button>
            }
          >
            {t('errorDescription')}
          </Alert>
        </>
      ) : null}
      {classCard !== undefined && (status === 'ready' || status === 'empty') ? (
        <Tabs
          key={classDocumentId}
          value={detail.tab}
          onValueChange={(next) => {
            if (isResultsTabValue(next)) detail.setTab(next);
          }}
          className="gap-5"
        >
          <div data-slot="class-detail-sticky" className={CLASS_DETAIL_STICKY_CLASS}>
            <ClassResultsHeader classCard={classCard} classes={classes} onSwitchClass={detail.switchClass} />
            <SkillTabs value={detail.skill} onValueChange={detail.setSkill} />
            {reading ? <ClassResultsTabs /> : null}
          </div>
          {reading ? (
            <ClassResultsTabPanels classDocumentId={classDocumentId} rows={rows} sessionId={detail.session} />
          ) : (
            <ComingSoonPanel
              title={tDetail('comingSoonTitle', { skill: skillLabel })}
              description={tDetail('comingSoonBody', { skill: skillLabel })}
              showSkillChips
            />
          )}
        </Tabs>
      ) : null}
      {classCard === undefined ? null : <ClassReportsDialog classCard={classCard} rows={rows} />}
    </TeacherPageCard>
  );
}

export { ClassResultsScreen };
