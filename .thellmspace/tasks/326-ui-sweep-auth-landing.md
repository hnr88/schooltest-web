---
id: 326
title: UI sweep auth, landing, 404 and loading states — every control at 375 and 1280
layer: ui
kind: verify
slice: `/[locale]`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/google/callback`, `not-found`, `loading`
target: src/modules/auth/**, src/modules/landing/**, src/app/[locale]/{page,loading,error,not-found}.tsx, src/app/[locale]/{sign-in,sign-up,forgot-password,reset-password,auth}/**, new spec tests/e2e/sweep-auth-landing.spec.ts
contract: n/a for presentation; reads/writes `POST /api/auth/local`, `/local/register`, `/forgot-password`, `/reset-password`, `/send-email-confirmation`, `GET /api/auth/google/callback`
design: .qa/design/screens/app--login.html, app--register.html, app--forgot-password.html, app--404.html, app--loading-skeleton.html, landing--*.html, .qa/design/spec/06-auth-states-landing.md
status: TODO
depends_on: []
---

## Objective

Sweep every interactive control on the unauthenticated surface — the landing page's sections and
CTAs, all five auth screens, the Google callback, the 404 and the loading skeletons — at 375px
and 1280px, proving each fires the right endpoint against the real API, renders the real
response, and fails with a translated, non-leaking message.

## Contract

Quoted from `.qa/CONTRACTS.md` (mission-2 AUTH section, still binding) and
`.qa/intake/web-inventory.md` §3:

- `POST /api/auth/local` — `useLoginMutation`, request validated by `loginSchema.parse`.
  Success returns the users-permissions JWT, which is written to
  `localStorage['app.auth.token']` by `writeClientToken` (`src/lib/axios/strapi.ts:5-24`).
  Wrong credentials ⇒ a translated inline error, never the raw Strapi body.
- `POST /api/auth/local/register` — `registerSchema.parse`; a taken email/username ⇒ a
  translated inline error.
- `POST /api/auth/send-email-confirmation` — resend, gated by the countdown button.
- `POST /api/auth/forgot-password` — always the same "sent" state (no account enumeration).
- `POST /api/auth/reset-password` — `{ code, password, passwordConfirmation }`; a garbage or
  expired `code` ⇒ a translated error; success auto-logs-in and kills the old password.
- `GET /api/auth/google/callback?<verbatim query>` — the server page forwards the query
  verbatim; the real JWT comes only from that response. No query ⇒ `?error=google`.
- `GET /api/users/me` — the axios **response** interceptor clears the token on any `401`
  (`src/lib/axios/strapi.ts:45-53`), which is what produces `?error=session`.

**D-AUTH-1:** accounts come only from the seed. Sign-up flows use
`tests/e2e/helpers/throwaway-parent.ts` + Mailpit (`tests/e2e/helpers/mailpit.ts`,
API at `http://127.0.0.1:8125/api/v1`), never the Strapi admin UI.

**D5 (still binding):** the live Google OAuth consent round-trip is BLOCKED — there is no
`GOOGLE_CLIENT_ID`/`SECRET` in this workspace. It stays a named `test.skip` with the reason,
never a fake pass.

## Design source

- Auth card (`.qa/design/spec/06-auth-states-landing.md`, slices `app--login.html`,
  `app--register.html`, `app--forgot-password.html`): inputs
  `width:100%; padding:10px 13px; border-radius:10px; border:1px solid #CBD5E1` →
  `--color-input`; `font-size:14px; color:#0E2350` → `--color-navy-900`;
  `transition: border-color .15s, box-shadow .15s`; **focus**
  `border-color:#2563EB` → `--color-primary` + `box-shadow: 0 0 0 3px rgba(37,99,235,.16)`
  (`05-ds-components.md:670`). Field stack `display:flex; flex-direction:column; gap:12px`.
  Placeholders `you@school.edu`, `Password` — **i18n keys, not literals.**
