'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button } from '@/modules/design-system';
import { Link, useRouter } from '@/i18n/navigation';
import { useRecordCrumb } from '@/modules/shell';
import { ClassResultsHeader } from '@/modules/teacher/components/ClassResultsHeader';
import { ClassResultsTabs } from '@/modules/teacher/components/ClassResultsTabs';
import { ClassSwitcher } from '@/modules/teacher/components/ClassSwitcher';
import { ComingSoonPanel } from '@/modules/teacher/components/ComingSoonPanel';
import { ProgressTabPanel } from '@/modules/teacher/components/ProgressTabPanel';
import { SkillTabs } from '@/modules/teacher/components/SkillTabs';
import { StudentsTabPanel } from '@/modules/teacher/components/StudentsTabPanel';
import { TeachingInsightsPanel } from '@/modules/teacher/components/TeachingInsightsPanel';
import { TEACHER_RETRY_BUTTON_CLASS } from '@/modules/teacher/constants/a11y.constants';
import { DEFAULT_RESULTS_TAB } from '@/modules/teacher/constants/results.constants';
import {
  DEFAULT_SKILL_SCOPE,
  isSkillLive,
  isSkillScopeValue,
} from '@/modules/teacher/lib/skill-scope';
import { classResultsHref, deriveResultsStatus } from '@/modules/teacher/lib/results-shell';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { TestDayScreen, useClassSittingsQuery } from '@/modules/test-day';
import { useClassResultsQuery } from '@/modules/results/queries/use-class-results.query';
import type {
  ClassResultsScreenProps,
  ResultsTabValue,
  SkillScopeValue,
} from '@/modules/teacher/types/results-shell.types';

// /dashboard/results/<classDocumentId> — the class shell of `Teacher Portal v2`
// (S06, :518–661): ONE screen, six tabs, the four-skill scope above them. The
// ONE roster read (spec v2 §6.3) feeds everything; the class name comes from
// the SAME cached C-TD-1 read the Results list made. A failed read renders the
// error branch INSTEAD of zeroed tiles; the h1 falls back to the section name
// while the class name is still arriving — never a guess.
//
// Task 07: Reading is live; Listening/Writing/Speaking hide the whole reading
// tab strip and swap the body for ComingSoonPanel (:4568–4569). Tab + skill
// live HERE, above the strip: Reading must restore the PREVIOUS tab (:4579 +
// :3089), which an unmounting strip would lose. Switching class resets to
// students + reading and remounts the keyed region, clearing the student-table
// params with it — :4579's onSelClass.
function ClassResultsScreen({ classDocumentId }: ClassResultsScreenProps) {
  const t = useTranslations('Teacher.results.detail');
  const tSkills = useTranslations('Teacher.results.skills');
  const tSection = useTranslations('Teacher.results');
  const router = useRouter();
  const roster = useClassResultsQuery(classDocumentId);
  const dashboard = useTeacherDashboardQuery();
  const classSittings = useClassSittingsQuery(classDocumentId);
  const classCard = dashboard.data?.classes.find(
    (entry) => entry.class_document_id === classDocumentId,
  );
  const rows = roster.data ?? [];
  const status = deriveResultsStatus({
    isLoading: roster.isPending,
    isError: roster.isError,
    isSuccess: roster.isSuccess,
    itemCount: rows.length,
  });
  const [tab, setTab] = useState<ResultsTabValue>(DEFAULT_RESULTS_TAB);
  const [skill, setSkill] = useState<SkillScopeValue>(DEFAULT_SKILL_SCOPE);

  useRecordCrumb(classCard?.name);

  const switchClass = (next: string) => {
    if (next === classDocumentId) return;
    setTab(DEFAULT_RESULTS_TAB);
    setSkill(DEFAULT_SKILL_SCOPE);
    router.push(classResultsHref(next));
  };

  // The switcher waits for the C-TD-1 read, like the h1: an empty options list
  // would make the closed trigger print the raw documentId (TestSessionSelect's
  // measured SelectValue defect).
  const switcher = dashboard.data ? (
    <ClassSwitcher
      options={dashboard.data.classes.map((entry) => ({
        value: entry.class_document_id,
        label: entry.name,
      }))}
      value={classDocumentId}
      onValueChange={switchClass}
    />
  ) : null;

  // teacher/08 — the `live` tab is the folded console, in BOTH arms (embedded:
  // the shell keeps ONE main landmark). With nothing open the console renders
  // its own quiet no-sitting panel and start control (:1040–1047, :2169) —
  // the surface never swaps to a different component.
  const livePanel = classSittings.isPending ? (
    <p className="text-sm text-muted-foreground">{t('loading')}</p>
  ) : classSittings.isError ? (
    <p role="alert" className="text-sm text-danger-ink">{t('errorDescription')}</p>
  ) : (
    <TestDayScreen embedded classDocumentId={classDocumentId} />
  );

  return (
    <div
      data-surface="teacher-class-results"
      data-status={status}
      data-class-id={classDocumentId}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      {status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/5" />
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ) : null}

      {status === 'error' || status === 'empty' ? (
        <h1 className="text-portal-title font-bold text-foreground">
          {classCard?.name ?? tSection('title')}
        </h1>
      ) : null}

      {status === 'error' || status === 'empty' ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              className={TEACHER_RETRY_BUTTON_CLASS}
              loading={roster.isFetching}
              onClick={() => roster.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}

      {status === 'ready' ? (
        <Fragment key={classDocumentId}>
          <ClassResultsHeader
            className={classCard?.name ?? tSection('title')}
            rows={rows}
            switcher={switcher}
          />
          <SkillTabs
            value={skill}
            onValueChange={(next) => {
              if (isSkillScopeValue(next)) setSkill(next);
            }}
          />
          {isSkillLive(skill) ? (
            <ClassResultsTabs
              value={tab}
              onValueChange={setTab}
              students={<StudentsTabPanel classDocumentId={classDocumentId} rows={rows} />}
              insights={<TeachingInsightsPanel classDocumentId={classDocumentId} rows={rows} />}
              progress={<ProgressTabPanel classDocumentId={classDocumentId} rows={rows} />}
              live={livePanel}
            />
          ) : (
            <ComingSoonPanel
              title={tSkills('comingSoonTitle', { skill: tSkills(skill) })}
              description={tSkills('comingSoonBody', { skill: tSkills(skill) })}
              showSkillChips
            />
          )}
        </Fragment>
      ) : null}
    </div>
  );
}

export { ClassResultsScreen };
