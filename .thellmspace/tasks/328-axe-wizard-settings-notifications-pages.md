---
id: 328
title: axe — zero serious/critical on the add-child wizard, edit form, all four settings tabs and the notification feed
layer: a11y
kind: verify
slice: Automated accessibility gate for the form-heavy authenticated pages W7 and W9 deliver
target: tests/e2e/axe-wizard-settings-notifications.spec.ts (new); markup fixes in src/modules/{student-wizard,settings,notifications,children,design-system}/**
contract: n/a
design: .qa/design/spec/03-portal-forms.md, .qa/design/spec/04-ds-foundations.md#5-form-controls
status: TODO
depends_on: ["323", "325"]
---

## Objective

Run `@axe-core/playwright` over the five wizard steps, the edit form, all four settings tabs and
the notification feed at 375px and 1280px and require **zero serious and zero critical
violations**. These are the mission's densest form surfaces — every input, radiogroup, switch,
combobox and file field must be programmatically labelled and operable.

## Contract

n/a. Binding rules instead — `.claude/rules/quality.md`: labelled inputs; keyboard reachable;
visible focus rings; modals trap focus and close on Escape; never `<div onClick>`; ordered
headings; alt on every image.

`.qa/design/spec/04-ds-foundations.md` UNKNOWNS 1-6 record that the export declares **no** focus,
active, hover, disabled, loading or error state for most form controls, and **no** error state at
all for select, textarea, checkbox, radio or switch. Those states are therefore authored, not
ported — from the design's own `--ring`, `--color-destructive` and `--color-disabled` tokens.

## Design source

- Text input (`04-ds-foundations.md:339`): `padding:10px 13px; border-radius:10px;
  border:1px solid #CBD5E1` → `--color-input`; focus `border-color:#2563EB` →
  `--color-primary` + `box-shadow: 0 0 0 3px rgba(37,99,235,.16)`; error
  `border:1px solid #DC2626` → `--color-destructive` + `box-shadow: 0 0 0 3px rgba(220,38,38,.10)`
  (persistent, not focus-only).
- Select (`:357`): `appearance:none; padding:10px 36px 10px 13px; border-radius:10px;
  border:1px solid #CBD5E1; outline:none` — **the design declares no focus style on the select**.
  The authored ring `outline: 2px solid var(--color-ring); outline-offset: 2px` is added.
- Checkbox (`:368`): `18×18; border-radius:5px; border:1.5px solid; transition: all .15s`.
- Radio (`:384`): ring `18×18; border-radius:50%; border:1.5px solid`; dot `8×8` always
  rendered; `transition: all .15s`.
- Switch (`:398`): track `40×22; border-radius:999px; transition: background .18s`;
  knob `18×18; transform: translateX(18px)` when on; `transition: transform .18s`.
- Wizard step rail (`03-portal-forms.md#2.2`): every step row is `cursor:pointer` and directly
  clickable — so each must be a real `<button>` (or a `role="tab"` in a `role="tablist"`),
  never a `<div onClick>`, and must expose `aria-current` / `aria-selected` for the current step.
- Alert dismiss (`04-ds-foundations.md:472`): `26×26; aria-label="Dismiss"` — the label is
  already in the design; it becomes an i18n key.

## Files

- `tests/e2e/axe-wizard-settings-notifications.spec.ts` (new)
- Markup fixes at the call site: `src/modules/student-wizard/components/**`,
  `src/modules/settings/components/**`, `src/modules/notifications/components/**`,
  `src/modules/children/components/EditStudentScreen.tsx`,
  `src/modules/design-system/components/**`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` for any new label string
- Never `src/components/ui/**`

## Depends on

- **323** and **325** — those sweeps deliver the final markup for these pages.
- Wave gate (prose): **W7 (200-225)** and **W9 (260-283)** DONE.

## Steps

1. Write the spec with `AxeBuilder` from `@axe-core/playwright`. No `disableRules`, no
   `exclude()` of app markup, no result filter beyond the serious/critical impact threshold.
2. Log in with `loginAsParent`. At **1280×800** and **375×812**, `analyze()` and assert zero
   serious/critical on each of:
   - `/dashboard/children/new` — **one scan per step (1-5)**; the step-4 scan is taken twice,
     once empty and once with a real uploaded preview rendered (different markup)
   - `/dashboard/children/new` step 1 with a **validation error showing** (invalid `given_name`)
     — error text must be programmatically associated (`aria-describedby` / `aria-invalid`)
   - `/dashboard/children/[documentId]/edit` prefilled
   - `/dashboard/settings?tab=account`, `?tab=search`, `?tab=notifications`, `?tab=children`
   - `/dashboard/settings?tab=notifications` with a **locked** category visible (the
     `account`/`security` non-suppressible groups)
   - `/dashboard/notifications` with ≥1 unread row, and again after "mark all read"
     (empty/all-read state is different markup)
   - `/dashboard/notifications` empty state, if reachable without destroying fixtures
3. Also scan the `zh` variants of the wizard step 1 and `/dashboard/settings?tab=notifications`.
4. Beyond axe, assert programmatically:
   - every `input`, `select`, `textarea`, `[role=switch]`, `[role=radio]`, `[role=checkbox]` on
     each surface is reachable by `getByLabel(...)` with a catalog string — an accessible name
     that is a hardcoded literal is a failure;
   - each radiogroup is **one** tab stop with arrow-key roving (the existing guarantee from
     `tests/e2e/053-wizard-controls.spec.ts` — keep it green);
   - each switch exposes `role="switch"` + `aria-checked` and toggles on `Space`;
   - the file input is reachable by keyboard and has a visible, labelled trigger;
   - every error message is bound via `aria-describedby` and the field carries `aria-invalid`.
5. Fix every violation in the markup at the module call site — real labels from the catalog,
   real `<button>`s, real `aria-*` wiring, real contrast. Never a rule disable, never
   `aria-hidden` on interactive content.
6. Re-run until clean twice in a row.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 12, 15.
- `.claude/rules/quality.md` — labelled inputs, focus, focus trap, Escape, no `<div onClick>`.
- `.claude/rules/state-data.md` — shadcn `Form*` components carry the label/description/message
  wiring; use them rather than hand-rolling `aria-describedby`.
- `.claude/rules/i18n.md` — every accessible name is a catalog key in all six locales.
- `.claude/rules/module-pattern.md`, `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/axe-wizard-settings-notifications.spec.ts` passes with
  **zero** serious and **zero** critical violations on every scan in step 2 and step 3 — that is
  ≥ 34 scans (17 surfaces × 2 widths) plus the zh pair.
- The spec contains no `disableRules`, no app-markup `exclude()`, no allow-list — verified by
  grepping the spec.
- Every form control on every scanned surface is resolvable by `getByLabel` with a **catalog**
  string; every error is `aria-describedby`-bound with `aria-invalid` on the field.
- Radiogroups are one tab stop with arrow-key roving; switches are `role="switch"` with
  `aria-checked` and toggle on `Space`.
- `tests/e2e/053-wizard-controls.spec.ts`, `051-step-guardian.spec.ts`, `052-step-media.spec.ts`,
  `student-wizard-contrast.spec.ts` and `settings-tabs.spec.ts` all still pass in the same run.
- Any string added exists in all six catalogs, key-identical.
- Zero banned-pattern grep hits; no file under `src/components/ui/` in the diff.

## Assumptions

- A real small PNG fixture is available for the step-4 "with preview" scan (task 323 introduces
  it); no new binary is added if one already exists.
- The notification empty state may not be reachable without destroying the seeded parent's feed
  — if so, that single scan is recorded as not-run with the reason rather than faked.

## Evidence

<!-- filled in as the task runs -->
