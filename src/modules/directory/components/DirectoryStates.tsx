'use client';

/**
 * Task 02 — the directory's distinct non-data states. The three empty states
 * the task demands stay separate: nothing yet (create), no matches (clear
 * filters), read failure (retry). A failed refetch with previously served
 * rows shows an explicit stale banner over those rows — never a false empty
 * tenant (the rows on screen are the server's last answer, kept by
 * keepPreviousData in the consumer's query).
 *
 * teacher/04 — §L-a11y A5: every arm's title is a REAL, visible, focusable
 * `<h2>` carrying `tabIndex={-1}`. When the body machine swaps from rows to
 * this arm, DirectoryTable moves focus to the heading, so a keyboard operator
 * lands on the arm's own title — announced with its name, out of the tab
 * order, and never on a wrapper or `<body>`. The EmptyState composite draws
 * icon/description/action only (ops/14: `title={''}` — its own title `<p>` is
 * structurally absent, so the h2 IS the one title; the old CSS-suppression
 * class was retired here after failing live twice, untestable in jsdom).
 */
import { Inbox, SearchX, TriangleAlert } from 'lucide-react';
import type { Ref } from 'react';

import { Alert, Button, EmptyState, Skeleton } from '@/modules/design-system';

import type { DirectoryLabels } from '../types/directory.types';

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export function DirectoryLoading({
  labels,
  headingRef,
}: {
  labels: DirectoryLabels;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div role="status" data-slot="directory-loading" className="flex flex-col gap-3 p-6">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-sm font-medium text-muted-foreground outline-none"
      >
        {labels.loadingLabel}
      </h2>
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      {SKELETON_ROWS.map((row) => (
        <Skeleton key={row} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function DirectoryError({
  labels,
  onRetry,
  retrying,
  headingRef,
}: {
  labels: DirectoryLabels;
  onRetry: () => void;
  retrying: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 text-center font-semibold outline-none"
      >
        {labels.errorTitle}
      </h2>
      {/* ops/14 fix — description-only: the h2 is the ONE title (same defect as
          the empty arms; the CSS suppression below is not testable and failed
          live). */}
      <EmptyState
        icon={TriangleAlert}
        tone="muted"
        title={''}
        description={labels.errorDescription}
        action={
          <Button type="button" variant="outline" size="sm" loading={retrying} onClick={onRetry}>
            {labels.retry}
          </Button>
        }
      />
    </div>
  );
}

export function DirectoryStaleBanner({
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

export function DirectoryEmpty({
  variant,
  labels,
  onClearFilters,
  emptyAction,
  headingRef,
}: {
  variant: 'none' | 'no-matches';
  labels: DirectoryLabels;
  onClearFilters: () => void;
  emptyAction?: { label: string; onRun: () => void };
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const title = variant === 'no-matches' ? labels.emptyNoMatchesTitle : labels.emptyNoneTitle;
  // ops/14 fix — the EmptyState gets NO title string: the arm's `<h2>` above
  // is the ONE title, and passing the same string into EmptyState's own `<p>`
  // rendered it twice on screen and once per node to screen readers (the CSS
  // suppression below could not be trusted — it is invisible to unit tests
  // and failed twice in live runs). Description-only, structurally.
  if (variant === 'no-matches') {
    return (
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-center font-semibold outline-none"
        >
          {title}
        </h2>
        <EmptyState
          icon={SearchX}
          title={''}
          description={labels.emptyNoMatchesDescription}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
              {labels.clearFilters}
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 text-center font-semibold outline-none"
      >
        {title}
      </h2>
      <EmptyState
        icon={Inbox}
        title={''}
        description={labels.emptyNoneDescription}
        action={
          emptyAction ? (
            <Button type="button" size="sm" onClick={emptyAction.onRun}>
              {emptyAction.label}
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
