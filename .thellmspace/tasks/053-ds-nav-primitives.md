---
id: 053
title: Build the navigation primitives — sidebar NavItem, topbar link and Breadcrumbs
layer: ui
kind: implement
slice: NavItem (active/default/hover/focus) + TopbarLink + Breadcrumbs
target: src/modules/design-system/components/nav-item.tsx, src/modules/design-system/components/breadcrumbs.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/data-section.tsx, tests/e2e/ds-nav-item.spec.ts
contract: n/a (presentation slice — design spec quoted below; the shell that composes these is W4)
design: .qa/design/screens/ds--navigation.html, .qa/design/spec/05-ds-components.md#5.1,#5.2,#5.3
status: TODO
depends_on: [001, 003, 004, 005, 007, 010, 013, 031, 038]
---

## Objective

W4 builds the app shell. This task builds the three link primitives it composes, so the shell task
is a layout job and not a styling job. Nothing here knows about routes — `href` and `isActive`
are props.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §5.1-5.3, verbatim:

**Sidebar nav item**
- active: `display:flex; align-items:center; gap:11px; font-size:14px; font-weight:600;
  color:#FFFFFF; background:#2563EB; padding:10px 12px; border-radius:10px;
  text-decoration:none` (**no transition on the active item**).
- default: same box but `font-weight:500; color:#475569; transition:background .12s`;
  hover `background:#F1F5F9; color:#0E2350`.
- Weight steps 500→600 between default and active; only `background` transitions, colour snaps.
- Icon 16×16, `stroke:currentColor; stroke-width:2`, round caps/joins.
- Trailing count badge (task 031, tonal): `margin-left:auto; min-width:20px; height:20px;
  padding:0 6px; border-radius:999px; background:#EFF5FF; color:#2563EB; font-size:11.5px;
  font-weight:700`.
- Divider: `height:1px; background:#EEF2F7; margin:10px 8px`.
- User block: `display:flex; align-items:center; gap:10px; margin:14px 8px 6px; padding-top:14px;
  border-top:1px solid #EEF2F7`; 34×34 avatar; name `13.5px / 600 / #0E2350` with
  `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` inside a `min-width:0` wrapper;
  role line `12px / #94A3B8`.

**Topbar link**
- active: `font-size:14px; font-weight:600; color:#0E2350; background:#F1F5F9; padding:8px 14px;
  border-radius:9px`.
- default: `font-weight:500; color:#475569`; hover `background:#F1F5F9; color:#0E2350`.
  **No transition declared here** (unlike the sidebar).

**Breadcrumbs**
- Row: `display:flex; align-items:center; gap:8px; font-size:13.5px`.
- Ancestor link: `color:#64748B; font-weight:500; text-decoration:none`; hover `color:#2563EB`.
- Separator: 13×13 chevron-right, `stroke:#CBD5E1; stroke-width:2.4`.
- Current page: `color:#0E2350; font-weight:600` — a `<span>`, **not** a link.

## Design source

Tokens: active `bg-sidebar-primary` (`#2563EB`) + `text-sidebar-primary-foreground`; default
`text-sidebar-foreground` (`#475569`), hover `bg-muted` + `text-foreground`; radius
`--radius-md` (10px) / 9px topbar; `--font-size-body-sm` (14px); divider `--color-rule`;
badge `bg-secondary` + `text-primary`; breadcrumb separator `text-input` (`#CBD5E1`),
`--font-size-label` (13.5px). Dark: `--color-sidebar` `#0E1830`, `--color-sidebar-foreground`
`#A9BADC`, `--color-sidebar-accent` `#1A2A4E` per §8.7.

Motion: nav item `transition-[background-color] duration-[--duration-row]` = **120ms**
`ease-out-quart` on the default item, exactly as declared; the active item gets a shared
`layoutId`-style sliding highlight — one absolutely-positioned pill translating between items over
180ms `ease-out-quart` (transform only). Topbar link gets the same 120ms transition even though
the export omits it (consistency; recorded). Reduced-motion from W0.

Focus-visible: authored from `--ring` (the export declares none); the ring must be visible against
both the white sidebar and the navy dark sidebar.

## Files

- `src/modules/design-system/components/nav-item.tsx` — `NavItem` (sidebar) + `TopbarLink`;
  both render `Link` from `@/i18n/navigation` when `href` is given.
- `src/modules/design-system/components/breadcrumbs.tsx` — wraps `Breadcrumb*` from
  `@/components/ui/breadcrumb` (read-only, already re-exported by `primitives/data.ts`).
- `types/primitives.types.ts` — `NavItemProps`, `TopbarLinkProps`, `BreadcrumbTrailProps`.
- showcase `data-section.tsx`; `tests/e2e/ds-nav-item.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **005** — the eight published type steps.
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **031** — the tonal count badge.
- **038** — the 34px avatar for the user block.

## Steps

1. Active state is `aria-current="page"` — never colour alone.
2. Internal links go through `Link` from `@/i18n/navigation`; a bare `<a>` for internal navigation
   is a rule violation (`.claude/rules/i18n.md`).
3. The user-block name truncates with ellipsis inside a `min-w-0` flex child; the full name is
   available via `title`/`aria-label`.
4. Breadcrumbs: `<nav aria-label="Breadcrumb">` + `<ol>`; the current page is
   `aria-current="page"` and is not a link.
5. The sliding active pill is measured from refs; no `window` at module scope.
6. i18n every nav label used in the showcase; six catalogs.
7. E2E.

## Project rules

- `CLAUDE.md` law 11 (`breadcrumb.tsx`, `sidebar.tsx` read-only), law 8, law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md`; `.claude/rules/i18n.md`
  (locale-aware `Link`); `.claude/rules/quality.md` (`aria-current`, focus, ≥44px targets,
  contrast on both sidebar themes); `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-nav-item.spec.ts` asserts on `/design-system`:
  - the active nav item has `aria-current="page"`, `--color-primary` fill, white text, weight 600;
  - a default item is weight 500 in `--color-sidebar-foreground` and hovers to `--color-muted`
    over **120ms**;
  - the count badge sits at the row end with the tonal pair;
  - the truncated user name shows an ellipsis at a 200px container and exposes the full name;
  - breadcrumbs render `<nav aria-label="Breadcrumb">` with an `<ol>`, chevron separators that are
    `aria-hidden`, and a non-link current page with `aria-current="page"`;
  - `Tab` shows a visible focus ring on both the light and `.dark` sidebar.
- Motion: the active pill's `transition-property` includes `transform` at 180ms; `0.01ms` under
  `reducedMotion: 'reduce'`.
- 375px: nav items are ≥44px tall and the label truncates rather than wrapping; 1280px matches the
  `minmax(220px,260px)` sidebar track.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `shell.spec.ts` and `shell-a11y.spec.ts` still green.

## Assumptions

- The sliding active pill is an addition; it degrades to an instant swap under reduced motion.
- W4 owns route wiring; this task ships no route knowledge.

## Evidence
