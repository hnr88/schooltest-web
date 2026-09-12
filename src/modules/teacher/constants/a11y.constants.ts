/**
 * ONE home for the teacher surface's target-size decision (task 047, TB-33).
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
 * TB-33 (Teacher Portal v2, recorded decision): the SURFACE-WIDE floor is the
 * design plus WCAG 2.2 AA 2.5.8 (24×24, inline text links exempt) — the design
 * draws the student page's export button at 38px and the Students-tab name link
 * as 18px of inline text, and 44 could only be met by redrawing it. That did NOT
 * abolish this constant: where a class states 44, 44 is still asserted, and this
 * is the one control that states it. The rule itself lives in
 * `tests/e2e/helpers/teacher-a11y-targets.ts`.
 *
 * Applied to every retry control on the pages THIS task owns (`/dashboard/results`
 * + its tabs and drill-down). The live monitor that used to carry the identical
 * pattern is retired (R1 PART B), so nothing is deferred any more.
 */
export const TEACHER_RETRY_BUTTON_CLASS = 'min-h-11';
