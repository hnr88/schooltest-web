---
id: 201
title: Build the 230px vertical step rail with the done/current/upcoming state matrix and gated jumps
layer: ui
kind: build
slice: Wizard step rail — 5 rows of dot + connector + title + subtitle, clickable navigation
target: src/modules/student-wizard/components/WizardStepRail.tsx, src/modules/student-wizard/components/WizardScreen.tsx, src/modules/student-wizard/constants/student-wizard.constants.ts, src/i18n/messages/*.json
contract: n/a — pure presentation + navigation; the design spec section below is the contract
design: .qa/design/screens/portal--add-child-multi-step.html:10-23, .qa/design/spec/03-portal-forms.md#22-step-rail
status: TODO
depends_on: [200]
---

## Objective
Replace the horizontal `WizardStepper` (`components/WizardStepper.tsx`) with the portal's vertical
rail, and make each row a real keyboard-operable control that navigates without ever skipping the
validation the wizard already enforces.

## Contract
n/a. `03-portal-forms.md` §2.2, verbatim:

```
container   : display:flex; flex-direction:column; gap:0; padding-top:8px      (L10)
row         : display:flex; gap:14px; cursor:pointer                           (L12)
left column : display:flex; flex-direction:column; align-items:center          (L13)
dot         : width:30px; height:30px; border-radius:999px; box-sizing:border-box;
              border:1.5px solid <dotBorder>; background:<dotBg>; color:<dotFg>;
              display:grid; place-items:center; font-size:12.5px; font-weight:600; flex:none
connector   : width:1.5px; flex:1; min-height:26px; background:<lineBg>; display:<lineDisplay>
text block  : padding:5px 0 22px
  title     : font-size:14px; font-weight:<w>; color:<fg>
  sub       : font-size:12px; color:#9AA6B8; margin-top:2px
```

State matrix (§2.2, resolved from `Parent Portal.dc.html` L929-942):

| State | dot content | dotBg | dotFg | dotBorder | lineBg | title `fg` | title `w` |
|---|---|---|---|---|---|---|---|
| done (`n < step`) | `✓` | `#0E2350` | `#FFFFFF` | `#0E2350` | `#0E2350` | `#3D4A5C` | `500` |
| current (`n === step`) | `String(n)` | `#0E2350` | `#FFFFFF` | `#0E2350` | `#E4E9F2` | `#0E2350` | `600` |
| upcoming (`n > step`) | `String(n)` | `#FFFFFF` | `#9AA6B8` | `#D8DFEA` | `#E4E9F2` | `#9AA6B8` | `500` |

`lineDisplay` is `none` on step 5, `block` otherwise. Rail content (§2.2 — these subtitles are
DIFFERENT from the in-card sub-headings and both must ship):

| # | Rail title | Rail subtitle |
|---|---|---|
| 1 | `Personal` | `Who the student is` |
| 2 | `Education` | `School & target entry` |
| 3 | `Guardian` | `Contact details` |
| 4 | `Media` | `Photo & voice intro` |
| 5 | `Review` | `Confirm details` |

## Design source
Tailwind mapping: rail `flex flex-col pt-2`; row `flex w-full gap-3.5 text-left`; left column
`flex flex-col items-center`; dot `grid size-7.5 shrink-0 place-items-center rounded-full
border-hairline text-meta font-semibold` (30px = `size-7.5`; 12.5px = `text-meta`; `border-hairline`
from task 200); connector `rail-line min-h-6.5 flex-1` (26px = `min-h-6.5`); text block
`pt-1.25 pb-5.5` (5px / 22px); title `text-sm` (14px); sub `mt-0.5 text-xs` (12px).

Colours by state — done `bg-navy-900 text-primary-foreground border-navy-900`, connector
`bg-navy-900`; current identical dot with connector `bg-portal-line-2`; upcoming
`bg-card text-muted-foreground border-portal-input` with connector `bg-portal-line-2`. Titles:
done `text-portal-fg font-medium`, current `text-navy-900 font-semibold`, upcoming
`text-muted-foreground font-medium` (per task 200's ink policy; `#9AA6B8` may not carry text).
Subtitles are always `text-muted-foreground`. The done dot renders a lucide `Check` at
`size-3.5 stroke-3`.

**Accessibility** (`03-portal-forms.md` § ACCESSIBILITY GAPS: the export's rows are `<div onClick>`
with no `aria-current`): rail is `<ol>`; each row is `<button type="button">` inside its `<li>`;
the current row carries `aria-current="step"`; the list is labelled by the existing
`StudentWizard.stepsLabel` key. Each button's accessible name is `"{n}. {title} — {subtitle}"`
composed from a new `StudentWizard.railStep` ICU key, so the number is announced. Visible focus ring
`focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`.

**Navigation rule** — the design says every step is directly clickable and ungated (§2.2). The wizard
today gates forward movement with `form.trigger(STEP_FIELDS[step], { shouldFocus: true })`
(`hooks/use-student-wizard.ts:47`) and `051` proves that gate. Reconciliation, which is what this task
ships: **backwards jumps are free**; a **forward** jump validates every step between the current one
and the target and stops on the first invalid step, focusing its first invalid field. Nothing that is
green today turns red, and the rail is still direct navigation everywhere it can honestly be.

Motion (D-DESIGN-3; the export declares none): dot and connector take
`transition-colors duration-200 ease-out-expo motion-reduce:transition-none`; the check on a
newly-completed step enters with `animate-in zoom-in-50 duration-200 motion-reduce:animate-none`.

## Files
- `src/modules/student-wizard/components/WizardStepRail.tsx` (new)
- `src/modules/student-wizard/components/WizardStepper.tsx` (deleted — replaced, not left dead)
- `src/modules/student-wizard/hooks/use-student-wizard.ts` — `goToStep` becomes async and runs the
  forward-validation walk described above (it is already the review screen's "Edit" jump target)
- `src/modules/student-wizard/components/WizardScreen.tsx`, `components/StepReview.tsx` — call sites
- `src/modules/student-wizard/index.ts` — barrel swap
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `steps.<key>.railSub` ×5, `railStep`

## Depends on
200 — the rail lives in the frame's 230px column and uses `border-hairline` / `rail-line`.

## Steps
1. Catalog: add `steps.{personal,education,guardian,media,review}.railSub` and `railStep`
   (`"{n}. {title} — {sub}"`) to all six locales.
2. Extend `use-student-wizard`'s `goToStep` with the forward-validation walk; keep `next`/`back`.
3. Build `WizardStepRail`; delete `WizardStepper` and its barrel export.
4. Mount in the frame's first grid column.
5. e2e + axe.

## Project rules
`.claude/rules/tailwind.md` · `.claude/rules/module-pattern.md` (component ≤120 lines; the state
matrix belongs in `lib/` or a `constants/` map, not inline in JSX) · `.claude/rules/i18n.md` ·
`.claude/rules/quality.md` (never `<div onClick>`; visible focus; keyboard reachable).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: five `<button>`s inside one `<ol>`; on load exactly one has `aria-current="step"`;
  its dot's computed `background-color` equals the `--color-navy-900` value and the step-2 connector's
  equals `--color-portal-line-2`; the step-1 dot is 30×30 with `border-width: 1.5px`.
- Clicking `Review` from an empty step 1 does NOT advance (the given-name error appears and focus
  lands on the given-name input); after filling steps 1-4 validly, clicking `Personal` from step 5
  goes straight back, and clicking `Review` again advances.
- Each rail button's accessible name contains its number, title and subtitle.
- Tab reaches every rail button; `focus-visible` paints a visible ring (computed `outline`/
  `box-shadow` differs from the unfocused state).
- Reduced motion: the dot's computed `transition-property` is `none`.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The rail is desktop-only in this task; its 375px form is task 223. `WizardStepper` has no consumer
outside `student-wizard` (grep-verified before deleting).

## Evidence
