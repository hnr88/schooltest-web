---
id: 202
title: Build the portal step card with the per-step heading block and the step-change transition
layer: ui
kind: build
slice: Wizard step card — 760px white card, `h2` + sub-heading, 22px body rhythm, step-to-step motion
target: src/modules/student-wizard/components/WizardStepCard.tsx, src/modules/student-wizard/components/WizardScreen.tsx, src/i18n/messages/*.json
contract: n/a — pure presentation; the design spec section below is the contract
design: .qa/design/screens/portal--add-child-multi-step.html:26-30, .qa/design/spec/03-portal-forms.md#23-step-card
status: TODO
depends_on: [200]
---

## Objective
Replace the current `rounded-panel border border-border bg-card p-5 shadow-sm` section
(`WizardScreen.tsx:79`) with the portal step card, move every step's heading into it, and author the
step-to-step transition the export does not have.

## Contract
n/a. `03-portal-forms.md` §2.3, verbatim:

```
card : background:#FFFFFF; border-radius:24px; box-shadow:0 1px 2px rgba(14,35,80,.04);
       padding:34px 38px; display:flex; flex-direction:column;
       max-width:760px; overflow-y:auto                                   (L26)
body : display:flex; flex-direction:column; gap:22px   (step 5 uses 24px, L123)
h2   : margin:0; font-size:20px; font-weight:600; color:#0E2350
p    : margin:6px 0 0; font-size:13.5px; color:#7C8698
two-up rows : display:grid; grid-template-columns:1fr 1fr; gap:16px
```

In-card heading strings (distinct from task 201's rail subtitles):

| Step | `h2` | sub |
|---|---|---|
| 1 | `Personal details` | `Step 1 of 5 · Who the student is` |
| 2 | `Education` | `Step 2 of 5 · Current schooling and target entry` |
| 3 | `Parent or guardian` | `Step 3 of 5 · Who we contact about results and enrolment` |
| 4 | `Photo & voice` | `Step 4 of 5 · Optional photo and voice introduction` |
| 5 | `Review & confirm` | `Step 5 of 5 · You can change any of this later in the student's profile.` |

## Design source
Card: `flex max-w-190 flex-col overflow-y-auto rounded-portal-card bg-card px-9.5 py-8.5 shadow-sm`
(760px = `max-w-190`, 34px = `py-8.5`, 38px = `px-9.5`, radius token from task 200). The design shadow
`0 1px 2px rgba(14,35,80,.04)` is the existing `--shadow-sm` — use `shadow-sm`, emit no new shadow.
Body `flex flex-col gap-5.5` (22px); step 5 passes `gap-6` (24px). `h2`: `text-xl font-semibold
text-navy-900`. Sub: `mt-1.5 text-body-sm text-body` (design ink `#7C8698` is 3.67:1 → substituted per
task 200's ink policy). Two-up row helper class used by every field task: `grid gap-4 sm:grid-cols-2`.

The sub-heading keeps the EXISTING `StudentWizard.stepCaption` key
(`"Step {current} of {total} · {title}"`); only the `steps.<key>.title` / `steps.<key>.description`
VALUES change to the table above. Values are safe to change: every spec resolves them through
`cat(en, …)` from the catalog, never as a literal.

Motion (D-DESIGN-3; `03-portal-forms.md` §A.4 records that the export has no step transition at all):
the card body is keyed on the step index and enters with `animate-in fade-in duration-200
ease-out-expo motion-reduce:animate-none`, plus `slide-in-from-right-2` moving forward and
`slide-in-from-left-2` moving back (direction read from the previous step index held in the hook).
`transform` + `opacity` only — the card frame never animates its height.

## Files
- `src/modules/student-wizard/components/WizardStepCard.tsx` (new — card frame + heading block + keyed body)
- `src/modules/student-wizard/components/WizardScreen.tsx` — mount it around the step switch
- `src/modules/student-wizard/hooks/use-student-wizard.ts` — expose `direction: 'forward' | 'back'`
- `src/modules/student-wizard/components/Step{Personal,Education,Guardian,Media,Review}.tsx` — drop
  each step's own `animate-in` wrapper and its `gap-4.5`; the card owns both now
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — the ten updated values

## Depends on
200 — `rounded-portal-card` and the frame this card sits in.

## Steps
1. Update the ten catalog values (5 titles + 5 descriptions) × 6 locales.
2. Add `direction` to `use-student-wizard`.
3. Build `WizardStepCard`; move the heading out of the individual steps.
4. Re-point `WizardScreen`; delete the duplicated per-step animation wrappers.
5. Playwright: geometry, heading text, transition, reduced motion; then axe.

## Project rules
`.claude/rules/tailwind.md` (no arbitrary values; transform/opacity only; `ease-out-expo`) ·
`.claude/rules/module-pattern.md` (≤120 lines/component) · `.claude/rules/i18n.md` ·
`.claude/rules/quality.md` (ordered headings — this `h2` sits under the frame's single `h1`).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: on step 1 the card's computed `border-radius` is `24px`, `padding` is `34px 38px`,
  `max-width` is `760px`; the `h2` reads `Personal details` at `font-size: 20px; font-weight: 600`;
  the sub reads `Step 1 of 5 · Who the student is`.
- Advancing to step 2 changes the `h2` to `Education`, and the body element reports a non-`none`
  `animation-name`; under `emulateMedia({ reducedMotion: 'reduce' })` the same element reports
  `animation-name: none`.
- 375px: no horizontal page scroll, two-up rows single-column.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051` (its `Step 4 of 5` assertion — see task 203's uniqueness rule), `052`, `053`,
  `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
Step 5's 24px body gap and the other steps' 22px both ship. `max-w-190` must be DOM-verified to be
760px rather than assumed.

## Evidence
