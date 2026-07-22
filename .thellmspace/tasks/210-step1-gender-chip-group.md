---
id: 210
title: Ship step 1's Gender chip group as a full-width portal wide-chip radiogroup
layer: ui
kind: build
slice: Wizard field 1.5 — gender
target: src/modules/student-wizard/components/StepPersonal.tsx, src/modules/student-wizard/components/WizardChoiceField.tsx
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:39, .qa/design/spec/03-portal-forms.md#24-step-1--personal-details
status: TODO
depends_on: [206]
---

## Objective
Move gender onto the portal Wide chip while keeping the radiogroup contract `053-wizard-controls`
pins in four separate assertions.

## Contract
n/a for transport. Field contract:

```ts
gender: z.enum(GENDER_VALUES).optional()
GENDER_VALUES = ['male', 'female', 'other', 'prefer_not_to_say']   // constants/student-wizard.constants.ts
```

`buildStudentPayload` includes `gender` only when set. Wire values stay the raw enum — the labels are
i18n, the values are not.

## Design source
`03-portal-forms.md` §2.4 row 1.5 (`portal--add-child-multi-step.html:39`):

| # | Label | Req | Control | Options | Default |
|---|---|---|---|---|---|
| 1.5 | `Gender` | No | Chip group, **Wide**, single-select | `Male` · `Female` · `Other` · `Prefer not to say` | design preselects `Male` |

Wide chip = `height:44px; padding:0 18px; border-radius:12px; font-size:13.5px; font-weight:500`;
row `display:flex; gap:8px; flex-wrap:wrap`. Selected `#0E2350` fill / `#FFFFFF` text /
`1.5px #0E2350`; unselected `#FFFFFF` / `#3D4A5C` / `1.5px #D8DFEA`. The field is its own full-width
row (grouping `[1.5 full-width]`). Single-select semantics: "`pickKey('gender', g)` replaces the
value, does not toggle" (§2.4 note).

**Default**: the design preselects `Male`. This app does NOT (`WIZARD_DEFAULT_VALUES.gender` is
`undefined`) and `053` asserts exactly that: "Nothing selected yet, so the FIRST option carries the
group's single tab stop" and `expect(male).toHaveAttribute('aria-checked','false')`. Preselecting a
gender is also a product choice nobody made. Keep `undefined`; record the deviation.

Render via `WizardChoiceField` → `ChoicePillGroup variant="portal-chip" size="wide"` (task 206). The
group keeps `aria-labelledby` pointing at the field's `<span id="wizard-gender-label">` — a `<label>`
aimed at a radiogroup is not a real label, and `053` reads that attribute and asserts the referenced
node's text.

Motion: the chip's own 150ms colour transition (task 206); nothing extra.

## Files
- `src/modules/student-wizard/components/StepPersonal.tsx` — pass `size="wide"`
- `src/modules/student-wizard/components/WizardChoiceField.tsx` — forward `size` (if task 206 left it)

## Depends on
206 — the portal chip variant and its roving radiogroup.

## Steps
1. Pass the wide size at this call site; keep the `Controller` wiring and `field.value ?? ''`.
2. Re-run `053` first — it is the tightest guard on this control — then the rest.

## Project rules
`.claude/rules/quality.md` (44px targets; radiogroup semantics; keyboard) ·
`.claude/rules/tailwind.md` · `.claude/rules/module-pattern.md` (enum tuple stays in `constants/`) ·
`.claude/rules/i18n.md` (four labels already exist in all six catalogs — verify parity, add nothing).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `getByRole('radiogroup', { name: 'Gender' })` holds exactly 4 radios; each computes
  `height: 44px`, `padding-left: 18px`, `border-radius: 12px`, `font-size: 13.5px`; the selected one
  computes the navy fill with white text.
- `053`'s full keyboard block passes unchanged: one `[tabindex="0"]`, ArrowRight selects Female and
  focuses it, End selects the last, Home the first, ArrowLeft wraps, and every option measures
  ≥44×44 by pointer walk at 1440 AND 375.
- Nothing is preselected on a fresh mount (`aria-checked="false"` on all four).
- Reduced motion: computed `transition-property: none`.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The design's preselected `Male` is not adopted — recorded as a deliberate deviation with two reasons
(an e2e assertion pins the unselected state; defaulting a person's gender is a product decision that
was never made).

## Evidence
