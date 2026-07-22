---
id: 296
title: Re-skin the forgot-password screen — request card and sent card as two states of one screen
layer: ui
kind: implement
slice: /[locale]/forgot-password — lock chip request card → mail chip sent card with success alert and cooldown
target: src/modules/auth/components/ForgotPasswordCard.tsx, ForgotPasswordForm.tsx, ForgotPasswordSentState.tsx
contract: n/a (presentation over the existing POST /api/auth/forgot-password wiring)
design: .qa/design/screens/app--forgot-password.html:1-23 · .qa/design/spec/06-auth-states-landing.md#13-forgot-password-app-forgot-passwordhtml--two-cards-request--confirmation
status: TODO
depends_on: [290, 291]
---

## Objective

Bring `/forgot-password` to the design's two cards. The design shows them **side by side**; the spec
records that "in production these are the **two sequential states of one screen**" — which is what
the app already does. This task dresses both states and changes no request, no timer and no key.

## Contract

n/a — presentation over existing wiring. Preserved verbatim:

- `useForgotPasswordMutation` → `POST /api/auth/forgot-password`, request validated by
  `forgotPasswordSchema`.
- On 200 the card swaps to `ForgotPasswordSentState` holding the submitted email; the resend reuses
  `ResendCountdownButton` and `classify-forgot-password-error.ts`.
- Keys: `Auth.forgotTitle`, `forgotSubtitle`, `emailLabel`, `sendResetLink`, `sendingResetLink`,
  `backToSignIn`, `sentTitle`, `sentBody`, `sentSuccess`, `resendEmail`, `resendEmailCountdown`,
  `tooManyRequests`.
- `tests/e2e/forgot-reset.spec.ts` drives wrong-password → forgot → sent + countdown → real styled
  email → reset → auto-login → old password dead → 31-minute expiry, and must stay green.

## Design source

`.qa/design/screens/app--forgot-password.html`. Card box, both states (`:4`, `:14`):
`width:420px; background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:36px;
flex column; gap:20px; box-shadow:0 2px 8px rgba(14,35,80,.08)` → `w-105 max-w-full bg-card border
border-border rounded-panel p-9 gap-5 shadow-md`.

Card A — request (`:4-13`):

| Element | Value | Token / utility |
|---|---|---|
| Icon chip | `44×44; radius:12px; background:#EFF5FF`; lucide **lock** `21×21, stroke #2563EB, sw 2` | `size-11 rounded-tile bg-brand-50`, `Lock className="size-5 text-primary"` |
| `h1` | `24px / 700 / #0E2350`, no letter-spacing | 24px `--text-*` token, `font-bold text-foreground` |
| `p` | `14.5px / 1.55 / #64748B` | `text-sm leading-relaxed text-muted-foreground` |
| Email field | label `13.5px/600/#16326E`; input `1px #CBD5E1`, r10, `11px 14px`, `14.5px`, `#0E2350` | task 291's `TextField` |
| Primary button | `#2563EB`, white, `15px/600`, `padding:13px`, r10, hover `#1D4ED8` | `w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors duration-150` |
| Back link | centred, `14px/600`, inherits `#2563EB` | `text-center text-sm font-semibold text-primary hover:text-brand-700 transition-colors duration-150` |

Card B — sent (`:14-23`): mail chip `44×44; r12; background:#F0FDFA`, lucide **mail** `21×21 stroke
#0D9488 sw2`; `h1` "Check your inbox"; body with the address in `<strong style="color:#0E2350">`;
the teal success alert (`#F0FDFA` surface, `1px #CCFBF1` border, r10, `12px 14px`, `13.5px`,
`#0D9488`, check `15×15 sw 2.4`) → reuse task 293's `AuthStatusBanner tone="success"`; then the
secondary resend button (white, `1px #CBD5E1`, `#16326E`, `14.5px/600`, `padding:12px`, r10, hover
`#F7F9FC`) and the same back link.

Tokens: `#EFF5FF` → `--color-brand-50` · `#2563EB` → `--color-primary` · `#F0FDFA` →
`--color-accent-50` · `#CCFBF1` → `--color-accent-100` · `#0D9488` → `--color-accent-600` ·
`#CBD5E1` → `--color-input` · `#16326E` → `--color-secondary-foreground` · `#E3E8F0` →
`--color-border` · `--radius-panel` 16px, `--radius-tile` 12px, `rounded-lg` 10px.

**The "30 minutes" TTL** in the design's body copy (`:18`) is a real server value
(`.qa/design/spec/06-auth-states-landing.md` §8.1 — "reset-token TTL, server-configured"). It stays
in the existing `Auth.sentBody` string as translated copy; do **not** wire it to an endpoint — no
API exposes the TTL, and `tests/e2e/forgot-reset.spec.ts` independently proves the real 31-minute
expiry against the database. Inventing a `GET /api/auth/reset-ttl` is forbidden (D-SCOPE-1 §4).

## Files

- `src/modules/auth/components/ForgotPasswordCard.tsx`
- `src/modules/auth/components/ForgotPasswordForm.tsx`
- `src/modules/auth/components/ForgotPasswordSentState.tsx`

## Depends on

- **290** — the shell and rail.
- **291** — the field kit and error affordance (the `tooManyRequests` case renders through it).

## Steps

1. Read all three files plus `tests/e2e/forgot-reset.spec.ts` and `tests/e2e/auth-logo.spec.ts`.
2. Rebuild the request card: chip → heading → body → field → submit → back link, `gap-5`.
3. Rebuild the sent card: mail chip → heading → body with the bolded address → success banner →
   resend button → back link.
4. Keep exactly one `<h1>` on the route across both states.
5. Motion: the state swap is `st-pop-in` —
   `motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200
   motion-safe:ease-out-expo motion-reduce:animate-none` on the sent card; the submit hover is
   `transition-colors duration-150`; the pending submit shows the `Button`'s `st-spin` spinner with
   `Auth.sendingResetLink`.
6. 375px: card `p-6`, full-width controls ≥44px, no horizontal scroll, the bolded address wraps
   rather than overflowing (`break-words`).

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 8, 11, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values.
- `.claude/rules/i18n.md` — no key added; the address is an interpolation.
- `.claude/rules/quality.md` — one `<h1>`, focus stays sensible across the state swap (move focus to
  the sent card's heading via `tabIndex={-1}` + `focus()` so the change is announced).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/forgot-reset.spec.ts tests/e2e/auth-logo.spec.ts` green,
  including the "zero stock strapi.io emails" assertion.
- **Persistence proof:** request a reset for the seeded parent, read the real Mailpit message, and
  assert with the spec's SQL helper that `up_users.reset_password_token` is non-null for that row
  and still present after a page reload.
- Playwright computed-style assertions: request-card chip `background-color` = `--color-brand-50`;
  sent-card chip = `--color-accent-50`; both cards' `border-radius` = 16px.
- axe zero serious/critical on both states at 375 and 1280.
- Exactly one visible `[data-slot="logo"]` at both viewports.
- Reduced-motion: the sent card appears with no animation.
- Six catalogs key-identical.
- Zero banned-pattern grep hits.

## Assumptions

The design's side-by-side presentation is a gallery device; production keeps the existing sequential
single-screen behaviour, as the spec itself instructs.

## Evidence

_(filled in as the task runs)_
