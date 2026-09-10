// The Results surface lives on the ONE dashboard shell (ASSUMPTION A4,
// .qa/DECISIONS.md) — the same path task 031's rail entry already points at
// (`src/modules/shell/constants/nav.constants.ts` RESULTS_HREF). Declared once
// here so the class list, the class detail and the tab shell never restate it.
export const RESULTS_PATH = '/dashboard/results';

/**
 * The six tabs of the class shell, in the design export's label order
 * (`Teacher Portal v2.dc.html:3154–3166`): Students · Class progress ·
 * Teaching insights · Exit predictions · Family reports · Live sessions.
 * Widened from four for teacher/07 — `progress` and `insights` swap, and
 * `reports`/`live` join as TAB VALUES, never routes ([D-20]; tasks 25 and 08
 * fill their panels). The design's `v:'results'` is NOT adopted: the existing
 * value `students` stays, or `DEFAULT_RESULTS_TAB` and `isResultsTabValue`
 * would break ([D-05] — existing copy and values stay).
 */
export const RESULTS_TAB_ORDER = [
  'students',
  'progress',
  'insights',
  'exit',
  'reports',
  'live',
] as const;

export const DEFAULT_RESULTS_TAB = 'students';

/**
 * 44px minimum pointer target (WCAG 2.2 AA 2.5.8) on the tab itself, plus the
 * design-system underline treatment (DS §5.6): hairline rule under the row, a
 * 2px underline overlapping it on the active tab, idle body ink, active
 * `--primary`. Tokens only — no raw hex, no arbitrary values.
 *
 * Task 047: the idle tab was `--muted-foreground` (#64748B) and the tab row is
 * transparent over the dashboard well (#EEF2F7) — measured by axe at 4.23:1,
 * under the 4.5:1 floor for 14px text. `--color-body` (#475569) is the
 * established pairing on the well at 6.74:1 and keeps idle/active distinct.
 */
export const RESULTS_TABS_LIST_CLASS =
  'w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-border bg-transparent p-0 group-data-horizontal/tabs:h-auto';

/**
 * Task 047, WCAG 2.2 AA 2.4.7 (Focus Visible). Base UI's `Tabs.Panel` takes
 * `tabIndex=0`, so Tab from the selected trigger lands ON the panel — and the
 * read-only `ui/tabs.tsx` wrapper hands it `outline-none` with NO replacement
 * indicator (measured: the tab walk on /dashboard/results/<class> reported
 * `DIV[tabs-content] … ring=false`). The primitive cannot be edited (Law 11), but
 * the panel's `className` is the caller's, so the ring is restored here — the same
 * `ring-ring`/`ring-offset` pair every other focusable on this surface uses.
 */
export const RESULTS_TAB_PANEL_CLASS =
  'pt-6 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-well';

export const RESULTS_TAB_TRIGGER_CLASS =
  'h-11 flex-none rounded-none border-0 px-1 text-sm font-semibold whitespace-nowrap text-body transition-colors duration-200 ease-out hover:text-foreground data-active:text-primary after:bg-primary group-data-horizontal/tabs:after:-bottom-px motion-reduce:transition-none dark:text-muted-foreground dark:data-active:text-primary';
