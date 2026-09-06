'use client';

/**
 * Task 04 — the directory's distinct non-data states. The three empty states
 * the task demands stay separate: nothing yet (create), no matches (clear
 * filters), read failure (retry). A failed refetch with previously served
 * rows shows an explicit stale banner over those rows — never a false empty
 * tenant (the rows on screen are the server's last answer, kept by
 * keepPreviousData in the consumer's query).
 */
import { Inbox, SearchX, TriangleAlert } from 'lucide-react';

import { Alert, Button, EmptyState, Skeleton } from '@/modules/design-system';

import type { DirectoryLabels } from '../types/ops-directory.types';

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export function OpsDirectoryLoading({ labels }: { labels: DirectoryLabels }) {
  return (
    <div
      role="status"
      aria-label={labels.loadingLabel}
      data-slot="ops-directory-loading"
      className="flex flex-col gap-3 p-6"
    >
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      {SKELETON_ROWS.map((row) => (
        <Skeleton key={row} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function OpsDirectoryError({
  labels,
  onRetry,
  retrying,
}: {
  labels: DirectoryLabels;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <EmptyState
      icon={TriangleAlert}
      tone="muted"
      title={labels.errorTitle}
      description={labels.errorDescription}
      action={
        <Button type="button" variant="outline" size="sm" loading={retrying} onClick={onRetry}>
          {labels.retry}
        </Button>
      }
    />
  );
}

export function OpsDirectoryStaleBanner({
  labels,
  onRetry,
  retrying,
}: {
  labels: DirectoryLabels;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <Alert
      variant="warning"
      title={labels.errorStaleBanner}
      action={
        <Button type="button" variant="outline" size="sm" loading={retrying} onClick={onRetry}>
          {labels.retry}
        </Button>
      }
    >
      {labels.errorDescription}
    </Alert>
  );
}

export function OpsDirectoryEmpty({
  variant,
  labels,
  onClearFilters,
  emptyAction,
}: {
  variant: 'none' | 'no-matches';
  labels: DirectoryLabels;
  onClearFilters: () => void;
  emptyAction?: { label: string; onRun: () => void };
}) {
  if (variant === 'no-matches') {
    return (
      <EmptyState
        icon={SearchX}
        title={labels.emptyNoMatchesTitle}
        description={labels.emptyNoMatchesDescription}
        action={
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
            {labels.clearFilters}
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={Inbox}
      title={labels.emptyNoneTitle}
      description={labels.emptyNoneDescription}
      action={
        emptyAction ? (
          <Button type="button" size="sm" onClick={emptyAction.onRun}>
            {emptyAction.label}
          </Button>
        ) : undefined
      }
    />
  );
}
