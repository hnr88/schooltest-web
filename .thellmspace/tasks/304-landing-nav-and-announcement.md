---
id: 304
title: Re-skin the landing announcement bar and sticky nav, incl. the 375px sheet composition
layer: ui
kind: implement
slice: The landing page chrome — navy announcement strip above a sticky blurred nav with links, sign-in and Start free
target: src/modules/landing/components/AnnouncementBar.tsx, LandingHeader.tsx, MobileNav.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/spec/06-auth-states-landing.md#50-announcement-bar · #51-nav · .qa/design/screens/ds--landing-components.html:5-8
status: TODO
depends_on: []
---

## Objective

Bring the landing chrome to the design: the navy announcement strip, then the sticky
`rgba(255,255,255,.88)` + `blur(12px)` nav with its four hover-tinted links, the "Sign in" text
button and the shadowed "Start free" primary — and a 375px composition that keeps the existing
Sheet nav and its Escape-to-close behaviour.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- The skip link stays the **first focusable element on the page** (WCAG 2.4.1) — it is asserted by
  `tests/e2e/a11y-responsive.spec.ts` ("skip link first, Escape closes mobile menu").
- The DOM order contract asserted by `tests/e2e/landing.spec.ts:103-117`:
  `[data-slot=announcement-bar]` → `header` → `main#main-content` → `h1` → … The announcement bar
  must keep that exact `data-slot`, and the nav must stay a `<header>` landmark rendered once.
- `nav` keeps `aria-label={t('nav.label')}` — `tests/e2e/landing-aria.spec.ts` looks it up by name
  in `en` and `zh`.
- The header "Pricing" link keeps `href="#pricing"` and must still scroll `#pricing` into view
  (`landing.spec.ts:131`).
- `NAV_LINKS` in `src/modules/landing/constants/landing.constants.ts` stays the single source of the
  four items; keys `Home.nav.*` unchanged.

## Design source

**Announcement bar** (`.qa/design/spec/06-auth-states-landing.md` §5.0, source
`SchoolTest Landing.dc.html:23-28`): `background:#0E2350; padding:10px 24px; display:flex;
align-items:center; justify-content:center; gap:12px; flex-wrap:wrap`; text `13px; color:#A9BADC`;
link `13px; font-weight:600; color:#5EEAD4`.

| Value | Token / utility |
|---|---|
| `#0E2350` | `--color-navy-900` → `bg-navy-900` |
| `#A9BADC` | `--color-navy-body` → `text-navy-body` |
| `#5EEAD4` | `--color-accent-on-dark-hover` (`--chart-5`) → `text-chart-5` |
| `10px 24px` | `px-6 py-2.5` |
| gap `12px` | `gap-x-3` |

**Nav** (§5.1, source `:31-45`): `position:sticky; top:0; z-index:50;
background:rgba(255,255,255,.88); backdrop-filter:blur(12px); border-bottom:1px solid #EEF2F7`.
Inner `max-width:1200px; margin:0 auto; padding:14px 32px; display:flex; align-items:center;
gap:28px`.

| Element | Value | Token / utility |
|---|---|---|
| Bar | sticky, `z-50`, `bg-card/88`, `backdrop-blur-md` (12px), `border-b border-rule` | `#EEF2F7` → `--color-rule` |
| Inner rail | `max-width:1200px`, `padding:14px 32px`, `gap:28px` | `--container-landing` (1200px) → `max-w-landing mx-auto px-8 py-3.5 gap-7` |
| Logo | `height:30px; width:auto` | existing `Logo` |
| Nav links | `14px/500; color:#475569; padding:8px 14px; border-radius:9px`; hover `background:#F1F5F9; color:#0E2350` | `text-sm font-medium text-body px-3.5 py-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors duration-150` |
| "Sign in" | `14px/600; color:#16326E; padding:9px 16px; border-radius:10px`; hover `background:#F1F5F9` | `text-sm font-semibold text-secondary-foreground px-4 rounded-lg hover:bg-muted transition-colors duration-150`, `h-11` for the 44px floor |
| "Start free" | `background:#2563EB; color:#FFFFFF; 14px/600; padding:10px 18px; border-radius:10px; box-shadow:0 4px 12px rgba(37,99,235,.25)`; hover `#1D4ED8` | `bg-primary text-primary-foreground rounded-lg h-11 px-4.5 shadow-primary-glow hover:bg-primary-hover transition-colors duration-150` (`--shadow-primary-glow` already carries that exact glow) |

