---
id: 295
title: Re-skin the "check your inbox" confirm state and its resend countdown button
layer: ui
kind: implement
slice: The post-register confirmation state on /sign-up — mail chip, success alert, resend cooldown, back link
target: src/modules/auth/components/SignUpConfirmState.tsx, src/modules/auth/components/ResendCountdownButton.tsx
contract: n/a (presentation over the existing POST /api/auth/send-email-confirmation wiring)
design: .qa/design/screens/app--forgot-password.html:14-23 · .qa/design/spec/06-auth-states-landing.md#13-forgot-password-app-forgot-passwordhtml--two-cards-request--confirmation
status: TODO
depends_on: [294]
---

## Objective

Dress the existing register-success state in the design's confirmation card — teal mail chip, 24px
heading, the "email sent" success alert, and the secondary resend button carrying a live `m:ss`
cooldown — with the resend mutation, the cooldown clock and the copy keys untouched.

## Contract

n/a — presentation over existing wiring. Preserved verbatim:

- `useResendConfirmationMutation` → `POST /api/auth/send-email-confirmation` with the submitted
  email; the shared `forgotPasswordSchema` (`{email}`) still validates the request.
- The cooldown is the existing `ResendCountdownButton` + `src/modules/auth/lib/format-countdown.ts`;
  its seconds source and its disabled-while-counting behaviour do not change.
- i18n keys stay: `Auth.checkEmailTitle`, `checkEmailBody`, `sentSuccess`, `resendEmail`,
  `resendEmailCountdown`, `tooManyRequests`, `backToSignIn`, `alreadyConfirmed`.
- `tests/e2e/sign-up-confirm.spec.ts` drives register → this state → Mailpit → `/sign-in?confirmed=1`
  and must stay green.

## Design source

`.qa/design/screens/app--forgot-password.html:14-23` (Card B — the design's only confirmation card),
values literal:

| Element | Value | Token / utility |
|---|---|---|
| Card | `width:420px; background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:36px; gap:20px; box-shadow:0 2px 8px rgba(14,35,80,.08)` | `bg-card border border-border rounded-panel p-9 gap-5 shadow-md` |
| Icon chip | `44×44; border-radius:12px; background:#F0FDFA`; lucide **mail** `21×21, stroke #0D9488, stroke-width 2` | `size-11 rounded-tile bg-accent-50` + `Mail className="size-5 text-accent-600" strokeWidth={2}` (`--radius-tile` = 12px) |
| `h2` | `24px / 700 / #0E2350`, **no letter-spacing** | 24px `--text-*` token, `font-bold text-foreground` |
| Body `p` | `14.5px / line-height 1.55 / #64748B`, the address inside `<strong style="color:#0E2350">` | `text-sm leading-relaxed text-muted-foreground`, address `font-semibold text-foreground` |
| Success alert | `background:#F0FDFA; border:1px solid #CCFBF1; border-radius:10px; padding:12px 14px; font-size:13.5px; color:#0D9488; flex; gap:9px; align-items:center`; check `15×15 stroke currentColor sw 2.4` | task 293's `AuthStatusBanner tone="success"` — reuse, do not re-declare |
| Resend button | `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; 14.5px/600; padding:12px; border-radius:10px`; hover `background:#F7F9FC`; label `Resend email (0:42)` | `w-full h-11 rounded-lg border border-input bg-card text-secondary-foreground font-semibold hover:bg-background transition-colors duration-150` |
| Back link | `text-align:center; 14px; font-weight:600`, colour inherits `#2563EB` | `text-center text-sm font-semibold text-primary hover:text-brand-700 transition-colors duration-150` |

Token map: `#F0FDFA` → `--color-accent-50` · `#CCFBF1` → `--color-accent-100` · `#0D9488` →
`--color-accent-600` · `#CBD5E1` → `--color-input` · `#16326E` → `--color-secondary-foreground` ·
`#F7F9FC` → `--color-background`.

`.qa/design/spec/06-auth-states-landing.md` UNKNOWNS: *"'Resend email' post-cooldown label — only
the counting state `Resend email (0:42)` exists; the enabled label and the disabled styling during
cooldown are not drawn."* Resolution, already implemented and preserved: counting →
`Auth.resendEmailCountdown` with the `m:ss` value and `disabled`; at zero →
`Auth.resendEmail`, enabled. Disabled styling comes from task 291's disabled tokens
(`border-border`, `bg-muted`, `text-muted-foreground-soft`, `cursor-not-allowed`).

## Files

- `src/modules/auth/components/SignUpConfirmState.tsx`
- `src/modules/auth/components/ResendCountdownButton.tsx` (styling + disabled state only; the timer
  logic stays exactly as written)

## Depends on

- **294** — this state is swapped into the sign-up card and must inherit its rail and rhythm.
- Uses task 293's `AuthStatusBanner` (already landed via 292 → 293 → 294 in the same wave).

## Steps

1. Read both files, `tests/e2e/sign-up-confirm.spec.ts` and `tests/e2e/forgot-reset.spec.ts` (which
   asserts the same countdown component on the forgot flow).
2. Rebuild the card body: chip → heading → body with the bolded address → success banner → resend
   button → back link, at `gap-5`.
3. Style the resend button per the table; the countdown label keeps its existing ICU-free
   `resendEmailCountdown` key with the formatted `m:ss` argument.
4. Motion: card entrance `motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95
   motion-safe:duration-200 motion-safe:ease-out-expo motion-reduce:animate-none` (`st-pop-in`, the
   keyframe spec §6.1 assigns to the confirmation surface). The countdown text itself must **not**
   animate — a per-second animation is a distraction and an axe/aria churn risk.
5. 375px: card `p-6`, chip stays 44px, button full width and ≥44px tall.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 15.
- `.claude/rules/tailwind.md` — tokens only; animate transform/opacity only.
- `.claude/rules/i18n.md` — no key added; the address is an interpolated value, never concatenated.
- `.claude/rules/quality.md` — the countdown must be announced politely at most once, not every tick
  (`aria-live` stays off the ticking node).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sign-up-confirm.spec.ts tests/e2e/forgot-reset.spec.ts` green.
- **Persistence proof:** register a throwaway parent against the real API, assert this state renders
  with the submitted address, fetch the confirmation mail from the real Mailpit at
  `http://127.0.0.1:8125/api/v1`, follow it, and confirm the `up_users` row is `confirmed = true`
  after a reload.
- Playwright assertion that the resend button is `disabled` while the countdown text matches
  `/\d+:\d{2}/`, and becomes enabled with the `Auth.resendEmail` label when it reaches zero.
- Playwright computed-style assertion that the mail chip's `background-color` resolves to
  `--color-accent-50` and the icon's colour to `--color-accent-600`.
- axe zero serious/critical on the confirm state at 375 and 1280.
- Reduced-motion: no card entrance animation.
- Six catalogs key-identical.
- Zero banned-pattern grep hits.

## Assumptions

The design's `30 minutes` TTL copy belongs to the forgot-password card, not this one; nothing about
a confirmation-link TTL is asserted here because the API does not expose one.

## Evidence

_(filled in as the task runs)_
