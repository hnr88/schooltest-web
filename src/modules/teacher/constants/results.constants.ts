// The Results surface lives on the ONE dashboard shell (ASSUMPTION A4,
// .qa/DECISIONS.md) — the same path task 031's rail entry already points at
// (`src/modules/shell/constants/nav.constants.ts` RESULTS_HREF). Declared once
// here so the class list, the class detail and the tab shell never restate it.
export const RESULTS_PATH = '/dashboard/results';

/**
 * The four tabs .qa/DESIGN.md §Results names, in wireframe order. `exit` is the
 * "Exit predictions — Coming soon" tab: it is selectable and readable, and it
 * carries NO actionable content (brief flow 26).
 */
export const RESULTS_TAB_ORDER = ['students', 'insights', 'progress', 'exit'] as const;

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

export const RESULTS_TAB_TRIGGER_CLASS =
  'h-11 flex-none rounded-none border-0 px-1 text-sm font-semibold whitespace-nowrap text-body transition-colors duration-200 ease-out hover:text-foreground data-active:text-primary after:bg-primary group-data-horizontal/tabs:after:-bottom-px motion-reduce:transition-none dark:text-muted-foreground dark:data-active:text-primary';
