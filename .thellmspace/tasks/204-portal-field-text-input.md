---
id: 204
title: Re-skin the wizard text field to the portal label + 48px input + help text stack
layer: ui
kind: build
slice: `PortalInput` / `PortalLabel` / `PortalHelpText` as used by every wizard text field
target: src/modules/student-wizard/constants/wizard-control.constants.ts, src/modules/student-wizard/components/WizardTextField.tsx, src/modules/student-wizard/components/PortalFieldShell.tsx
contract: n/a — pure presentation; the design spec section below is the contract
design: .qa/design/screens/portal--add-child-multi-step.html:32-33, .qa/design/spec/03-portal-forms.md#14-shared-portal-primitives
status: TODO
depends_on: [200]
---

## Objective
Turn the wizard's field stack from the app-screen dialect (`h-11 rounded-lg border-input px-3.5
text-lede`, `WIZARD_CONTROL` in `constants/wizard-control.constants.ts`) into the portal dialect that
every step 1-3 field uses, without touching a single `register()` call or validation rule.

## Contract
n/a. `03-portal-forms.md` §1.4, verbatim:

```
PortalInput
  width:100%; box-sizing:border-box; height:48px;
  border:1.5px solid #D8DFEA; border-radius:12px; padding:0 15px;
  font-size:14px; color:#0E2350; outline:none;
  :focus      -> border-color:#2563EB
  ::placeholder -> color:#9AA6B8

PortalLabel
  display:block; font-size:12.5px; font-weight:600; color:#0E2350; margin-bottom:7px;
  required marker: <span style="color:#2563EB">*</span> appended inside the label, no space

PortalHelpText
  font-size:12px; color:#9AA6B8; margin-top:6px;      (8px on the step-2 test-year field)
```

## Design source
`portal--add-child-multi-step.html:32` (given name), `:33` (family name + help text).

Input class (replaces `WIZARD_CONTROL`): `h-12 w-full rounded-tile border-hairline
border-portal-input bg-card px-3.75 text-sm text-navy-900 transition-colors duration-150
ease-out-expo placeholder:text-muted-foreground focus-visible:border-blue-600
focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
motion-reduce:transition-none md:text-sm`.
- 48px = `h-12`; radius 12px = `rounded-tile`; 15px = `px-3.75`; 14px = `text-sm`;
  1.5px = `border-hairline` (task 200).
- `md:text-sm` is NOT redundant — the vendored primitive carries `md:text-sm` at its own size and wins
  at `md` unless restated (the existing constant documents this).
- The export sets `outline:none` with a border-colour-only focus (`03-portal-forms.md` § ACCESSIBILITY
  GAPS, PLAN.md finding 2). WCAG 2.2 AA and `.claude/rules/quality.md` require a visible focus
  indicator, so the design's blue border is KEPT and the `--ring` token — which `tokens.css` defines
  and the export never uses — is added on top. Never suppress the rule.

Label: `mb-1.75 block text-meta font-semibold text-navy-900` (12.5px = `text-meta`, 7px = `mb-1.75`);
required marker `<span aria-hidden="true" className="text-blue-600">*</span>` immediately after the
text with no space, and the field's real requiredness carried by `aria-required` on the control (a
`*` alone is not an accessible affordance).
Help text: `mt-1.5 text-xs text-muted-foreground` (12px = `text-xs`; ink substituted per task 200 —
`#9AA6B8` is 2.46:1). A `helperGap="lg"` prop yields `mt-2` for the step-2 test-year field (task 213).

Reuse, do not rebuild: `FieldShell` + `describedBy` from `@/modules/design-system` already own the
label/helper/error wiring, the `labelId` radiogroup mode and the `aria-describedby` composition.
This task adds a thin `PortalFieldShell` wrapper in `student-wizard/components/` that passes the
portal classes into `FieldShell` (which accepts `className`), so the wizard gets the portal dialect
without editing a shared DS component that other modules render.

Motion: colour/border transitions only, 150ms `ease-out-expo`, `motion-reduce:transition-none`
(`04-ds-foundations.md` §I records colour transitions as the documented exception to the
transform/opacity rule).

## Files
- `src/modules/student-wizard/constants/wizard-control.constants.ts` — `WIZARD_CONTROL` rewritten to
  the portal box (the `WIZARD_TRIGGER` select variant is task 205)
- `src/modules/student-wizard/components/PortalFieldShell.tsx` (new)
- `src/modules/student-wizard/components/WizardTextField.tsx` — uses `PortalFieldShell`; props,
  `registration`, `aria-describedby` and `aria-invalid` wiring unchanged

## Depends on
200 — `border-hairline`, `--color-portal-input`, the ink policy.

## Steps
1. Rewrite `WIZARD_CONTROL`.
2. Add `PortalFieldShell` (label/help/required styling) over the DS `FieldShell`.
3. Point `WizardTextField` at it; leave every `register()` / `error` prop as-is.
4. Playwright geometry + focus proof, then axe.

## Project rules
`.claude/rules/tailwind.md` (no arbitrary values; OKLCH tokens) · `CLAUDE.md` §0 law 11 (never edit
`src/components/ui/*`; wrap instead) · `.claude/rules/module-pattern.md` (constants in
`constants/`, components ≤120 lines) · `.claude/rules/quality.md` (labelled inputs, visible focus).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/dashboard/children/new`: the Given name input computes `height: 48px`,
  `border-width: 1.5px`, `border-radius: 12px`, `padding-left: 15px`, `font-size: 14px`; its label
  computes `font-size: 12.5px; font-weight: 600` and sits 7px above the box.
- Focusing the input changes `border-color` to the `--color-blue-600` value AND paints a visible ring
  (computed `box-shadow`/`outline` differs from the blurred state).
- `page.getByLabel('Given name')` still resolves the input (the label/for pairing survives) — this is
  the exact locator `051`, `052` and `student-wizard-contrast` use.
- Placeholder ink is `--color-muted-foreground`, not `#9AA6B8`.
- 375px: the input still fills its column, no horizontal scroll.
- axe zero serious/critical; zero banned-pattern grep hits (no `h-[48px]`, no raw hex).
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
No string changes here, so no catalog work. `FieldShell` accepts `className` and a `labelId`; if it
turns out it cannot express the portal label size without an edit, the wizard-local shell renders its
own `<label>` and keeps the identical `describedBy()` contract rather than editing the DS component.

## Evidence
