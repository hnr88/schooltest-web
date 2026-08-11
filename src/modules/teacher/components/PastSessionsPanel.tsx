'use client';

import { History } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { PastSessionsTable } from '@/modules/teacher/components/PastSessionsTable';
import { PAST_SESSIONS_SCROLL_CLASS } from '@/modules/teacher/constants/past-sessions.constants';
import { usePastSessions } from '@/modules/teacher/hooks/usePastSessions';

// .qa/DESIGN.md §Test sessions (view 1), below the code panel: the "Past
// sessions" history. Every row is a real sitting from C-TS-2; there is no
// seeded example row and no canned count, so a failed read renders the error
// branch and an empty history renders the empty state — never a table that
// looks populated.
function PastSessionsPanel() {
  const t = useTranslations('Teacher.testSessions.pastSessions');
  const { status, sessions, tests, sessionCount, retry } = usePastSessions();

  return (
    <section
      data-slot="past-sessions"
      data-status={status}
      className="flex flex-col gap-5 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-panel-title font-bold text-foreground">{t('panelTitle')}</h2>
        <p className="text-body-sm text-muted-foreground">
          {status === 'ready'
            ? t('countDescription', { count: sessionCount })
            : t('panelDescription')}
        </p>
      </div>

      {status === 'loading' ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : null}

      {status === 'error' ? (
        <Alert
          variant="error"
          title={t('loadErrorTitle')}
          action={
            <Button variant="outline" size="sm" onClick={retry}>
              {t('retry')}
            </Button>
          }
        >
          {t('loadErrorBody')}
        </Alert>
      ) : null}

      {status === 'empty' ? (
        <EmptyState
          icon={History}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="border-none px-0 py-2"
        />
      ) : null}

      {status === 'ready' ? (
        <div className={PAST_SESSIONS_SCROLL_CLASS}>
          <PastSessionsTable sessions={sessions} tests={tests} />
        </div>
      ) : null}
    </section>
  );
}

export { PastSessionsPanel };
