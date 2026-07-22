---
id: 293
title: Build the auth status/error banner set (invalid credentials, unconfirmed, google, session, confirmed)
layer: ui
kind: implement
slice: The five above-the-form status affordances on /sign-in, styled from the design's alert patterns
target: src/modules/auth/components/AuthStatusBanner.tsx, src/modules/auth/components/SignInCard.tsx, src/modules/auth/components/SignInForm.tsx
contract: n/a (presentation over the existing sign-in error classification)
design: .qa/design/screens/app--forgot-password.html:20 · .qa/design/screens/ds--forms.html:12-14 · .qa/design/spec/06-auth-states-landing.md#15-form-field--canonical-states--error-affordance · #unknowns
status: TODO
depends_on: [292]
---

## Objective

One banner component, five real states, all already produced by code that exists today: wrong
credentials, unconfirmed account, `?error=google`, `?error=session`, `?confirmed=1`. Today they are
four different ad-hoc blocks inside `SignInCard`/`SignInForm`; this task makes them one design-true
affordance without changing which state appears when.

## Contract

n/a — presentation. The states and their triggers are existing behaviour and must be preserved
exactly:

| State | Trigger (existing code) | Tone | i18n key |
|---|---|---|---|
| Invalid credentials | `classifySignInError` → `loginError` (`src/modules/auth/lib/classify-sign-in-error.ts`) | error | `Auth.loginError` |
| Account not confirmed | `classifySignInError` → `notConfirmedError` | warning | `Auth.notConfirmedError` |
| Offline / server | `classifySignInError` → `offlineError` / `serverError` | error | `Auth.offlineError`, `Auth.serverError` |
| Google failure | `/sign-in?error=google` (`src/app/[locale]/sign-in/page.tsx`) | error | `Auth.googleError` |
| Session expired | `/sign-in?error=session` | error | `Auth.sessionExpired` |
| Email confirmed | `/sign-in?confirmed=1` | success | `Auth.emailConfirmedBanner` |

`.qa/design/spec/06-auth-states-landing.md` UNKNOWNS records the gap this task closes:

> **Auth error states are never rendered on the auth screens.** … The only error affordance in the
> whole design is the generic form field error at `ds--forms.html:12-14` … Whether auth uses a
> form-top alert, per-field errors, or both is undefined.

Resolution, recorded rather than invented: **both**, and neither is new geometry — the form-top
alert reuses the design's own auth alert box (`app--forgot-password.html:20`, the teal success
strip) recoloured per tone, and per-field errors are task 291's `ds--forms.html:14` affordance.

## Design source

Auth alert box, `app--forgot-password.html:20` (the only alert drawn on any auth screen):
`border-radius:10px; padding:12px 14px; font-size:13.5px; display:flex; gap:9px;
align-items:center`, leading icon `15×15, stroke currentColor, stroke-width 2.4`.

Per-tone surface/border/ink, from `.qa/design/spec/06-auth-states-landing.md` §0.2 and
`.qa/design/spec/04-ds-foundations.md#c-extra-colours`:

| Tone | Surface | Border | Ink | Icon |
|---|---|---|---|---|
| success | `#F0FDFA` → `--color-accent-50` | `#CCFBF1` → `--color-accent-100` | `#0D9488` → `--color-accent-600` | lucide `CircleCheck` |
| error | `#FEE2E2` → `--color-destructive-soft` | `#DC2626/25` → `--color-destructive` at low alpha | `#B91C1C` → `--color-destructive-strong` | lucide `CircleAlert` |
| warning | `#FEF3C7` → `--color-warning-soft` | `--color-warning` at low alpha | `#B45309` → `--color-warning-strong` | lucide `TriangleAlert` |

Geometry: `rounded-lg px-3.5 py-3 text-sm flex items-center gap-2.5`, icon `size-4 shrink-0`.

## Files

- `src/modules/auth/components/AuthStatusBanner.tsx` (new; props `{ tone, children }` — dumb)
- `src/modules/auth/components/SignInCard.tsx` (replace the three inline blocks with it)
- `src/modules/auth/components/SignInForm.tsx` (replace the `Alert` block with it)

Keep it module-internal; do not export from `src/modules/auth/index.ts`.

## Depends on

- **292** — the sign-in card structure this banner slots into (directly under the heading block,
  above the Google slot, so it does not shift the focus order).

## Steps

1. Read the four call sites and `tests/e2e/parent-auth-errors.spec.ts`,
   `tests/e2e/google-callback.spec.ts`, `tests/e2e/sign-up-confirm.spec.ts`,
   `tests/e2e/change-password.spec.ts` — each asserts one of these states today.
2. Build `AuthStatusBanner` with the three tones above; the banner is a `<p>`-level region carrying
   `role="status"` for success and `role="alert"` for error/warning, so a live announcement happens
   without a focus move.
3. Swap all four call sites; the *conditions* under which each renders are copied verbatim from the
   current code — no new state, no new query param, no new classification branch.
4. The banner sits **between the heading block and the Google button** so no focusable node moves.
5. Motion: `motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95
   motion-safe:duration-200 motion-safe:ease-out-expo motion-reduce:animate-none` — the design's
   `st-pop-in` keyframe (`from{opacity:0;transform:scale(.96)}`), which spec §6.1 explicitly assigns
   to auth confirmations. Opacity + transform only.
6. 375px: the banner wraps to two lines without the icon shrinking or the text clipping.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 15 — no new behaviour, only the affordance.
- `.claude/rules/tailwind.md` — token colours only; animate transform/opacity only.
- `.claude/rules/quality.md` — a status message must be programmatically announced; contrast ≥4.5:1
  for the banner ink on its surface (the strong-ink tokens are chosen for exactly this).
- `.claude/rules/i18n.md` — reuse the six existing keys; add none.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/parent-auth-errors.spec.ts tests/e2e/sign-in.spec.ts
  tests/e2e/google-callback.spec.ts tests/e2e/sign-up-confirm.spec.ts
  tests/e2e/change-password.spec.ts` green.
- Real assertions against the running app, one per state: (a) submit a wrong password for the
  seeded parent → `role="alert"` banner with `Auth.loginError`, **and the response body's Strapi
  message is not leaked into the DOM**; (b) `/sign-in?error=google` → `Auth.googleError`;
  (c) `/sign-in?error=session` → `Auth.sessionExpired`; (d) `/sign-in?confirmed=1` →
  `role="status"` banner with `Auth.emailConfirmedBanner`.
- Playwright computed-style assertion that the error banner's ink resolves to the
  `--color-destructive-strong` value and the success banner's to `--color-accent-600`.
- axe zero serious/critical on `/sign-in` with each banner rendered, at 375 and 1280.
- Focus order unchanged: `tests/e2e/a11y-auth.spec.ts` passes with the banner present.
- Reduced-motion: banner appears with no animation.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

The design ships no auth alert artwork beyond the forgot-password success strip; recolouring that
one box per tone is the smallest honest extension and is recorded here as such.

## Evidence

_(filled in as the task runs)_
