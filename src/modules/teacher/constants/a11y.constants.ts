/**
 * ONE home for the teacher surface's target-size decision (task 047).
 *
 * Every error branch on the surface renders the same shared pattern —
 * `Alert action={<Button variant="outline" size="sm">Try again</Button>}` — and
 * `size="sm"` measures 86×32 CSS px in the running app (measured with
 * `getBoundingClientRect()` on the real 404 branch of C-TR-1, both 1280px and
 * 375px). That CLEARS WCAG 2.2 AA 2.5.8, whose floor is 24×24, but it misses the
 * 44×44 floor this project set for itself (.qa/DESIGN.md §Non-negotiables, and
 * the same 44px already spelled out on `RESULTS_TAB_TRIGGER_CLASS`).
 *
 * Decision: raise the retry control to the project's 44px floor rather than stop
 * at the WCAG minimum, and keep `size="sm"`'s type scale and padding. `min-h-11`
 * (2.75rem) overrides the variant's `h-8` without forking the Button variant, so
 * the design system stays untouched.
 *
 * Applied to every retry control on the pages THIS task owns (`/dashboard` and
 * `/dashboard/results` + its tabs and drill-down). `/dashboard/test-sessions` and
 * the live monitor carry the identical pattern and are DEFERRED with those pages
 * — the follow-up applies this same constant there so the surface never splits.
 */
export const TEACHER_RETRY_BUTTON_CLASS = 'min-h-11';
