---
id: 291
title: Rebuild the auth text/password field to the DS field states, incl. the error affordance
layer: ui
kind: implement
slice: The labelled auth field (default / focus / error / disabled) plus its inline error message, shared by all four auth forms
target: src/modules/auth/components/TextField.tsx, src/modules/auth/components/PasswordField.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/ds--forms.html:6-20 · .qa/design/screens/app--login.html:26-33 · .qa/design/spec/06-auth-states-landing.md#15-form-field--canonical-states--error-affordance
status: TODO
depends_on: []
---

## Objective

Give the auth screens one correct field: label, input, focus ring, error border + inline error
message, and disabled — built once in `TextField` / `PasswordField` and consumed unchanged by
sign-in, sign-up, forgot-password and reset-password. This is the only place the auth error
affordance is defined.

## Contract

n/a — presentation. Binding design text, `.qa/design/spec/06-auth-states-landing.md` §1.5:

| State | Spec | Source |
|---|---|---|
| Default | `padding:10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF; outline:none; transition:border-color .15s, box-shadow .15s` | `ds--forms.html:8` |
| Focus | `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` | `ds--forms.html:8` |
| Error | `border:1px solid #DC2626; box-shadow:0 0 0 3px rgba(220,38,38,.10)` | `ds--forms.html:13` |
| Error label | `13.5px/600/#0E2350` + required marker `<span style="color:#DC2626">*</span>` | `ds--forms.html:12` |
| Error message | `inline-flex; gap:6px; font-size:12.5px; font-weight:500; color:#DC2626`, leading 13×13 alert-circle, `stroke-width 2.2` | `ds--forms.html:14` |
| Disabled | `border:1px solid #E3E8F0; color:#94A3B8; background:#F1F5F9; cursor:not-allowed`; label greys to `#94A3B8` | `ds--forms.html:17-18` |
| Help text | `12.5px; color:#94A3B8` | `ds--forms.html:9` |

§1.5 also records: "**This compact card is the only place in the auth set that declares an input
`:focus` ring.** Adopt `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` … for the
full-page auth inputs too — the full-page inputs only declare `outline:none`." The design's bare
`outline:none` is NOT shipped: `.qa/PLAN.md` finding 2 and `.claude/rules/quality.md` require a
visible focus indicator.

## Design source

Auth-screen field metrics (`app--login.html:26-33`, `app--register.html:21-31`): wrapper
`flex column; gap:6px`; label `13.5px / 600 / #16326E`; input `1px #CBD5E1`, radius `10px`,
padding `11px 14px`, `14.5px`, colour `#0E2350`, background `#FFFFFF`.

Token map (`.qa/design/spec/04-ds-foundations.md#tailwind-v4-mapping`):
`#CBD5E1` → `--color-input` · `#2563EB` → `--color-primary` / `--color-brand-600` ·
`rgba(37,99,235,.35)` → `--color-ring` (the design's ring is the same hue at `.16` alpha — use
`ring-3 ring-ring/45` sized from the token, never a raw rgba) · `#DC2626` → `--color-destructive` ·
`#E3E8F0` → `--color-border` · `#F1F5F9` → `--color-muted` · `#94A3B8` →
`--color-muted-foreground-soft` · `#16326E` → `--color-secondary-foreground` · `#0E2350` →
`--color-foreground`. Radius `10px` → `rounded-lg` (the `--radius` token is `0.625rem` = 10px).

Height: the input must stay **≥44px** — `h-11` today, and `tests/e2e/a11y-auth.spec.ts` measures it
at both viewports. The design's `11px 14px` padding on a 14.5px line lands under 44px, so keep
`h-11` and express the padding as `px-3.5`.

## Files

- `src/modules/auth/components/TextField.tsx`
- `src/modules/auth/components/PasswordField.tsx`
- `src/modules/auth/components/AuthFieldError.tsx` (new — the inline error row: alert-circle icon +
  message, `role` left to the caller's `aria-describedby` wiring)

Keep all three internal to the module (they are deliberately not barrelled today —
`.qa/intake/web-inventory.md` §2 `auth`). Do not add them to `src/modules/auth/index.ts`.

## Depends on

None inside W10. Wave-level: W1's input primitive and focus-ring token.

## Steps

1. Read both existing files and `src/modules/auth/components/SignInForm.tsx` (which inlines its own
   field markup today) so the props surface matches what the four forms already pass.
2. Field wrapper `flex flex-col gap-1.5` (6px); label `text-sm font-semibold
   text-secondary-foreground`.
3. Input: `h-11 rounded-lg border border-input bg-card px-3.5 text-foreground
   transition-[border-color,box-shadow] duration-150 ease-out
   focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/45
   focus-visible:outline-none` — never `outline-none` without a replacement ring.
4. Error: driven by `aria-invalid` — `aria-invalid:border-destructive
   aria-invalid:ring-3 aria-invalid:ring-destructive/25`; render `AuthFieldError` beneath, wired
   through the existing `aria-describedby={...-error}` ids so screen readers keep the association.
5. Disabled: `disabled:border-border disabled:bg-muted disabled:text-muted-foreground-soft
   disabled:cursor-not-allowed`, label `peer-disabled:` greyed.
6. `PasswordField` keeps its visibility toggle **as the DOM node immediately after the input** —
   `tests/e2e/a11y-auth.spec.ts` asserts focus order `… → password → toggle → submit`. The toggle
   stays `size-11`, keeps `aria-pressed` and the `Auth.showPassword` / `Auth.hidePassword` labels.
7. Motion: only `transition-[border-color,box-shadow] duration-150` (design §6.2 declares `.15s` on
   exactly these two properties) plus
   `motion-reduce:transition-none`. Error message enters with
   `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none`.
8. 375px: fields are full width, label wraps, the password toggle stays inside the input box and
   ≥44×44px.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 11, 14, 15.
- `.claude/rules/tailwind.md` — no raw hex/rgba, no arbitrary values, OKLCH tokens only.
- `.claude/rules/module-pattern.md` — components stay dumb; no validation logic here, the Zod
  schemas in `src/modules/auth/schemas/` remain the only validators.
- `.claude/rules/quality.md` — labelled inputs, visible focus ring, ≥44px targets.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/a11y-auth.spec.ts` green — both focus-order tests and both
  ≥44px sweeps at 375 and 1280 still pass, unchanged.
- `pnpm exec playwright test tests/e2e/sign-in.spec.ts tests/e2e/sign-up.spec.ts` green: the
  empty-submit validation still renders the translated field errors and still fires **no** API call.
- New Playwright assertion: focus an auth email input and assert the computed `box-shadow` is
  non-`none` and `border-color` equals the primary token value; submit empty and assert the invalid
  input's computed `border-color` equals the destructive token value and that
  `aria-describedby` resolves to the visible message element.
- axe zero serious/critical on `/sign-in` and `/sign-up` at 375 and 1280.
- `prefers-reduced-motion: reduce` → no transition on focus, no entrance animation on the error.
- No i18n key added (the error strings are existing `Auth.*` keys); six catalogs stay key-identical.
- Zero banned-pattern grep hits in the diff.

## Assumptions

The design's `10px 13px` / `11px 14px` input padding is superseded by the ≥44px target rule that
the existing e2e already enforces; height wins, horizontal padding follows the design.

## Evidence

_(filled in as the task runs)_
