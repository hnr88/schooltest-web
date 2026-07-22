---
id: 225
title: Sweep the re-skinned wizard — full regression, axe at 375 and 1280, motion audit, six-catalog parity
layer: regression
kind: verify
slice: W7 close-out proof over the whole add-child wizard
target: tests/e2e/054-wizard-portal-sweep.spec.ts, .qa/evidence/
contract: C-STUDENT-CREATE + C-UPLOAD-PARENT (exercised, not changed)
design: .qa/design/spec/03-portal-forms.md#2-add-child-wizard-portal--the-canonical-multi-step-form
status: TODO
depends_on: [221, 222, 223, 224]
---

## Objective
One spec that proves the whole wave landed: the design's geometry on all five steps, the motion
contract in both directions, the a11y contract at both widths, the six-catalog parity, and that every
pre-existing wizard assertion is still green.

## Contract
No contract changes. The sweep exercises the real ones: `POST /api/upload` (multipart, part `files`)
and `POST /api/students` (`{ data }`, 200, parent JWT, ownership by the caller). It runs as a
throwaway parent and deletes every student and auth row it creates.

## Design source
`03-portal-forms.md` §2 in full, plus §A (motion), § RESPONSIVE and § ACCESSIBILITY GAPS. The sweep
asserts the numbers the individual tasks shipped rather than re-deriving them:

| Surface | Asserted values |
|---|---|
| Frame | grid first track `230px` at 1280; `h1` `Add a child` at `30px/500/-0.02em` |
| Rail | 5 buttons in one `<ol>`; exactly one `aria-current="step"`; 30px dots at `1.5px`; done/current/upcoming fills |
| Card | radius `24px`, padding `34px 38px`, `max-width 760px` |
| Fields | inputs `48px`/`1.5px`/radius `12px`/`px 15px`/`14px`; labels `12.5px/600`; helpers `12px` |
| Chips | `44px` tall, radius `12px`, `13.5px`; navy fill when selected |
| Dropzones | dashed `1.5px`, radius `16px`, padding `30px 20px`, 46px icon well |
| Review | wrapper radius `16px`, rows `15px 20px`, values `13.5px/600` right-aligned |
| Footer | pill primary, `Step {n} of 5` counter, Back never disabled |

## Files
- `tests/e2e/054-wizard-portal-sweep.spec.ts` (new; the existing 051/052/053 are run, not rewritten)
- `.qa/evidence/` — screenshots at 375 and 1280 for each of the five steps

## Depends on
221, 222, 223, 224 — the last four behaviour tasks of the wave.

## Steps
1. Run the four pre-existing wizard specs plus `dashboard-students` and `children-profile` and record
   the output.
2. Write the sweep: geometry per step, motion + reduced motion, axe at both widths, keyboard walk.
3. Run the FULL suite and compare against the recorded baseline in `.qa/PLAN.md` (157 passed / 1
   failed / 2 skipped, the single red owned by W9).
4. Catalog parity check across all six locales.
5. Capture screenshots into `.qa/evidence/`.

## Project rules
`.claude/rules/testing.md` + D-VERIFY-1 (proof is a real Playwright run against the running app; the
builder never passes their own task) · `.claude/rules/quality.md` (axe, focus, 44px) ·
`.claude/rules/i18n.md` (six catalogs key-identical) · `.qa/PLAN.md` "Definition of done".

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test` shows **no new red** against the recorded baseline; `051`, `052`, `053`,
  `student-wizard-contrast`, `dashboard-students`, `children-profile`, `shell`, `shell-a11y` all green.
- The new sweep asserts every row of the table above, on the real running app.
- Keyboard walk: from the back link, Tab reaches the rail buttons, every field control, and both
  footer controls in visual order, each with a visible focus indicator; Escape closes any open popup.
- Motion audit: for each of the six animated surfaces (card transition, rail dot, chip, dropzone
  hover, error alert, success medallion) the default run reports a non-`none`
  `animation-name`/`transition-property` and the `reducedMotion: 'reduce'` run reports `none` — and
  the flow still completes end-to-end under reduced motion.
- axe: zero serious/critical on all five steps at 375 AND 1280, including the open select popup, the
  error state and the success state.
- A real child is created and read back after a reload, then deleted; no orphan rows and no leftover
  auth-email rows.
- Six catalogs key-identical (assert the key sets are equal, not just the counts).
- Zero banned-pattern grep hits across the whole W7 diff (`#[0-9a-fA-F]{6}` in `src/**`,
  `p-[`/`w-[`/`h-[`/`text-[`, `any`, `TODO`, `FIXME`, mock/fixture data in `src/**`).
- Every deviation recorded by tasks 209, 210, 211, 212, 213, 216, 217 and the BLOCKED task 220 is
  present in this task's Evidence as a single consolidated list, so the wave's design departures are
  reviewable in one place.

## Assumptions
The pre-existing `notification-preference-controls.spec.ts:75` red is W9's and is not this wave's
regression; it is recorded as unchanged rather than fixed here.

## Evidence
