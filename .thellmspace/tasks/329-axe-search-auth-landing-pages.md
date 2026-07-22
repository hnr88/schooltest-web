---
id: 329
title: axe — zero serious/critical on unified search (incl. map), the five auth screens, landing, 404 and /design-system
layer: a11y
kind: verify
slice: Automated accessibility gate for the search surface and the whole unauthenticated surface
target: tests/e2e/axe-search-auth-landing.spec.ts (new); markup fixes in src/modules/{unified-search,school-search,agent-search,search-shared,auth,landing,design-system}/**
contract: n/a
design: .qa/design/spec/06-auth-states-landing.md, .qa/design/spec/05-ds-components.md, .qa/design/spec/04-ds-foundations.md#unknowns
status: TODO
depends_on: ["324", "326"]
---

## Objective

Run `@axe-core/playwright` over unified search (both modes, filter overlay, map, mobile sheet),
all five auth screens, the Google callback error state, the landing page, the 404 and the
`/design-system` gallery at 375px and 1280px, and require **zero serious and zero critical
violations**. The map and the two search inputs are the highest-risk markup in the mission — the
design explicitly sets `outline:none` on both search inputs.

## Contract

n/a. Binding rules — `.claude/rules/quality.md` WCAG AA, plus `.qa/PLAN.md` finding 2 quoted:

> The design has no focus states at all and explicitly sets `outline:none` on both search inputs.
> WCAG 2.2 AA and `.claude/rules/quality.md` both require visible focus. Focus rings are
> therefore authored from the design's own `--ring` token. Fixing the markup, never suppressing
> the rule.

**Pre-existing exemption to close, not inherit** — `.qa/DECISIONS.md` **D22**(1) records a
systemic 44px tap-target shortfall on `/design-system` and across the dashboard, logged but not
asserted, and explicitly "flagged here for a future dedicated a11y-hardening task". Task **331**
is that task; this one must not re-introduce a suppression. The `(see D22)` comment in
`tests/e2e/a11y-responsive.spec.ts:117` is resolved or removed by 331, not by a filter here.

## Design source

- Search input (`05-ds-components.md:440`): `padding:9px 13px 9px 36px; border-radius:10px;
  border:1px solid #CBD5E1` → `--color-input`; `font-size:13.5px`; **`outline:none`** in the
  design — replaced by `:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px }`
  with `--color-ring: oklch(0.5461 0.2152 262.88 / 0.35)`, plus the design's own
  `border-color: var(--color-primary)` + `box-shadow: 0 0 0 3px rgba(37,99,235,.16)`.
- Auth inputs (`05-ds-components.md:670`): `padding:10px 13px; border-radius:10px;
  border:1px solid #CBD5E1`; focus `border-color:#2563EB` + `box-shadow: 0 0 0 3px rgba(37,99,235,.16)`.
- Filter chip: unselected border `#D8DFEA` → `--color-input`, text `#3D4A5C` → `--color-body`
  (4.5:1 on white — must be asserted); selected `background #0E2350` → `--color-navy-900` with
  `--color-primary-foreground` text.
- Map: Leaflet renders its own DOM. Every pin/cluster must be a real focusable control with an
  accessible name from the catalog (school name + suburb), the tile layer must be
  `aria-hidden`/presentational, and the Map/List toggle must be a labelled control — not a
  `<div onClick>`.
- Ghost-foreground ambiguity (`04-ds-foundations.md` UNKNOWN 17): `#16326E` on the buttons board
  vs `#64748B` in the warning alert. Resolve to `--color-secondary-foreground`
  `oklch(0.3341 0.1099 263.00)` (#16326E) for ghost text, since `#64748B` at 12.5px fails 4.5:1
  on `--color-warning-soft`. Record the resolution.

## Files

- `tests/e2e/axe-search-auth-landing.spec.ts` (new)
- Markup fixes at the call site: `src/modules/unified-search/**`, `src/modules/school-search/**`,
  `src/modules/agent-search/**`, `src/modules/search-shared/**`, `src/modules/auth/components/**`,
  `src/modules/landing/**`, `src/modules/design-system/components/**`,
  `src/app/[locale]/**` page files
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` for any new accessible name
- Never `src/components/ui/**`

## Depends on

- **324** and **326** — those sweeps deliver the final markup for these pages.
- Wave gate (prose): **W8 (230-253)** and **W10 (290-313)** DONE; the primitives come from
  **W1 (020-057)**.

## Steps

1. Write the spec with `AxeBuilder`. No `disableRules`, no app-markup `exclude()`, no filter
   beyond the serious/critical impact threshold.
2. At **1280×800** and **375×812**, `analyze()` and assert zero serious/critical on:
   - `/dashboard/search?mode=schools` (authed) — list state
   - the same with the **filter overlay/sheet open**
   - the same with the **map expanded / Map view active**
   - `/dashboard/search?mode=agents`, and with its filter overlay open
   - `/dashboard/search` **empty-results** state (a query that returns 0 rows)
   - `/dashboard/search` **error** state (intercepted 500 → Alert + retry)
   - `/` (landing)
   - `/sign-in`, `/sign-in?error=google`, `/sign-in?error=session`, `/sign-in?confirmed=1`
   - `/sign-up`, and its check-email confirm state
   - `/forgot-password`, and its sent state
   - `/reset-password` with a garbage `?code=` (error state)
   - `/auth/google/callback` with no query (error state)
   - a 404 route
   - `/design-system` (the full gallery — every showcase section rendered)
3. Also scan `/zh`, `/zh/sign-in`, `/zh/design-system` and `/zh/dashboard/search`.
4. Beyond axe, assert programmatically:
   - both search inputs have a visible `:focus-visible` outline (`outlineColor` non-transparent,
     `outlineWidth >= 2px`) — this is the specific thing the design removed;
   - every map pin/cluster is focusable with a non-empty accessible name, and the tile layer is
     not announced;
   - the Map/List toggle, every sort menu and every filter chip are real controls with
     `aria-pressed`/`aria-selected` where they are stateful;
   - the mobile filter Sheet and mobile map Sheet trap focus and close on `Escape`, returning
     focus to their trigger;
   - one `<h1>` per page and an ordered heading sequence.
5. Fix every violation in the markup at the module call site. Never a rule disable, never an
   `aria-hidden` on interactive content, never a results filter.
6. Re-run until clean twice in a row.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 12, 15; §5 pitfall 13 (`<Link>` from
  `next-intl/navigation`, never a bare `<a>` for internal nav) and pitfall 14 (`window` at
  module top level — the Leaflet layer).
- `.claude/rules/quality.md` — WCAG AA, focus rings, focus traps, `next/image` with
  width/height or fill, `priority` on the landing LCP image.
- `.claude/rules/i18n.md` — every accessible name is a catalog key in all six locales.
- `.claude/rules/tailwind.md` — contrast fixes move to a different OKLCH `@theme` token, never
  an arbitrary value.
- `.claude/rules/testing.md`, D-VERIFY-1. `.qa/DECISIONS.md` D22.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/axe-search-auth-landing.spec.ts` passes with **zero**
  serious and **zero** critical violations on every scan in step 2 and step 3 — that is ≥ 40
  scans (20 surfaces × 2 widths) plus the four zh scans.
- The spec contains no `disableRules`, no app-markup `exclude()`, no allow-list — verified by
  grepping the spec.
- Both search inputs prove a visible `:focus-visible` outline in the real DOM (the design's
  `outline:none` is confirmed **not** shipped).
- Every map pin/cluster focusable with a catalog-derived accessible name; the tile layer not
  announced; both mobile Sheets trap focus and close on `Escape`.
- `tests/e2e/a11y-responsive.spec.ts`, `a11y-auth.spec.ts`, `school-map.spec.ts`,
  `design-system.spec.ts`, `design-system-zh.spec.ts`, `landing.spec.ts`, `landing-aria.spec.ts`
  all still pass in the same run.
- Any string added exists in all six catalogs, key-identical.
- Zero banned-pattern grep hits; no file under `src/components/ui/` in the diff.

## Assumptions

- The schools corpus contains a query that legitimately returns zero rows, so the empty state is
  reachable without mocking the response. If not, the empty-state scan uses a `page.route`
  fulfilment with the **real** contracted empty envelope
  (`{ data: [], meta: { pagination: { page:1, pageSize:12, pageCount:0, total:0 } } }`) and says
  so in Evidence — that is a rendering fixture for a state the API really produces, not a faked
  metric.

## Evidence

<!-- filled in as the task runs -->