The design's blur bar is a translucent surface, not "glassmorphism" in the banned sense
(`.claude/rules/tailwind.md` bans the frosted-card aesthetic; a sticky translucent nav is the
design's literal declaration and is already shipped today). Keep it as it is.

Both booleans in `SchoolTest Landing.dc.html:322` — `showAnnouncement` (default `true`) and
`showPricing` (default `true`) — are page-level props. Keep `showAnnouncement` expressible: the bar
renders from a constant in `landing.constants.ts`, not from a hard-coded `true` in JSX.

## Files

- `src/modules/landing/components/AnnouncementBar.tsx`
- `src/modules/landing/components/LandingHeader.tsx`
- `src/modules/landing/components/MobileNav.tsx` (styling of the trigger + sheet body only)
- `src/modules/landing/constants/landing.constants.ts` (add `SHOW_ANNOUNCEMENT`)

## Depends on

None inside W10. Wave-level: W0 tokens (`--color-rule`, `--shadow-primary-glow`,
`--container-landing` all already exist in `globals.css` with the right provenance).

## Steps

1. Read the three components, `src/app/[locale]/page.tsx`, `tests/e2e/landing.spec.ts`,
   `landing-aria.spec.ts` and `a11y-responsive.spec.ts` before editing.
2. Apply the announcement values; keep `data-slot="announcement-bar"` and the `#ai-feedback` anchor.
3. Apply the nav values; keep the landmark, the `aria-label`, the link hrefs and the `MobileNav`
   mount point.
4. Motion: nav link and button hovers `transition-colors duration-150` (spec §6.3 prescribes exactly
   this set); the announcement bar enters with
   `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2
   motion-safe:duration-200 motion-safe:ease-out-expo motion-reduce:animate-none`
   (`st-fade-in` + `st-toast-in` inverted). No scroll-linked animation — the design ships none
   (spec §6.4) and a scroll listener on a sticky bar is a jank risk.
5. 375px: nav links collapse into the existing Sheet; the trigger stays `size-11`; the "Start free"
   button remains visible in the bar; the announcement text wraps to two lines without clipping.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 8, 11, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, `gap-*` over margins, no gradient
  text on headings.
- `.claude/rules/i18n.md` — every string via `t()`; `Home.nav.*` and `Home.announcement.*` unchanged.
- `.claude/rules/quality.md` — skip link first, one `<header>` landmark, ≥44px targets, visible
  focus, `<Link>` from `next-intl/navigation` for internal nav (in-page `#` anchors stay `<a>`).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/landing-aria.spec.ts
  tests/e2e/a11y-responsive.spec.ts tests/e2e/home.spec.ts tests/e2e/locale-routing.spec.ts` green —
  including the section-order chain, the skip-link-first assertion and Escape closing the sheet.
- Real assertions against the running app: the header is `position: sticky` with computed
  `backdrop-filter` containing `blur`; clicking header "Pricing" puts `#pricing` in the viewport;
  at 375px the four nav links are not visible until the Sheet is opened.
- Computed-style assertions: announcement `background-color` = `--color-navy-900`, its link colour =
  `--color-chart-5`; nav border-bottom colour = `--color-rule`.
- axe zero serious/critical on `/` and `/zh` at 375 and 1280; no horizontal scroll at 375.
- Reduced-motion: no entrance animation, no hover transition.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

`showAnnouncement` is exposed as a constant rather than a runtime flag — there is no feature-flag
service in this app and inventing one is out of scope.

## Evidence

_(filled in as the task runs)_
