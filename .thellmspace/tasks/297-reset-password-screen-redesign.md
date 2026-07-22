---
id: 297
title: Re-skin the reset-password screen, including the missing/garbage-code invalid-link state
layer: ui
kind: implement
slice: /[locale]/reset-password?code= — set-new-password card plus its invalid-link state
target: src/modules/auth/components/ResetPasswordCard.tsx, src/modules/auth/components/ResetPasswordForm.tsx
contract: n/a (presentation over the existing POST /api/auth/reset-password wiring)
design: .qa/design/screens/app--forgot-password.html:4-13 · .qa/design/screens/ds--forms.html:12-14 · .qa/design/spec/06-auth-states-landing.md#13-forgot-password-app-forgot-passwordhtml--two-cards-request--confirmation
status: TODO
depends_on: [290, 291]
---

## Objective

Dress `/reset-password` in the forgot-password card geometry (the design draws no separate reset
screen — §1.3 Card A is its nearest sibling and the spec's UNKNOWNS confirm no reset artwork
exists), and give the "no code" / "garbage code" state the same honest treatment. The reset
mutation, the auto-login on success and the error classification stay exactly as they are.

## Contract

n/a — presentation over existing wiring. Preserved verbatim:

- `useResetPasswordMutation` → `POST /api/auth/reset-password` with `{ code, password,
  passwordConfirmation }`, request validated by `resetPasswordSchema`.
- On 200 the API returns a JWT and the user is signed in and moved on — the existing behaviour that
  `tests/e2e/forgot-reset.spec.ts` proves ("reset → auto-login → old password dead").
- `classify-reset-password-error.ts` keeps mapping the failure to `Auth.invalidLinkTitle` /
  `invalidLinkBody` / `requestNewLink`.
- Keys: `Auth.resetTitle`, `resetSubtitle`, `newPasswordLabel`, `newPasswordPlaceholder`,
  `confirmPasswordLabel`, `passwordMismatch`, `resetButton`, `resettingPassword`,
  `invalidLinkTitle`, `invalidLinkBody`, `requestNewLink`, `backToSignIn`.

## Design source

Card geometry is `app--forgot-password.html:4-13` verbatim: `width:420px; background:#FFFFFF;
border:1px solid #E3E8F0; border-radius:16px; padding:36px; gap:20px; box-shadow:0 2px 8px
rgba(14,35,80,.08)` → `w-105 max-w-full bg-card border border-border rounded-panel p-9 gap-5
shadow-md`.

| Element | Value | Token / utility |
|---|---|---|
| Icon chip (valid state) | `44×44; r12; background:#EFF5FF`; lucide **lock** `21×21 stroke #2563EB sw2` | `size-11 rounded-tile bg-brand-50`, `Lock className="size-5 text-primary"` |
| Icon chip (invalid state) | same box, error tone | `size-11 rounded-tile bg-destructive-soft`, lucide `CircleAlert className="size-5 text-destructive-strong"` — from the design's error palette (`ds--forms.html:14` ink `#DC2626`, badge surface `#FEE2E2` → `--color-destructive-soft`) |
| `h1` | `24px / 700 / #0E2350` | 24px `--text-*` token, `font-bold text-foreground` |
| `p` | `14.5px / 1.55 / #64748B` | `text-sm leading-relaxed text-muted-foreground` |
| Password fields | task 291 `PasswordField` ×2, wrapper `gap:6px`, group `gap:16px` | `gap-1.5`, group `gap-4` |
| Primary button | `#2563EB`, white, `15px/600`, `padding:13px`, r10, hover `#1D4ED8` | `w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors duration-150` |
| Invalid-state CTA | secondary white / `1px #CBD5E1` / `#16326E`, `padding:12px`, r10, hover `#F7F9FC` — links to `/forgot-password` | `border border-input bg-card text-secondary-foreground hover:bg-background transition-colors duration-150` |
| Back link | centred `14px/600`, `#2563EB` | `text-center text-sm font-semibold text-primary` |

Tokens: `#EFF5FF` → `--color-brand-50` · `#2563EB` → `--color-primary` · `#1D4ED8` →
`--color-primary-hover` · `#FEE2E2` → `--color-destructive-soft` · `#B91C1C` →
`--color-destructive-strong` · `#CBD5E1` → `--color-input` · `#E3E8F0` → `--color-border`.

Password-mismatch is a **field-level** error via task 291's affordance
(`border:1px solid #DC2626; box-shadow:0 0 0 3px rgba(220,38,38,.10)`, message `12.5px/500`
`#DC2626` with a 13×13 alert-circle) — it is a field problem, not a form problem, so it must not
render as a top banner.

## Files

- `src/modules/auth/components/ResetPasswordCard.tsx`
- `src/modules/auth/components/ResetPasswordForm.tsx`

## Depends on

- **290** — the shell and rail.
- **291** — `PasswordField` and the field error affordance this screen depends on entirely.

## Steps

1. Read both files and `tests/e2e/forgot-reset.spec.ts` (it covers `/reset-password` with no code,
   with a garbage `?code=`, and the full happy path).
2. Rebuild the valid state: lock chip → heading → body → two password fields → submit → back link.
3. Rebuild the invalid state as the same card with the error chip, `invalidLinkTitle` /
   `invalidLinkBody`, the `requestNewLink` secondary CTA to `/forgot-password`, and the back link.
   Exactly one `<h1>` in either state.
4. Motion: card entrance `motion-safe:animate-in motion-safe:fade-in
   motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-out-expo
   motion-reduce:animate-none`; submit hover `transition-colors duration-150`; pending submit uses
   the `Button`'s `st-spin` spinner with `Auth.resettingPassword`.
5. 375px: card `p-6`, both fields stacked full width, controls ≥44px, no horizontal scroll.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 8, 11, 14, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values.
- `.claude/rules/state-data.md` — validation stays in `resetPasswordSchema`; the component holds no
  logic.
- `.claude/rules/quality.md` — the invalid state must be reachable and announced; visible focus.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/forgot-reset.spec.ts tests/e2e/auth-logo.spec.ts` green —
  every case: no code, garbage code, full reset, auto-login, old password dead, 31-minute expiry.
- **Persistence proof:** complete a real reset for a throwaway parent and assert with the spec's SQL
  helper that the `up_users` password hash changed and `reset_password_token` is cleared, then
  reload and sign in with the new password.
- Playwright assertion that mismatched passwords render the field-level error (invalid input's
  computed `border-color` = `--color-destructive`, message linked by `aria-describedby`) and that
  **no API call is made**.
- axe zero serious/critical on `/reset-password` (valid and invalid states) at 375 and 1280.
- Exactly one visible `[data-slot="logo"]`.
- Reduced-motion: no entrance animation.
- Six catalogs key-identical.
- Zero banned-pattern grep hits.

## Assumptions

The design ships no reset-password screen; Card A of `app--forgot-password.html` is its declared
sibling and is reused rather than a new composition being invented. Recorded in the spec's UNKNOWNS.

## Evidence

_(filled in as the task runs)_
