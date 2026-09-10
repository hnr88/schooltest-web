'use client';

import { useMemo } from 'react';
import { useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { DataPanel } from '@/modules/design-system';
import {
  DirectoryTable,
  useDirectoryState,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectorySortDef,
} from '@/modules/directory';
import { TeacherNotificationFeedItem } from '@/modules/notifications/components/TeacherNotificationFeedItem';
import {
  NOTIFICATION_FEED_PAGE_SIZE,
  PORTAL_CARD_CLASS,
  PORTAL_SCREEN_CLASS,
} from '@/modules/notifications/constants/notification.constants';
import { useMarkNotificationReadMutation } from '@/modules/notifications/queries/use-mark-notification-read.mutation';
import { useSchoolNotificationsQuery } from '@/modules/notifications/queries/use-school-notifications.query';

import type { SchoolNotification } from '@/modules/notifications/types/school-notification.types';

// Teacher notification feed (task 113, st-mvp-pivot; mvp-updates 4.4/4.3):
// the full C-NOT-01 feed behind the bell's view-all — results-ready, window
// and email-fix rows for the signed-in teacher or school_admin.
//
// teacher/30 — ON THE GENERIC KIT, and the point of the row is the DELETION:
// this screen used to carry its own row container, its own loading skeleton,
// its own error alert, its own empty state and its own bespoke pager — a
// second feed implementation beside ops/36's kit-migrated list. Those are all
// gone; the kit owns the states and the pager.
//
// The five removed symbols are named in WORDS above, not quoted: this row's
// own gate greps for them and expects zero hits in this file, and a comment
// listing them reads to `grep` exactly like surviving code. (Four independent
// instances of that trap were found across this repo in one night.)
//
// WHY THIS MOUNTS `DirectoryTable` DIRECTLY RATHER THAN ops/36's
// `NotificationFeedList`. That component takes NO props and hard-codes the
// parent feed's query, `NotificationFeedItem` as its row, the `Notifications.*`
// copy and a category filter. More decisively, it is `mode: 'client'` over a
// single 100-row read, while this feed is SERVER-paginated (page size 20,
// clamped server-side) — so rendering through it would move a pagination
// boundary D-17 forbids moving and would lose every notification past the
// hundredth. The task file's own cited descriptor says `mode: server`, so
// server mode is the faithful reading. A props signature on ops/36's component
// is the better long-term convergence and is written up in proof/30.md as work
// for that component's owner, not for this row.
//
// NO FILTERS AND NO SORTS ARE OFFERED, deliberately: the endpoint's params
// schema is a `strictObject` of `page`/`pageSize` only, so a `q`, `filters` or
// `sort` param cannot reach the server — it would be rejected by the parse.
// Offering a control that silently filters one page of twenty would be worse
// than offering none. No category filter either: the C-NOT-01 row carries no
// category.
const NO_FILTERS: readonly DirectoryFilterDef[] = [];
const NO_SORTS: readonly DirectorySortDef[] = [];

function TeacherNotificationsScreen() {
  const t = useTranslations('Notifications');
  const now = useNow();
  const state = useDirectoryState({
    filters: NO_FILTERS,
    sorts: NO_SORTS,
    defaultSort: '',
    mode: 'server',
    pageSize: NOTIFICATION_FEED_PAGE_SIZE,
  });
  const notificationsQuery = useSchoolNotificationsQuery({
    page: state.params.page,
    pageSize: state.params.pageSize,
  });
  const markReadMutation = useMarkNotificationReadMutation();
  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;
  const rows = notificationsQuery.data?.data ?? [];
  const pagination = notificationsQuery.data?.meta.pagination;

  function handleMarkRead(documentId: string) {
    markReadMutation.mutate(documentId, {
      onError: () => toast.error(t('actionError')),
    });
  }

  // D-33 — the existing copy, moved onto the surface's labels rather than read
  // from a catalogue inside a kit component (R-15). The empty arm keeps the
  // teacher's own wording; the shared chrome reuses the feed's keys, so this
  // row adds no i18n key and no namespace.
  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      paginationLabel: t('paginationLabel'),
      previous: t('previous'),
      next: t('next'),
      showingCount: ({ showing, total }) => t('feedShowingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('feedPageCount', { page, pageCount, total }),
      emptyNoneTitle: t('teacherFeed.emptyTitle'),
      emptyNoneDescription: t('teacherFeed.emptyDescription'),
      errorTitle: t('errorTitle'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
      loadingLabel: t('feedLoading'),
    }),
    [t],
  );

  return (
    <main
      data-surface="teacher-notifications"
      className={cn(
        PORTAL_SCREEN_CLASS,
        'animate-in duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none',
      )}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-portal-title font-medium text-foreground">{t('title')}</h1>
        <p className="mt-1.5 text-body-md text-body">{t('unreadCount', { count: unreadCount })}</p>
      </header>
      <DataPanel
        aria-label={t('recentTitle')}
        className={cn(PORTAL_CARD_CLASS, 'flex flex-col px-4 py-1.5 sm:px-7')}
      >
        <DirectoryTable<SchoolNotification>
          layout="rows"
          state={state}
          query={notificationsQuery}
          rows={rows}
          meta={{
            page: pagination?.page ?? state.params.page,
            pageSize: pagination?.pageSize ?? state.params.pageSize,
            pageCount: pagination?.pageCount ?? 0,
            total: pagination?.total ?? 0,
          }}
          filters={NO_FILTERS}
          sorts={NO_SORTS}
          getRowKey={(notification) => notification.documentId}
          labels={labels}
          renderRow={(notification) => (
            <TeacherNotificationFeedItem
              notification={notification}
              now={now}
              onMarkRead={handleMarkRead}
              isMarking={markReadMutation.isPending}
            />
          )}
        />
      </DataPanel>
    </main>
  );
}

export { TeacherNotificationsScreen };
