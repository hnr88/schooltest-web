'use client';

/**
 * ops grid — the directory's non-data states, drawn as the design cards
 * (`Ops Portal.dc.html:110-138, 188-195` for the schools list, `:412-415`
 * for the tab tables). The §L-a11y A5 scaffolding is
 * unchanged: every arm's title is a real, focusable `<h2>` the body machine
 * moves focus onto.
 */
import { CircleAlert, GraduationCap, SearchX } from 'lucide-react';
import type { Ref } from 'react';

import { Skeleton } from '@/modules/design-system';

import type { DirectoryLabels } from '../types/directory.types';

const SKELETON_ROWS = [0, 1, 2, 3, 4];
const SKELETON_WIDTHS = ['46%', '62%', '38%', '54%', '42%'];

const NAVY_PILL =
  'h-[42px] rounded-full bg-[#0E2350] px-[22px] text-[13.5px] font-semibold text-white hover:bg-[#16326E]';
const WHITE_PILL =
  'h-[42px] rounded-full border border-[#D8DFEA] bg-white px-5 text-[13.5px] font-semibold text-[#0E2350]';
/**
 * The empty CTA is the design's OWN 40px pill (`Ops Portal.dc.html:194`:
 * `height:40px;padding:0 20px`). It must NOT be NAVY_PILL plus an `h-10`
 * override: with both `h-[42px]` and `h-10` in one class list, stylesheet
 * order decides and the 42px won (measured live) — silently breaking the
 * `:194` geometry.
 */
const EMPTY_NAVY_PILL =
  'h-10 rounded-full bg-[#0E2350] px-5 text-[13.5px] font-semibold text-white hover:bg-[#16326E]';

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
          {/* `Ops Portal.dc.html:114` — #EEF1F6 fills; the pulse sits on the
              crest block and the title bar only — the meta bar (`:117`) and
              the status pill (`:119`) are static. */}
          <Skeleton className="size-[52px] flex-none rounded-[14px] bg-[#EEF1F6]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton
              className="h-[13px] rounded-md bg-[#EEF1F6]"
              style={{ width: SKELETON_WIDTHS[row] }}
            />
            <Skeleton className="h-[11px] w-[34%] animate-none rounded-md bg-[#F4F6FA]" />
          </div>
          <Skeleton className="h-[26px] w-[94px] flex-none animate-none rounded-full bg-[#EEF1F6]" />
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
        {/* `Ops Portal.dc.html:129` draws circle-alert (circle r=9 + !), not a
            triangle — the glyph, not only the tile, is the design's signal. */}
        <CircleAlert className="size-[22px]" aria-hidden="true" />
      </div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-[16px] font-semibold text-[#0E2350] outline-none"
      >
        {labels.errorTitle}
      </h2>
      <p className="mx-auto mt-1.5 max-w-[400px] text-[13.5px] leading-[1.6] text-[#7C8698]">
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

/**
 * The design draws TWO empty blocks and this component renders both:
 *
 * - `decor="icon"` (default) — the schools-list block
 *   (`Ops Portal.dc.html:188-195`): `padding:56px 0`, the 46px radius-14
 *   `#F4F6FA` graduation-cap tile (`margin:0 auto 14px`), the 15/600 `#0E2350`
 *   title, the 13.5 `#7C8698` body (`margin-top:5px`) and the 40px navy pill
 *   CTA (`margin-top:18px`). The design reuses this same block for the list's
 *   search/filter no-match (`:1655-1660`), so only `decor="icon"` shows the
 *   kit's own Clear-filters pill.
 * - `decor="plain"` — the tab-table block (`:412-415`): `padding:52px 0`,
 *   title + body only, NO icon and NO CTA. The design also serves the tab
 *   no-match through it (`:1296-1298`: "Nothing matches this filter" — same
 *   two lines), so `decor="plain"` suppresses the auto Clear-filters pill (the
 *   tab's own chips/search above it own that). An EXPLICIT `emptyAction` still
 *   renders: OpsClassesTab's teacher deep-link clears a URL param that has no
 *   visible control anywhere else, and dropping it would dead-end that flow.
 */
export function DirectoryEmpty({
  variant,
  labels,
  onClearFilters,
  emptyAction,
  decor = 'icon',
  headingRef,
}: {
  variant: 'none' | 'no-matches';
  labels: DirectoryLabels;
  onClearFilters: () => void;
  emptyAction?: { label: string; onRun: () => void };
  decor?: 'icon' | 'plain';
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const isNoMatches = variant === 'no-matches';
  const isPlain = decor === 'plain';
  const title = isNoMatches ? labels.emptyNoMatchesTitle : labels.emptyNoneTitle;
  const description = isNoMatches
    ? labels.emptyNoMatchesDescription
    : labels.emptyNoneDescription;
  const explicitAction = !isNoMatches ? emptyAction : null;
  return (
    <div
      className="px-6 py-14 text-center data-[decor=plain]:py-[52px]"
      data-slot="directory-empty"
      data-decor={decor}
    >
      {/* `margin:0 auto 14px` in the design (`:188-195`) — without mx-auto the
          icon tile hugged the card's left edge while the text centered. */}
      {isPlain ? null : (
        <div className="mx-auto mb-3.5 grid size-[46px] place-items-center rounded-[14px] bg-[#F4F6FA]">
          {isNoMatches ? (
            <SearchX className="size-5 text-[#7C8698]" strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <GraduationCap className="size-5 text-[#7C8698]" strokeWidth={1.8} aria-hidden="true" />
          )}
        </div>
      )}
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-[15px] font-semibold text-[#0E2350] outline-none"
      >
        {title}
      </h2>
      {/* The design's `margin-top:5px` (`:193`/`:414`), not the 6px `mt-1.5`. */}
      <p className="mt-[5px] text-[13.5px] text-[#7C8698]">{description}</p>
      {/* Plain's only button is a consumer-supplied action (see above); the
          icon arm keeps the design's CTA slot (`:194`). */}
      {isPlain && !explicitAction ? null : (
        <div className="mt-[18px]">
          {isNoMatches ? (
            <button
              type="button"
              onClick={onClearFilters}
              className={`${EMPTY_NAVY_PILL} cursor-pointer`}
            >
              {labels.clearFilters}
            </button>
          ) : explicitAction ? (
            <button
              type="button"
              onClick={explicitAction.onRun}
              className={`${EMPTY_NAVY_PILL} cursor-pointer`}
            >
              {explicitAction.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