- Primary button (`04-ds-foundations.md#4.1/4.2`): `font-size:14px; font-weight:600;
  padding:10px 18px; border-radius:10px; gap:8px; background:#2563EB` → `--color-primary`;
  hover `#1D4ED8` → `--color-primary-hover`;
  `box-shadow: 0 1px 2px rgba(14,35,80,.08)` → `--shadow-sm`;
  `transition: background .15s` → `var(--duration-fast, 150ms) var(--ease-out-quart)`.
  Loading state is the `st-spin` 14×14 ring, `700ms linear infinite`.
- Link button: `color:#2563EB` → `--color-primary`; hover `#1D4ED8` + underline; no radius,
  no gap, no transition (design) — the underline-on-hover is kept because it is the only
  non-colour affordance.
- 404 (`app--404.html`) and loading skeleton (`app--loading-skeleton.html`): skeleton fill is
  `linear-gradient(90deg,#F1F5F9 25%,#E9EEF5 37%,#F1F5F9 63%)` →
  `--color-skeleton-base` / `--color-shimmer-mid`, `background-size:400px 100%`,
  `st-shimmer 1.4s ease infinite`. Per `04-ds-foundations.md#I` note 3 the shimmer is
  re-authored as a **translated overlay** (`transform: translateX()`), never
  `background-position`, to satisfy `.claude/rules/tailwind.md:19`.
- Landing sections (`landing--hero/features/feature-detail/stats/how-it-works/pricing/faq/cta`):
  container `--container-landing: 1200px`; the existing `ScrollReveal` entrance is kept and
  must already respect `prefers-reduced-motion`.
- Focus ring everywhere from `--color-ring: oklch(0.5461 0.2152 262.88 / 0.35)`.

## Files

