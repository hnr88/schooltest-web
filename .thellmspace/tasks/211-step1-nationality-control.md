---
id: 211
title: Re-skin the Nationality control to the portal select box and keep the full country list
layer: ui
kind: build
slice: Wizard field 1.6 — nationality
target: src/modules/student-wizard/components/NationalityCombobox.tsx, src/modules/student-wizard/components/StepPersonal.tsx
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:41, .qa/design/spec/03-portal-forms.md#24-step-1--personal-details
status: TODO
depends_on: [204, 205]
---

## Objective
Give nationality the portal box and settle the second design conflict on step 1: the export shows a
9-item `<select>`; the app ships a searchable, locale-translated country list.

## Contract
n/a for transport. Field contract:

```ts
nationality: z.string().trim().min(1, t('nationalityRequired')).max(100, t('nationalityTooLong'))
```

Required. `buildStudentPayload` sends `values.nationality.trim()`. Options come from
`constants/countries.constants.ts` (`COUNTRY_CODES` → `getCountryNames(locale)`), so the stored string
is the country name in the user's locale.

## Design source
`03-portal-forms.md` §2.4 row 1.6 (`portal--add-child-multi-step.html:41`):

| # | Label | Req | Control | Options | Default |
|---|---|---|---|---|---|
| 1.6 | `Nationality` | **Yes** (`*` `#2563EB`) | `PortalSelect` | `Australian`, `Vietnamese`, `Chinese`, `Indian`, `Korean`, `Filipino`, `Japanese`, `Indonesian`, `Other…` | first option, no `selected` attribute |

§2.4 note: "The `Nationality` list is a fixed 9-item list in the design, not a full ISO country list."
§ UNKNOWNS 3: "Whether `Other…` opens a free-text field, and whether the real list is the full ISO-3166
set, is not shown."

**Decision**: keep the existing combobox over the full `COUNTRY_CODES` list. The design's 9 items are
a mock, the design itself flags the list as unknown, and narrowing a shipped, translated,
search-filtered list to nine hard-coded nationalities would delete working behaviour (D-SCOPE-3:
functional wiring is preserved and re-dressed, never dropped). `student-wizard-contrast.spec.ts`
opens this control as a `combobox`, arrow-selects, reopens and measures the SELECTED option's
contrast — all of which must keep working.

What IS adopted: the label `Nationality` with the blue required `*`, the portal box (48px,
`1.5px #D8DFEA`, radius 12, `px-3`, 14px `#0E2350`), the portal placeholder ink, and the field's
position in row `[1.6 | 1.7]`.

Implementation: replace `WIZARD_CONTROL` on `ComboboxInput` with the portal input class from task 204,
keep `showTrigger={false}` and the decorative `ChevronDown` (`size-3.5 text-muted-foreground`,
aria-hidden) — the vendored trigger/clear buttons have no accessible name and are an axe
`button-name` critical failure, as the component's own comment records. `ComboboxItem` keeps
`min-h-11.5` and takes the portal ink, matching task 205's popup rules.

Motion: 150ms border/colour transition on the input; popup `animate-in fade-in zoom-in-95
duration-150 ease-out-expo motion-reduce:animate-none`.

## Files
- `src/modules/student-wizard/components/NationalityCombobox.tsx` — classes only
- `src/modules/student-wizard/components/StepPersonal.tsx` — row `[1.6 | 1.7]` placement

## Depends on
204 — the portal input box the combobox input wears. 205 — the popup ink and 46px row rules.

## Steps
1. Swap the control classes; keep every ARIA prop and the `onBlur` wiring.
2. Apply the popup ink; keep `min-h-11.5`.
3. Run `student-wizard-contrast` (the contrast + persistence spec) and `051`/`052` (both arrow-select
   this control on the way to later steps).

## Project rules
`CLAUDE.md` §0 law 11 (wrap the vendored combobox, never edit it) · `.claude/rules/quality.md`
(accessible name on every control; 4.5:1; 44px rows) · `.claude/rules/tailwind.md` ·
`.claude/rules/i18n.md` (country names are locale data, not hardcoded English).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the control computes `height: 48px`, `border-width: 1.5px`, `border-radius: 12px`,
  `font-size: 14px`; the label's `*` computes `--color-blue-600`.
- `getByRole('combobox', { name: 'Nationality' })` opens; ArrowDown + Enter selects; reopening shows
  the selected row; both the highlighted and selected rows measure ≥4.5:1 by the canvas ratio —
  `student-wizard-contrast.spec.ts` passes unchanged.
- Typing filters the list; the empty state renders `nationalityEmpty`.
- Continue with an empty nationality shows `nationalityRequired` and does not advance.
- The list still contains more than nine entries and renders in the active locale (assert one
  non-English name under `/zh`).
- axe zero serious/critical with the popup open; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The design's 9-item list and its `Other…` escape are not adopted; recorded as a deviation with the
design's own UNKNOWNS 3 as the reason. No free-text "Other" branch is invented.

## Evidence
