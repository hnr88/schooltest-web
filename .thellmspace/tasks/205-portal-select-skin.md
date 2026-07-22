---
id: 205
title: Re-skin the wizard select trigger and popup to the portal 48px box, keeping localized item labels
layer: ui
kind: build
slice: `PortalSelect` — the control behind current year level, test year level and target entry year
target: src/modules/student-wizard/constants/wizard-control.constants.ts, src/modules/student-wizard/components/WizardSelectField.tsx
contract: n/a — pure presentation; the design spec section below is the contract
design: .qa/design/screens/portal--add-child-multi-step.html:41,52,64, .qa/design/spec/03-portal-forms.md#14-shared-portal-primitives
status: TODO
depends_on: [200, 204]
---

## Objective
Give the wizard's three selects the portal box while keeping every behaviour `053-wizard-controls`
pins: `role="combobox"` triggers named by their field label, options that render the LOCALIZED label
(`Year 9`, not `9`), ≥44px option rows, and the `triggerRef` that `form.trigger(…, { shouldFocus })`
focuses.

## Contract
n/a. `03-portal-forms.md` §1.4:

```
PortalSelect — identical to PortalInput except padding:0 12px and background:#fff.
  height:48px; border:1.5px solid #D8DFEA; border-radius:12px; font-size:14px; color:#0E2350
  **No :focus style is declared on any <select>** (L41, L52, L64) — the focus border treatment is
  declared only on <input>. Native chevron; no custom chevron in the portal.
```

## Design source
`portal--add-child-multi-step.html:41` (Nationality), `:52` (Current year level), `:64` (Target entry
year).

`WIZARD_TRIGGER` becomes: `min-h-12 w-full justify-between rounded-tile border-hairline
border-portal-input bg-card px-3 text-sm font-normal text-navy-900 transition-colors duration-150
ease-out-expo focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-ring
focus-visible:outline-none data-[size=default]:h-12 motion-reduce:transition-none`.
- 48px = `h-12`, and the `data-[size=default]:h-12` restatement is mandatory: base-ui's trigger pins
  `data-[size=default]:h-8`, so a bare `h-12` loses on specificity (already documented in the file).
- 12px padding = `px-3`; radius 12px = `rounded-tile`; 14px = `text-sm`; 1.5px = `border-hairline`.
- Font weight drops from the current `font-medium` to `font-normal` — the design's select text is the
  same 14px `#0E2350` as an input, not a bolder trigger.

**Focus**: the export declares none for `<select>` (§1.4 and § ACCESSIBILITY GAPS). PLAN.md finding 2
and `.claude/rules/quality.md` require a visible focus indicator, so the input's blue border + `--ring`
treatment is applied here too. Documented as an authored addition, not a design port.

**Chevron**: the design relies on the native `<select>` chevron. This control is base-ui, not a native
select, so it keeps its existing decorative chevron (`size-3.5 text-muted-foreground`,
`pointer-events-none`, `aria-hidden`) — the alternative (an icon-only button) is an axe `button-name`
failure, as `NationalityCombobox` already documents.

Popup: `SelectContent` keeps the DS wrapper; each `SelectItem` keeps `min-h-11.5` (46px, the
2px-over-44 idiom `053`'s pointer walk needs) and gains the portal ink `text-sm text-navy-900`, with
selected/highlighted rows on `bg-muted` — `student-wizard-contrast.spec.ts` measures a real ≥4.5:1
ratio on both the highlighted and the selected option, so any new pairing must be checked with that
spec's own canvas method, not by eye.

Motion: popup enter is the DS `animate-in fade-in zoom-in-95 duration-150 ease-out-expo` with
`motion-reduce:animate-none`; trigger colour transition 150ms.

## Files
- `src/modules/student-wizard/constants/wizard-control.constants.ts` — `WIZARD_TRIGGER`
- `src/modules/student-wizard/components/WizardSelectField.tsx` — classes only; the `items={options}`
  wiring, the `triggerRef`, and the deliberate NOT-wiring of RHF `onBlur` (documented in the file's
  header comment) all stay exactly as they are

## Depends on
200 — `border-hairline`, `--color-portal-input`.
204 — the input box this control is defined as "identical to, except padding".

## Steps
1. Rewrite `WIZARD_TRIGGER`.
2. Apply the portal ink to `SelectItem`; keep `min-h-11.5`.
3. Run `053` and `student-wizard-contrast` first — they are the two specs that can catch a regression
   here — then the rest.

## Project rules
`.claude/rules/tailwind.md` · `CLAUDE.md` §0 law 11 (wrap, never edit `src/components/ui/*`) ·
`.claude/rules/quality.md` (visible focus, 44px targets, accessible names) ·
`.claude/rules/module-pattern.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the Target entry year trigger computes `height: 48px`, `border-width: 1.5px`,
  `border-radius: 12px`, `padding-left: 12px`, `font-size: 14px`; focusing it paints a visible ring.
- `page.getByRole('combobox', { name: 'Test year level (7–12)' })` still resolves, still opens, and
  after choosing shows `Year 9` — the exact `053` assertion.
- Every option row measures ≥44×44 by `053`'s pointer walk; highlighted and selected options both
  measure ≥4.5:1 by `student-wizard-contrast`'s canvas ratio.
- Reduced motion: computed `transition-property: none` on the trigger and `animation-name: none` on
  the popup.
- axe zero serious/critical on the open popup; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
No user-facing strings change, so no catalog work. The design's native chevron is not portable to a
base-ui popup; the decorative chevron already in the codebase stands in, recorded here as a deviation
with its a11y reason.

## Evidence