- `tests/e2e/sweep-auth-landing.spec.ts` (new)
- Fix-in-place authority: `src/modules/auth/components/**`, `src/modules/landing/**`,
  `src/app/[locale]/{page,loading,not-found,error}.tsx`, `src/app/global-error.tsx`,
  `src/app/[locale]/{sign-in,sign-up,forgot-password,reset-password,auth}/**`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` if a string is missing
- Never `src/components/ui/**`

## Depends on

No intra-wave dependency — this surface does not use the dashboard shell.
Wave gate (prose): **all of W10 (Auth + landing, ids 290-313)** must be DONE.

## Steps

1. Landing at 1280×800: assert every section renders from the en catalog (keep
   `tests/e2e/landing.spec.ts`'s landmark order + single-`h1` assertions green), every CTA and
   in-page anchor resolves (header `Pricing` → `#pricing`), the locale switcher preserves the
   route, and `next/image` is used for every image (no raw `<img>` outside
   `src/app/global-error.tsx`, which is documented as pre-existing).
2. Sign-in: assert empty submit produces translated Zod errors with **zero** network calls;
   a wrong password produces the translated inline error and **no Strapi message leak**
   (assert the rendered text is not the raw API `error.message`); the seeded parent logs in,
   `localStorage['app.auth.token']` is set, and the URL becomes `/dashboard`.
   Assert `?confirmed=1`, `?error=google` and `?error=session` each render their banner.
3. Sign-up: field validation, client-side password mismatch, taken-email inline error; then a
   full throwaway registration → check-email state → Mailpit link → `/sign-in?confirmed=1` →
   login. Clean up the throwaway account.
4. Forgot/reset: forgot → sent state + countdown (the resend button is disabled until the
   countdown expires — assert both states); `/reset-password` with no code and with a garbage
   `?code=` each render the translated error; a real reset from the Mailpit link auto-logs in
   and the old password is dead. Restore the seeded parent's password.
5. Google: assert the Google button links correctly on both cards; the callback with no query
   redirects to `?error=google`; the callback query is forwarded verbatim to the real API and
   rejected honestly. Keep the D5 `test.skip` with its reason.
6. 404: `/[locale]/does-not-exist` renders the 404 card with a working "back" link; a non-locale
   segment triggers `notFound()`.
7. Loading: throttle or delay a route to force `loading.tsx`, and assert the skeleton renders
   with the shimmer overlay animating and **no layout shift** when the real content arrives
   (compare the container's bounding box before/after).
8. Repeat 1-6 at **375×812**: no horizontal scroll (`scrollWidth <= 376`), every control
   ≥44×44, the landing mobile nav opens and `Escape` closes it returning focus to its trigger,
   the auth card is not clipped and the submit button is reachable without scrolling past the
   viewport bottom (or is reachable by scrolling with no overlap).
9. Motion: measure the button background transition (150-200ms), the `st-spin` loading ring
   (700ms linear infinite — the design's own value, exempt as a continuous indicator), the
   skeleton shimmer (1400ms), and the ScrollReveal entrance; re-measure everything under
   `page.emulateMedia({ reducedMotion: 'reduce' })` and assert every finite animation collapses
   to `<= 0.02s` and the shimmer/spin either stop or degrade to a static state, with the final
   rendered state identical.
10. `watchErrors(page)` empty across every navigation in the spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 8, 9, 11, 12, 14; §5 pitfalls 3 (`searchParams`
  is async), 11, 13 (`<Link>` from `next-intl/navigation`, never a bare `<a>` for internal nav).
- `.claude/rules/quality.md` — every page exports `metadata`/`generateMetadata` (title ≤60,
  description ≤160), one `<h1>`, semantic landmarks, `next/image` with width/height or fill and
  `priority` for the LCP image, `next/font` for every font.
- `.claude/rules/i18n.md` — `getTranslations` in Server Components, `useTranslations` in Client
  Components; PascalCase namespace + camelCase key; all six catalogs identical.
- `.claude/rules/tailwind.md` — the shimmer is a translated overlay, not `background-position`.
- `.claude/rules/testing.md`, D-VERIFY-1, D-AUTH-1, D5.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sweep-auth-landing.spec.ts` passes at 375×812 and
  1280×800.
- Real login proven: seeded credentials → real `POST /api/auth/local` 200 → token in
  `localStorage` → `/dashboard`; and after a reload the session is still valid.
- Real registration + email confirmation proven end-to-end through Mailpit, and the throwaway
  account is cleaned up.
- Real password reset proven end-to-end (old password dead, new password works), and the seeded
  password is restored in the same run.
- Every error path renders a translated message with **no raw Strapi text** (asserted by
  comparing against the API's real `error.message`).
- D5 Google BLOCKED remains a named `test.skip` with its reason — never a fake pass.
- Loading skeleton renders with a working shimmer and produces **no layout shift**.
- All pre-existing auth/landing specs (`landing`, `landing-aria`, `locale-routing`, `home`,
  `sign-in`, `sign-up`, `sign-up-confirm`, `parent-auth`, `parent-auth-errors`,
  `forgot-reset`, `google-callback`, `auth-logo`, `a11y-auth`, `a11y-responsive`) still pass in
  the same run.
- No horizontal scroll at 375; every control ≥44×44; mobile nav traps focus and `Escape` closes.
- Motion measured 150-200ms for interactive transitions and collapsed to `<= 0.02s` under
  `reducedMotion: 'reduce'`.
- `watchErrors(page)` empty.
- All six locale catalogs key-identical if any string changed.
- Zero banned-pattern grep hits.

## Assumptions

- Mailpit is up on `:8125` (D-OPS-1 recorded it as BUSY-and-ours) — if it is down the task is
  BLOCKED with that fact, never asserted around.
- `src/app/global-error.tsx`'s raw `<img>` and plain-English copy are pre-existing
  (`.qa/intake/web-inventory.md` §1) — fixing them is in scope only if W10 already touched that
  file; otherwise it is recorded in Evidence, not silently changed (law 4).

## Evidence

<!-- filled in as the task runs -->
