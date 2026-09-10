'use client';

/**
 * teacher/09 — the by-class roll-up (design `:231–263`), built ON the shared
 * kit: `buildDirectoryRowGroups` + `DirectoryList` in `rows` layout, grouped
 * by the sitting's class documentId, with the kit's own state arms owning
 * loading, error, stale and the two empties. The kit's toolbar is deliberately
 * not mounted: the design gives this region no search, sort, filter, selection
 * or pagination, and a control that filters nothing is a dead affordance.
 *
 * Data is the two reads the page already serves — C-TS-2's sittings and
 * C-TD-1's class cards — derived by `lib/live-rollup.ts`. No wire change.
 *
 * OFFLINE: TanStack pauses (isPending true, isError false, data never lands),
 * so `isOnline` is checked before any empty state — a disconnected teacher
 * reads a disconnect notice, never "Nothing is running right now".
 *
 * teacher/22 boundary (ruling 4): whole-class sittings make the free-to-start
 * count honestly 0, so the group heading carries the design's freeLabel
 * sentence and the gated Add-a-session action (:240) renders nothing — the
 * start-session modal is teacher/22's to ship.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { QueryErrorFallback } from '@/modules/query-errors';
import { Alert } from '@/modules/design-system';
import {
  DirectoryEmpty,
  DirectoryError,
  DirectoryList,
  DirectoryLoading,
  DirectoryStaleBanner,
  DIRECTORY_DEFAULT_LABELS,
  buildDirectoryRowGroups,
  useDirectorySelection,
  type DirectoryLabels,
} from '@/modules/directory';
// Deep import BY ORCHESTRATOR RULING (chat-1fa2acb9, approving chat-1c324556):
// `@/modules/directory`'s barrel does not export `listScenarioOf` and the
// barrel is FROZEN — directory.types.ts / DirectoryStates.tsx / DirectoryTable.tsx
// are multi-way mixed between teacher/06, ops/34 and ops/14, so adding the
// export line is a coordinated handoff, not this row's edit. A future reader:
// do NOT "tidy" this into a barrel import — restore the barrel line instead.
import { listScenarioOf } from '@/modules/directory/lib/list-scenario';
import { EndSessionDialog } from '@/modules/teacher/components/EndSessionDialog';
import { LiveSessionCard } from '@/modules/teacher/components/LiveSessionCard';
import { classifyEndSessionError } from '@/modules/teacher/lib/end-session';
import { deriveLiveRollup } from '@/modules/teacher/lib/live-rollup';
import { useCloseTestSessionMutation } from '@/modules/teacher/queries/use-close-test-session.mutation';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTeacherTestsQuery } from '@/modules/teacher/queries/use-teacher-tests.query';
import { useTestSessionsQuery } from '@/modules/teacher/queries/use-test-sessions.query';
import { useIsOnline } from '@/modules/teacher/hooks/use-is-online';

const onlineSubscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

export function LiveSessionsByClass() {
  const t = useTranslations('Teacher.testSessions.rollup');
  const tLive = useTranslations('Teacher.testSessions.live');
  const sessionsQuery = useTestSessionsQuery();
  const dashboardQuery = useTeacherDashboardQuery();
  const testsQuery = useTeacherTestsQuery();
  const closeMutation = useCloseTestSessionMutation();
  const isOnline = useIsOnline();
  const [closeTarget, setCloseTarget] = useState<{ documentId: string; className: string } | null>(
    null,
  );

  const rollup = deriveLiveRollup(
    sessionsQuery.data?.sessions ?? [],
    dashboardQuery.data?.classes ?? [],
  );
  const rows = rollup.groups.flatMap((group) => group.sittings);
  const selection = useDirectorySelection({ page: rows, scope: [rows.length] });
  const nameOf = new Map(rollup.groups.map((group) => [group.classDocumentId, group]));
  const rollupLabels: DirectoryLabels = {
    ...DIRECTORY_DEFAULT_LABELS,
    emptyNoneTitle: t('emptyTitle'),
    emptyNoneDescription: t('emptyBody'),
  };
  const loading = sessionsQuery.isPending || dashboardQuery.isPending;

  let body;
  if (!isOnline && loading) {
    body = (
      <Alert variant="error" title={t('offlineTitle')}>
        {t('offlineBody')}
      </Alert>
    );
  } else {
    const scenario = listScenarioOf({
      isPending: loading,
      isError: sessionsQuery.isError || dashboardQuery.isError,
      isFetching: sessionsQuery.isFetching,
      error: sessionsQuery.error ?? dashboardQuery.error,
      enabled: true,
      isPlaceholderData: false,
      polled: false,
      hasActiveControls: false,
      rowCount: rows.length,
      total: rows.length,
    });
    if (scenario === 'loading') {
      body = <DirectoryLoading labels={rollupLabels} />;
    } else if (scenario === 'loadError') {
      body = (
        <DirectoryError
          labels={rollupLabels}
          onRetry={() => sessionsQuery.refetch()}
          retrying={sessionsQuery.isFetching}
        />
      );
    } else if (scenario === 'restricted' || scenario === 'gone') {
      body = <QueryErrorFallback error={sessionsQuery.error} action={null} />;
    } else if (scenario === 'empty-none' || scenario === 'empty-no-matches') {
      body = <DirectoryEmpty variant="none" labels={rollupLabels} onClearFilters={() => {}} />;
    } else {
      body = (
        <DirectoryList
          layout="rows"
          groups={buildDirectoryRowGroups({
            rows,
            selection,
            getRowKey: (sitting) => sitting.documentId,
            groupBy: {
              key: (sitting) => sitting.classDocumentId,
              heading: (groupKey) => {
                const group = nameOf.get(groupKey);
                if (group === undefined) return groupKey;
                const meta = group.yearBand
                  ? t('groupMeta', { yearBand: group.yearBand, students: group.studentCount })
                  : t('groupMetaNoYear', { students: group.studentCount });
                return t('groupHeading', {
                  name: group.name,
                  meta,
                  free: t('everyStudentInSession'),
                });
              },
            },
          })}
          renderRow={(sitting) => {
            const group = nameOf.get(sitting.classDocumentId);
            return (
              <LiveSessionCard
                sitting={sitting}
                classLabel={group?.name ?? ''}
                studentCount={group?.studentCount ?? 0}
                tests={testsQuery.data?.tests ?? []}
                onRequestClose={setCloseTarget}
              />
            );
          }}
        />
      );
    }
  }

  return (
    <section data-slot="teacher-live-rollup" className="flex flex-col gap-4">
      {!loading && isOnline && !sessionsQuery.isError && !dashboardQuery.isError ? (
        <p className="text-sm text-muted-foreground" role="status">
          {rollup.openSessionCount > 0
            ? t('schoolSummary', { sessions: rollup.openSessionCount, classes: rollup.openClassCount })
            : t('nothingRunning')}
        </p>
      ) : null}
      {body}
      <EndSessionDialog
        sessionClassName={closeTarget?.className ?? ''}
        open={closeTarget !== null}
        isPending={closeMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setCloseTarget(null);
        }}
        onConfirm={() => {
          if (closeTarget === null) return;
          closeMutation.mutate(closeTarget.documentId, {
            onSuccess: () => setCloseTarget(null),
            onError: (error) => {
              setCloseTarget(null);
              const alreadyClosed = classifyEndSessionError(error) === 'already_closed';
              toast.error(alreadyClosed ? tLive('alreadyClosedToast') : tLive('endErrorToast'));
            },
          });
        }}
      />
    </section>
  );
}
