'use client';

import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { useMySchoolQuery } from '@/modules/school-admin';
import { ClassesListBody } from '@/modules/teacher/components/ClassesListBody';
import { ClassesLiveStrip } from '@/modules/teacher/components/ClassesLiveStrip';
import { ClassesToolbar } from '@/modules/teacher/components/ClassesToolbar';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { TeacherPageCard } from '@/modules/teacher/components/v2/TeacherPageCard';
import { TeacherPageHeader } from '@/modules/teacher/components/v2/TeacherPageHeader';
import { useClassExports } from '@/modules/teacher/hooks/useClassExports';
import { useClassesDirectory } from '@/modules/teacher/hooks/useClassesDirectory';
import { toLiveStripCards } from '@/modules/teacher/lib/classes-directory';
import { deriveResultsStatus } from '@/modules/teacher/lib/results-shell';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTeacherTestsQuery } from '@/modules/teacher/queries/use-teacher-tests.query';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';

// /dashboard/results — the Classes screen (Teacher Portal v2.dc.html:57–216),
// on ONE live read of C-TD-1 (`GET /api/teacher/dashboard`) plus the school's
// own name (`GET /api/schools/me`). The design's "Term 3, Week 7" has no source
// in the API, so the header meta is the school name alone. The toolbar and both
// bodies run on the directory kit's state (URL = store); `data-surface` and
// `data-status` stay where every spec reads them.
function ResultsScreen() {
  const t = useTranslations('TeacherPortal.classes');
  const dashboard = useTeacherDashboardQuery();
  const tests = useTeacherTestsQuery();
  const school = useMySchoolQuery(true);
  const openStartSession = useStartSessionStore((store) => store.open);
  const exports = useClassExports();

  const classes = useMemo(() => dashboard.data?.classes ?? [], [dashboard.data]);
  const directory = useClassesDirectory(classes);
  const liveCards = useMemo(
    () => toLiveStripCards(dashboard.data?.live_sessions ?? [], classes, tests.data?.tests ?? []),
    [dashboard.data, classes, tests.data],
  );
  const status = deriveResultsStatus({
    isLoading: dashboard.isPending,
    isError: dashboard.isError,
    isSuccess: dashboard.isSuccess,
    itemCount: classes.length,
  });

  return (
    <TeacherPageCard data-surface="teacher-results" data-status={status} className="mb-2">
      <TeacherPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        meta={school.data?.name}
        actions={
          <TeacherButton data-slot="start-session-button" onClick={() => openStartSession()}>
            <Plus aria-hidden="true" className="size-[15px]" strokeWidth={2} />
            {t('startSession')}
          </TeacherButton>
        }
      />
      {status === 'ready' && liveCards.length > 0 ? <ClassesLiveStrip cards={liveCards} /> : null}
      {status === 'ready' ? <ClassesToolbar directory={directory} /> : null}
      <ClassesListBody
        status={status}
        directory={directory}
        exports={exports}
        onRetry={() => void dashboard.refetch()}
      />
      <p className="px-8 py-4 text-[12.5px] leading-[1.65] text-[#6B7280]">{t('footer')}</p>
    </TeacherPageCard>
  );
}

export { ResultsScreen };
