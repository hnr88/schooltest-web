'use client';

/**
 * ops grid — the directory's non-data states, drawn as the design cards
 * (`Ops Portal.dc.html:110-138, 188-195`). The §L-a11y A5 scaffolding is
 * unchanged: every arm's title is a real, focusable `<h2>` the body machine
 * moves focus onto.
 */
import { GraduationCap, SearchX, TriangleAlert } from 'lucide-react';
import type { Ref } from 'react';

import { Skeleton } from '@/modules/design-system';

import type { DirectoryLabels } from '../types/directory.types';

const SKELETON_ROWS = [0, 1, 2, 3, 4];
const SKELETON_WIDTHS = ['46%', '62%', '38%', '54%', '42%'];

const NAVY_PILL =
  'h-[42px] rounded-full bg-[#0E2350] px-[22px] text-[13.5px] font-semibold text-white hover:bg-[#16326E]';
const WHITE_PILL =
  'h-[42px] rounded-full border border-[#D8DFEA] bg-white px-5 text-[13.5px] font-semibold text-[#0E2350]';

export function DirectoryLoading({
  labels,
  headingRef,
}: {
  labels: DirectoryLabels;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div role="status" data-slot="directory-loading" className="px-6 pt-1.5 pb-1">
      {SKELETON_ROWS.map((row) => (
        <div
          key={row}
          className="flex items-center gap-4 border-b border-[#F4F6FA] px-2.5 py-3.5"
        >
          <Skeleton className="size-[52px] flex-none rounded-[14px]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-[13px] rounded-md" style={{ width: SKELETON_WIDTHS[row] }} />
            <Skeleton className="h-[11px] w-[34%] rounded-md bg-[#F4F6FA]" />
          </div>
          <Skeleton className="h-[26px] w-[94px] flex-none rounded-full" />
        </div>
      ))}
      {/* The design draws the caption UNDER the skeleton rows
          (`Ops Portal.dc.html:110-124`, "Loading schools…" last, 16/6 padding);
          the focusable h2 stays the arm's heading either way. */}
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="px-2.5 pt-4 pb-1.5 text-[13px] font-medium text-[#9AA6B8] outline-none"
      >
        {labels.loadingLabel}
      </h2>
    </div>
  );
}

export function DirectoryError({
  labels,
  onRetry,
  retrying,
  headingRef,
  secondaryAction,
}: {
  labels: DirectoryLabels;
  onRetry: () => void;
  retrying: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
  secondaryAction?: { label: string; onRun: () => void };
}) {
  return (
    <div className="px-8 py-14 text-center" data-slot="directory-error">
      {/* The design's order (`Ops Portal.dc.html:126-138`): icon tile, then the
          16px/600 title, then the description, then the two pill actions. */}
      <div className="mx-auto grid size-12 place-items-center rounded-[16px] bg-[#FDEEEC] text-[#B42318]">
        <TriangleAlert className="size-[22px]" aria-hidden="true" />
      </div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-[16px] font-semibold text-[#0E2350] outline-none"
      >
        {labels.errorTitle}
      </h2>
      <p className="mx-auto mt-1.5 max-w-[400px] text-[13.5px] leading-relaxed text-[#7C8698]">
        {labels.errorDescription}
      </p>
      <div className="mt-5 flex justify-center gap-2.5">
        <button type="button" disabled={retrying} onClick={onRetry} className={`${NAVY_PILL} cursor-pointer disabled:opacity-60`}>
          {labels.retry}
        </button>
        {secondaryAction ? (
          <button type="button" onClick={secondaryAction.onRun} className={`${WHITE_PILL} cursor-pointer`}>
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
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
    <div
      role="status"
      data-slot="directory-stale-banner"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
    >
      <p className="text-sm font-semibold text-foreground">{labels.errorStaleBanner}</p>
      <button type="button" disabled={retrying} onClick={onRetry} className={`${NAVY_PILL} h-8 px-4 text-[13px] disabled:opacity-60`}>
        {labels.retry}
      </button>
    </div>
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
  const isNoMatches = variant === 'no-matches';
  const title = isNoMatches ? labels.emptyNoMatchesTitle : labels.emptyNoneTitle;
  return (
    <div className="px-6 py-14 text-center" data-slot="directory-empty">
      {/* `margin:0 auto 14px` in the design (`:188-195`) — without mx-auto the
          icon tile hugged the card's left edge while the text centered. */}
      <div className="mx-auto mb-3.5 grid size-[46px] place-items-center rounded-[14px] bg-[#F4F6FA]">
        {isNoMatches ? (
          <SearchX className="size-5 text-[#7C8698]" aria-hidden="true" />
        ) : (
          <GraduationCap className="size-5 text-[#7C8698]" aria-hidden="true" />
        )}
      </div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-[15px] font-semibold text-[#0E2350] outline-none"
      >
        {title}
      </h2>
      <p className="mt-1.5 text-[13.5px] text-[#7C8698]">
        {isNoMatches ? labels.emptyNoMatchesDescription : labels.emptyNoneDescription}
      </p>
      <div className="mt-[18px]">
        {isNoMatches ? (
          <button
            type="button"
            onClick={onClearFilters}
            className={`${NAVY_PILL} h-10 cursor-pointer px-5`}
          >
            {labels.clearFilters}
          </button>
        ) : emptyAction ? (
          <button type="button" onClick={emptyAction.onRun} className={`${NAVY_PILL} h-10 cursor-pointer px-5`}>
            {emptyAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
