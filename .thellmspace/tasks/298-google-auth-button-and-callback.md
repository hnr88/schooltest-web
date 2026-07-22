---
id: 298
title: Re-skin the Google social button and the callback screen, keeping the flow env-gated
layer: ui
kind: implement
slice: The single social provider the design ships — button on sign-in/sign-up plus /auth/google/callback
target: src/modules/auth/components/GoogleButton.tsx, GoogleMark.tsx, GoogleCallbackScreen.tsx
contract: n/a (presentation over the existing GET /api/auth/google/callback wiring)
design: .qa/design/screens/app--login.html:38 · .qa/design/screens/ds--footers.html:92 · .qa/design/spec/06-auth-states-landing.md#11-login--split-layout-app-loginhtml · #unknowns
status: TODO
depends_on: [292, 294]
---

## Objective

Dress the Google button to the design's secondary-button spec and the callback screen to the auth
card, without touching the flow: the button stays a real anchor to the API's connect route, the
provider stays disabled (`GOOGLE_ENABLED = false`, D5), and the callback keeps forwarding the
verbatim query string to the real API and rendering its real rejection.

## Contract

n/a — presentation over existing wiring. Preserved verbatim:

- `GoogleButton` is a plain `<a>`/`Button href=` to
  `${env.NEXT_PUBLIC_API_BASE_URL}/api/connect/google` — **never** a `fetch`, never a stub, and it
  is visible always (D18 / task-12 decision). Env is read only through `@/lib/env`.
- `GOOGLE_ENABLED = false` in `src/modules/auth/constants/auth.constants.ts` stays false.
- `/[locale]/auth/google/callback` is a Server Component that rebuilds the verbatim query string and
  passes it to `GoogleCallbackScreen`; `useGoogleCallbackMutation` calls
  `GET /api/auth/google/callback?<query>`; the JWT only ever comes from that response.
- Failure (which is the only reachable outcome today) redirects to `/sign-in?error=google`, rendered
  by task 293's banner.
- Keys: `Auth.googleButton`, `googleTitle`, `googleConnecting`, `googleError`, `googleCallbackMeta`.

**The live Google consent round-trip stays BLOCKED.** `.qa/DECISIONS.md` **D5 — Google OAuth e2e is
BLOCKED-with-reason**: no Google credentials exist for this project, so no test may perform a real
consent. `tests/e2e/google-callback.spec.ts` proves what is provable — the button's `href`, the
no-query redirect, and the real API's rejection of a forwarded query. **Do not author, mock, stub or
fake a successful Google sign-in in any spec.**

## Design source

Two different Google artworks ship in the design and the spec records the conflict
(`.qa/design/spec/06-auth-states-landing.md` UNKNOWNS: *"Two different Google logo artworks ship …
Which is canonical is not stated."*):

- `app--login.html:38` — Material palette `#FFC107 / #FF3D00 / #4CAF50 / #1976D2`, icon 17×17.
- `ds--footers.html:92` — brand-G palette `#4285F4 / #34A853 / #FBBC05 / #EA4335`, icon 15×15.

**Resolution: keep the brand-G palette**, which is what `GoogleMark.tsx` already renders and which
is Google's own published mark. These four hex values are an external brand asset, not theme
colours — `.claude/rules/tailwind.md`'s OKLCH rule governs the design system, and the existing file
already documents this exemption. Do not tokenise them, do not restyle them.

Button box (`app--login.html:38`): `flex; align-items:center; justify-content:center; gap:10px;
background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:14.5px; font-weight:600;
padding:12px; border-radius:10px`; hover `background:#F7F9FC`.

| Value | Token / utility |
|---|---|
| `#FFFFFF` surface | `bg-card` |
| `#16326E` ink | `--color-secondary-foreground` → `text-secondary-foreground` |
| `#CBD5E1` border | `--color-input` → `border-input` |
| `#F7F9FC` hover | `--color-background` → `hover:bg-background` |
| radius `10px` | `rounded-lg` |
| gap `10px` | `gap-2.5` |
| height | `h-11` (the ≥44px target `a11y-auth.spec.ts` measures — the design's `padding:12px` alone falls short) |
| icon | `size-4` (16px, between the design's 15 and 17) |

Callback screen: the auth card from task 290's rail, `gap-5`, with the `st-spin` spinner while the
mutation is pending and the `Auth.googleConnecting` label — spec §6.1: *"wire auth submit spinners
to `st-spin`"*.

## Files

- `src/modules/auth/components/GoogleButton.tsx` (styling only)
- `src/modules/auth/components/GoogleMark.tsx` (size only — the four brand fills are untouched)
- `src/modules/auth/components/GoogleCallbackScreen.tsx`

## Depends on

- **292** and **294** — the button sits in both cards and must not move relative to their focus
  order (`logo → Google → …` on both screens).

## Steps

1. Read the three files, `src/app/[locale]/auth/google/callback/page.tsx`,
   `tests/e2e/google-callback.spec.ts` and the callback section of `tests/e2e/a11y-auth.spec.ts`.
2. Apply the button box above; keep `variant="outline"`, `size="lg"`, the `href`, the `title` and
   the `GoogleMark` child in that order.
3. Callback screen: pending state = centred `st-spin` spinner
   (`motion-safe:animate-spin motion-reduce:animate-none`) + `Auth.googleConnecting`; failure keeps
   its existing redirect to `/sign-in?error=google`.
4. Motion: button hover `transition-colors duration-150` (spec §6.3 prescribes exactly this for the
   white/`1px #CBD5E1` secondary button); focus ring from `--color-ring`.
5. 375px: the button is full width, ≥44px, and its label does not wrap mid-word.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 9 (never `fetch` from a client component), 11, 15.
- `.claude/rules/quality.md` — env only via `@/lib/env`, never bare `process.env`.
- `.claude/rules/tailwind.md` — tokens for everything except the documented brand-mark exemption.
- `.claude/rules/testing.md` + D5 — no fabricated success path.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/google-callback.spec.ts tests/e2e/a11y-auth.spec.ts` green —
  the button's `href` on both cards, the no-query redirect to `?error=google`, the forwarded-query
  rejection by the **real** API, and the callback-error axe/no-h-scroll sweep at 375 and 1280.
- Playwright assertion that the button's computed `border-color` = `--color-input`, hover
  `background-color` = `--color-background`, and its bounding box is ≥44×44 at both viewports.
- Forward-Tab order on `/sign-in` and `/sign-up` unchanged (`a11y-auth.spec.ts`).
- Reduced-motion: the callback spinner does not animate.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits **except** the four documented brand fills inside `GoogleMark.tsx`,
  which the grep exemption list must continue to carry.
- The Evidence section states explicitly that the live consent round-trip remains BLOCKED per D5.

## Assumptions

The Material-palette artwork at `app--login.html:38` is not shipped; the brand-G artwork already in
the repo wins, and the conflict is recorded rather than silently resolved.

## Evidence

_(filled in as the task runs)_
