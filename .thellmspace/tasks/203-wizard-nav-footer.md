---
id: 203
title: Build the wizard nav footer — Back, the Step n of 5 counter, and Continue / Confirm & add child
layer: ui
kind: build
slice: Wizard navigation footer, pinned to the bottom of the step card
target: src/modules/student-wizard/components/WizardNav.tsx, tests/e2e/051-step-guardian.spec.ts, src/i18n/messages/*.json
contract: n/a — pure presentation + existing navigation behaviour; the design spec section below is the contract
design: .qa/design/screens/portal--add-child-multi-step.html:138-144, .qa/design/spec/03-portal-forms.md#29-wizard-navigation-footer
status: TODO
depends_on: [202]
---

## Objective
Re-skin `WizardNav` to the portal footer: a text Back button on the left, and a step counter plus the
navy pill primary on the right — preserving the existing per-step validation gate and the edit-mode
`Save changes` label.

## Contract
n/a. `03-portal-forms.md` §2.9, verbatim:

```
footer : display:flex; align-items:center; justify-content:space-between;
         margin-top:auto; padding-top:30px                                (L138)
right group : display:flex; align-items:center; gap:16px
```

| Control | Spec | Behaviour |
|---|---|---|
| **Back** `← Back` | `background:transparent; border:none; font-size:14px; font-weight:600; padding:12px 10px;` colour `#3D4A5C` when `step > 1`, `#9AA6B8` when `step === 1` | `step > 1` → previous step; `step === 1` → leaves the wizard to the children list. **Never disabled** — the grey at step 1 is cosmetic only |
| **Step counter** | `font-size:12.5px; color:#9AA6B8` — literal `Step {n} of 5` | reads the current step |
| **Next** | navy pill: `background:#0E2350; color:#fff; 14px/600; padding:13px 26px; border-radius:999px;` hover `background:#16326E` | label `Continue` for steps 1-4, **`Confirm & add child`** on step 5 |

## Design source
Footer `mt-auto flex items-center justify-between pt-7.5` (30px). Back:
`px-2.5 py-3 text-sm font-semibold transition-colors duration-150 ease-out-expo
motion-reduce:transition-none`, colour `text-portal-fg` when `step > 0` and `text-muted-foreground` at
step 1 (design `#9AA6B8` may not carry text — task 200 ink policy), with an aria-hidden `ArrowLeft`
14px icon so the accessible name stays exactly `StudentWizard.back`. Right group `flex items-center
gap-4`. Counter `text-meta text-muted-foreground` (12.5px). Primary: `rounded-full bg-navy-900 px-6.5
py-3.25 text-sm font-semibold text-primary-foreground transition-colors duration-150 ease-out-expo
hover:bg-navy-800 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none`
(26px = `px-6.5`, 13px = `py-3.25`). Both controls clear 44px: the primary is 46px tall as drawn; Back
gets the `after:` pointer expansion idiom already used by `button-variants.ts`.

**Behaviour that is preserved verbatim** — `WizardNav` keeps its props
(`isFirstStep/isLastStep/mode/pending/onBack/onContinue`); `WizardScreen`'s `handleContinue` still
runs `next()` → `form.trigger(STEP_FIELDS[step], { shouldFocus: true })` on steps 1-4 and
`form.handleSubmit(submit)` on step 5. The design's ungated `stepNext` (§2.9: "No client-side
validation gate is present in the design") is NOT adopted — `051` proves the gate and
`03-portal-forms.md` § UNKNOWNS 1 records the design simply has no answer here.

**Back at step 1**: the design leaves the wizard. Today the button is `disabled`
(`WizardNav.tsx:44`). Adopt the design: never disabled, and at step 1 it navigates to
`/dashboard/children` via the next-intl router.

**Label values**: `StudentWizard.createStudent` becomes `Confirm & add child` (create mode) in all six
catalogs; edit mode keeps `StudentWizard.saveChanges`. Both are read from the catalog by
`student-wizard-contrast.spec.ts` and `dashboard-students.spec.ts`, so the value change is safe.

**Counter uniqueness — mandatory**: `051-step-guardian.spec.ts:118` asserts
`page.getByText('Step 4 of 5', { exact: false })`. Once this footer ships, the card sub-heading
(`Step 4 of 5 · Optional photo…`) AND the counter both contain that substring, and Playwright strict
mode fails on two matches. Retarget that one assertion to the counter's own node —
`page.locator('[data-slot="wizard-step-counter"]')` with text `Step 4 of 5` — which proves the same
thing (the wizard reached step 4) more precisely. Add `data-slot="wizard-step-counter"` +
`aria-live="polite"` to the counter. This is an intent-preserving retarget, not a weakening: the
assertion count does not drop and the spec must still pass unmodified in every other respect.

Motion: colour transitions only (150ms, `ease-out-expo`), with `motion-reduce:transition-none`;
the pending state on step 5 is task 221's.

## Files
- `src/modules/student-wizard/components/WizardNav.tsx`
- `src/modules/student-wizard/components/WizardScreen.tsx` — pass `step`, wire the step-1 exit
- `tests/e2e/051-step-guardian.spec.ts` — the single retargeted locator
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `stepCounter` (`Step {current} of {total}`),
  `createStudent` value

## Depends on
202 — the footer is `margin-top:auto` inside the step card, so the card must exist first.

## Steps
1. Add `stepCounter` and update `createStudent` in all six catalogs.
2. Rebuild `WizardNav` with the three regions and the `data-slot` counter.
3. Wire step-1 Back to `/dashboard/children`.
4. Retarget the one `051` locator; run 051/052/053 + contrast + dashboard-students.
5. axe + 375 check.

## Project rules
`.claude/rules/tailwind.md` · `.claude/rules/i18n.md` · `.claude/rules/quality.md` (44px targets,
visible focus, keyboard reachable) · `.claude/rules/testing.md` (a real Playwright run is the proof) ·
`.claude/rules/module-pattern.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: on step 1 the primary's accessible name is `Continue`, its computed `border-radius` is
  `>= 999px`-equivalent (`50%`-pill), `background-color` equals `--color-navy-900`, and hovering
  resolves `--color-navy-800`; on step 5 the name is `Confirm & add child`.
- Back is never `disabled`; clicking it on step 1 lands on `/dashboard/children`; on step 3 it returns
  to step 2.
- The counter reads `Step 3 of 5` on step 3 and carries `aria-live="polite"`.
- Both footer controls measure ≥44×44 by real pointer walk (`053`'s `pointerBox` helper) at 1280 and
  375.
- Reduced motion: computed `transition-property: none` on both.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` all green — 051 with only the
  documented counter retarget.

## Assumptions
The design's step-1 Back exit is intentional (§2.9 states it explicitly); the current `disabled`
attribute is a legacy behaviour with no spec assertion on it (grep-verified before changing).

## Evidence
