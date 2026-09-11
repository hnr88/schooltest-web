'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { IdleClassChips } from '@/modules/teacher/components/IdleClassChips';
import { LiveSessionsByClass } from '@/modules/teacher/components/LiveSessionsByClass';
import { ScheduledSessions } from '@/modules/teacher/components/ScheduledSessions';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { TeacherPageCard } from '@/modules/teacher/components/v2/TeacherPageCard';
import { TeacherPageHeader } from '@/modules/teacher/components/v2/TeacherPageHeader';
import { useLiveSessionsPage } from '@/modules/teacher/hooks/useLiveSessionsPage';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';

const STATE_LINE = 'border-t border-[#ECEEF2] px-8 py-12 text-center text-[13.5px] text-[#6B7280]';

// /dashboard/test-sessions — the school-wide Live sessions screen (Teacher
// Portal v2.dc.html:218–299). Every start goes through the one
// Start-new-session modal's store.
function TestSessionsScreen() {
  const t = useTranslations('TeacherPortal.liveSessions');
  const openStartSession = useStartSessionStore((store) => store.open);
  const { status, rollup, retry, isRetrying, isBookingsError, retryBookings } = useLiveSessionsPage();
  const startFor = (classId: string) => openStartSession({ classId });

  let subtitle: string | undefined;
  if (status === 'ready') {
    subtitle =
      rollup.openSessionCount > 0
        ? t('summary', { sessions: rollup.openSessionCount, classes: rollup.openClassCount })
        : t('summaryNone');
  }

  return (
    <TeacherPageCard data-surface="teacher-test-sessions" data-status={status} className="mb-2">
      <TeacherPageHeader
        title={t('title')}
        subtitle={subtitle}
        actions={
          <TeacherButton data-slot="start-session-button" onClick={() => openStartSession()}>
            <Plus aria-hidden="true" className="size-[15px]" strokeWidth={2} />
            {t('startSession')}
          </TeacherButton>
        }
      />
      {status === 'loading' ? (
        <p role="status" className={STATE_LINE}>
          {t('loading')}
        </p>
      ) : null}
      {status === 'error' ? (
        <div role="alert" className={`flex flex-col items-center gap-3 ${STATE_LINE}`}>
          {t('loadError')}
          <TeacherButton tone="secondary" size="sm" loading={isRetrying} onClick={retry}>
            {t('retry')}
          </TeacherButton>
        </div>
      ) : null}
      {status === 'ready' ? (
        <>
          <LiveSessionsByClass groups={rollup.groups} onAddSession={startFor} />
          {rollup.bookings.length > 0 || isBookingsError ? (
            <ScheduledSessions
              bookings={rollup.bookings}
              isError={isBookingsError}
              onRetry={retryBookings}
            />
          ) : null}
          {rollup.groups.length + rollup.idleClasses.length > 0 ? (
            <IdleClassChips classes={rollup.idleClasses} onStart={startFor} />
          ) : null}
        </>
      ) : null}
    </TeacherPageCard>
  );
}

export { TestSessionsScreen };
