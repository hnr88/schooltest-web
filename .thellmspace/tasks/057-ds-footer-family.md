---
id: 057
title: Rebuild the footer family — navy marketing footer, light app footer, cookie banner
layer: ui
kind: implement
slice: MarketingFooter + AppFooter + CookieBanner
target: src/modules/design-system/components/marketing-footer.tsx, src/modules/design-system/components/app-footer.tsx, src/modules/design-system/components/cookie-banner.tsx, src/modules/design-system/types/brand.types.ts, src/modules/design-system/components/showcase/brand-section.tsx, tests/e2e/ds-footer.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--footers.html, .qa/design/spec/05-ds-components.md#7.1,#7.2,#7.3
status: TODO
depends_on: [001, 003, 006, 007, 008, 010, 011, 020, 025, 039]
---

## Objective

Page furniture the landing page (W10) and the app shell (W4) both need. Three surfaces, all fully
specified by the export, all static copy except the year and the system-status label.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §7.1-7.3, verbatim.

**MarketingFooter** (`ds--footers.html:5-55`)
- Shell: `background:#0E2350; border-radius:16px; overflow:hidden`.
- Upper: `padding:44px 40px 36px; display:grid;
  grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(0,1fr)); gap:36px`.
- Brand column: logo `height:30px; filter:brightness(0) invert(1)`; blurb
  `13.5px / 1.6 / #8FA3C7; max-width:240px`; social buttons 34×34 at `border-radius:9px`,
  `background:#16326E; color:#A9BADC`, hover `background:#1A2A4E; color:#FFFFFF`,
  `aria-label` `X` / `YouTube` / `LinkedIn`.
- Link columns (3): heading `12px / 700 / .08em / uppercase / #8FA3C7`; list `gap:11px;
  margin-top:16px`; link `13.5px / #C7D6F2`, hover `#FFFFFF`.
- Lower bar: `border-top:1px solid #1A2A4E; padding:18px 40px; display:flex; align-items:center;
  gap:20px; flex-wrap:wrap`; copyright `12.5px / #8FA3C7` = `© 2026 SchoolTest, Inc.`; legal links
  `12.5px / #8FA3C7`, hover `#FFFFFF`; language select at `margin-left:auto` (task 025 variant C).

**AppFooter** (`:57-66`)
- `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:20px 32px;
  display:flex; align-items:center; gap:20px; flex-wrap:wrap` (**no shadow**).
- Logo mark `height:22px`; copyright `12.5px / #94A3B8` = `© 2026 SchoolTest`; link cluster
  `gap:18px; margin-left:auto`, links `13px / 500 / #64748B`, hover `#2563EB`.
- Status indicator: `inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600;
  color:#15803D` with a 7px `#16A34A` dot; text `All systems operational` — **a status label bound
  to a system-health feed**.

**CookieBanner** (`:70-77`)
- `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:18px 22px;
  box-shadow:0 12px 32px rgba(14,35,80,.14); display:flex; align-items:center; gap:18px;
  flex-wrap:wrap`.
- Icon tile 38×38 at `border-radius:11px`, `background:#EFF5FF`, 17×17 info glyph `#2563EB`.
- Copy `flex:1; min-width:220px; font-size:13px; line-height:1.55; color:#475569` + inline link.
- Buttons: `Only essential` outline (`8px 15px`, radius 9px) and `Accept all` navy
  (`9px 16px`, radius 9px, hover `#16326E`).

## Design source

Tokens: navy shell `bg-navy-900`, social `bg-navy-800` → hover `--color-secondary` dark
(`#1A2A4E`), blurb/heading `--color-navy-muted` (`#8FA3C7`), links `--color-navy-body`
(`#C7D6F2`) → white; app footer `bg-card`/`border-border`/`--radius-2xl`/`shadow-none`; status
`text-success-strong` + `bg-success` dot; cookie shadow `--shadow-toast` (`0 12px 32px … / .14`).
Type `--font-size-label` (13.5px), `--font-size-caption` (12.5px), `--font-size-caption-lg` (13px),
`--font-size-eyebrow` (12px) at `--tracking-group` (.08em).

