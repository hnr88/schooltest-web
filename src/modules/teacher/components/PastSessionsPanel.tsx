'use client';

import { useTranslations } from 'next-intl';

import { PastSessionsTable } from '@/modules/teacher/components/PastSessionsTable';
import { usePastSessions } from '@/modules/teacher/hooks/usePastSessions';

// .qa/DESIGN.md §Test sessions (view 1), below the code panel: the "Past
// sessions" history. ops/34 moved the table onto the shared directory kit, so
// the panel is the header and the data: the kit renders loading, error, empty
// and the sticky scroll region itself. `data-status` keeps reporting the same
// two-read machine (either read failed = error; C-TS-2 answered with zero
// sessions = empty) that the specs and the count line read.
function PastSessionsPanel() {
  const t = useTranslations('Teacher.testSessions.pastSessions');
  const { status, sessions, tests, sessionCount, queryStatus } = usePastSessions();

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

      <PastSessionsTable sessions={sessions} tests={tests} queryStatus={queryStatus} />
    </section>
  );
}

export { PastSessionsPanel };