Motion: link and social-button colour/background transitions at 150ms `ease-out-quart` (the export
declares none — D-DESIGN-3). The cookie banner enters with `st-toast-in` (250ms translateY + fade)
and leaves with a 150ms fade-out. Reduced-motion from W0.

## Files

- `marketing-footer.tsx`, `app-footer.tsx`, `cookie-banner.tsx` — all **new** in
  `src/modules/design-system/components/`.
- `types/brand.types.ts` — `FooterLinkGroup`, `MarketingFooterProps`, `AppFooterProps`,
  `CookieBannerProps`.
- showcase `brand-section.tsx`; `tests/e2e/ds-footer.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **025** — the language select (variant C).
- **020** — the cookie-banner buttons.
- **039** — the navy surface conventions and the white-logo filter.

## Steps

1. `<footer>` landmark with a real heading structure for the link columns
   (`<h2 class="sr-only">` or visible column headings marked up as headings).
2. Internal links use `Link` from `@/i18n/navigation`; external social links get
   `rel="noopener noreferrer"` and an `aria-label`.
3. Year is `new Date().getFullYear()` — a non-deterministic call, so any cached Server Component
   rendering it must call `connection()` from `next/server` first (`CLAUDE.md` §5 pitfall 21).
   Prefer computing it in a client leaf or passing it in.
4. **Status indicator**: `All systems operational` is bound to a system-health feed in the design.
   **No such endpoint exists in this repo** — so the status block takes a `status` prop and the app
   footer does **not** render it unless a caller supplies real data. Hard-coding "All systems
   operational" would be invention (D-SCOPE-1 §4). Record this in Evidence.
5. Cookie banner: consent state persists in `localStorage` via a Zustand store with
   `persist` + `partialize` if W10 mounts it; this task ships the presentation and the
   `onAccept`/`onEssentialOnly` callbacks only.
6. i18n every string, all six catalogs, including the three social `aria-label`s.
7. E2E.

## Project rules

- `CLAUDE.md` law 8, law 14, law 15; §5 pitfall 21 (`Date` in cached components).
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (no raw hex; `filter:
  brightness(0) invert(1)` for the white logo is a static utility, not an animation);
  `.claude/rules/quality.md` (`<footer>` landmark, `next/image`, external-link rel, contrast on
  navy); `.claude/rules/i18n.md` (locale-aware links, no concatenated copyright);
  `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-footer.spec.ts` asserts on `/design-system`:
  - the marketing footer is `--color-navy-900` at 16px radius with a 4-column grid at 1280px and
    one column at 375px;
  - the logo is knocked out white (`filter` contains `invert(1)`) and has a non-empty `alt`;
  - all three social links have `aria-label`s and `rel="noopener noreferrer"`;
  - link hover transitions colour to white over 150ms;
  - the app footer has `box-shadow: none` and its link cluster sits at the row end;
  - the status indicator is **absent** when no `status` prop is passed, and renders with a dot +
    text when one is;
  - the cookie banner enters with a non-`none` 250ms animation and its two buttons fire the right
    callbacks.
- Contrast: `#8FA3C7` and `#C7D6F2` on `#0E2350` both measured and recorded (≥4.5:1).
- Motion `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: the cookie banner's buttons drop below the copy (its `min-width:220px` + `flex-wrap`),
  the footer stacks, no horizontal overflow; 1280px matches the design grid.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `landing.spec.ts`, `landing-aria.spec.ts` and `design-system.spec.ts` (footer locale toggle
  en→zh→en) still green.

## Assumptions

- The system-status label is prop-driven and omitted by default — there is no health endpoint in
  this repo and inventing "All systems operational" would be a fabricated status.
- Cookie-consent persistence is W10's decision; this task ships callbacks only.

## Evidence
