---
id: 113
title: Rail groups — "Manage" / "Account" overlines, 2px nav gap, and the flex spacer that pins Account to the bottom
layer: ui
kind: build
slice: The rail's grouping structure (two labelled groups separated by a flex spacer, replacing today's hairline divider)
target: src/modules/shell/components/AppSidebar.tsx, src/modules/shell/components/RailSectionLabel.tsx
contract: n/a — pure presentation; design spec quoted below
design: .qa/design/screens/portal--detached-sidebar.html:4,5,16,17, .qa/design/spec/01-portal-dashboard.md#12-detached-sidebar--portal--detached-sidebarhtml231
status: TODO
depends_on: ["111"]
---

## Objective

Replace the current "group label → items → hairline divider → group label → items" rail structure
with the design's: **Manage** overline + nav list at the top, a `flex:1` spacer, then the
**Account** overline + its items pinned above the user card. Delete the divider — the design has
none — and set the nav list's own geometry (`gap:2px`).

## Contract

n/a. `portal--detached-sidebar.html`, verbatim:

- line 4 (and identically line 17): `font-size:11px; font-weight:600; letter-spacing:.08em;
  text-transform:uppercase; color:#9AA6B8; padding:0 14px 8px` — text `Manage` / `Account`.
- line 5: `<nav style="display:flex;flex-direction:column;gap:2px">`.
- line 16: `<div style="flex:1"></div>` — "pushes the account block to the bottom".

**PRESERVED BEHAVIOUR:** the two labels keep their existing i18n keys
`Shell.sidebar.groups.manage` / `Shell.sidebar.groups.account` (already in all six catalogs — do
not rename, do not add). `shell.spec.ts` counts `aside.locator('nav a')` and expects **exactly 4**
links in catalog order (Overview, My children, Search, Settings) — the group split must not change
that count, that order, or move any link outside the `<nav>`. Both overlines stay hidden on the
collapsed rail (`group-data-[collapsible=icon]:hidden`).

## Design source

| Property | Design value | Token / utility |
|---|---|---|
| overline size | `11px` | `--text-micro` (0.6875rem) → `text-micro` |
| overline weight | `600` | `font-semibold` |
| overline tracking | `.08em` | `--tracking-rail` → `tracking-rail` |
| overline transform | uppercase | `uppercase` |
| overline ink | `#9AA6B8` → **REJECTED** | see below |
| overline padding | `0 14px 8px` | `px-3.5 pb-2` |
| nav item gap | `2px` | `gap-0.5` |
| spacer | `flex:1` | `flex-1` (`aria-hidden`, no content) |

**Authored a11y correction (record it, do not hide it):** the design's overline ink `#9AA6B8`
measures **2.46:1** on `#FFFFFF` — an 11px uppercase label is text and WCAG 2.2 AA needs 4.5:1.
Substitute `--color-muted-foreground` (`#64748B`, **4.76:1** on white), which is the design
system's own muted ink and is already what `RailSectionLabel` ships. Everything else (size, weight,
tracking, transform, padding) is the design's verbatim.

Motion: none on the labels (static text). The spacer is layout only.

## Files

- `src/modules/shell/components/AppSidebar.tsx` — remove the `aria-hidden` divider `<div>`; insert
  `<div aria-hidden="true" className="flex-1" />` between the two `SidebarMenu`s; set both
  `SidebarMenu` classNames to `gap-0.5`; make the `<nav>` `flex flex-col` with the Account block
  INSIDE the same `<nav>` (so the 4-link count stays a single `nav a` query).
- `src/modules/shell/components/RailSectionLabel.tsx` — set `px-3.5 pb-2` (design's `0 14px 8px`),
  keep `text-micro font-semibold tracking-rail text-muted-foreground uppercase` and the collapsed
  hide. Replace its stale comment with one citing `portal--detached-sidebar.html:4` and recording
  the `#9AA6B8 → #64748B` contrast substitution with the measured 2.46:1.

## Depends on

- **111** — the card's `pt-7 px-4 pb-4` padding and its flex column must exist before `flex-1` can
  push anything to the bottom.

## Steps

1. Edit `RailSectionLabel.tsx` (padding + comment). It stays a dumb presentational component.
2. Edit `AppSidebar.tsx`: delete the divider, add the spacer, set `gap-0.5` on both menus.
3. Verify the `<nav>` still wraps BOTH groups so `nav a` returns 4.
4. `pnpm tsc --noEmit && pnpm lint`.
5. Extend `shell.spec.ts`'s sidebar test: `[data-slot="nav-group-label"]` count = 2 with texts
   `cat(en,'Shell.sidebar.groups.manage')` / `.account`; the Account label's bounding-box `y` is
   greater than the last primary link's `y` + 100 (i.e. the spacer really pushed it down); the
   overline computes `font-size: 11px`, `letter-spacing: 0.88px`, `text-transform: uppercase`.

## Project rules

- `.claude/rules/i18n.md` — never hardcode a user-facing string; reuse the existing keys, do not
  invent `Shell.sidebar.groups.*` duplicates.
- `.claude/rules/quality.md` — WCAG AA 4.5:1 for body text; ordered semantics; the rail keeps one
  `<nav>`.
- `.claude/rules/module-pattern.md` — components stay dumb; 120-line component cap
  (`AppSidebar.tsx` is currently ~100 lines including comments — trim the stale block comment
  rather than growing the file).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts` green with the
  PRE-EXISTING 4-link count/label/href legs untouched.
- New legs pass (2 overlines, spacer geometry, computed 11px/.08em/uppercase).
- Contrast: a Playwright-computed ratio of the overline's `color` against `[data-slot="sidebar-inner"]`'s
  `background-color` is `>= 4.5`.
- 375px: inside the open Sheet both overlines render and the Account group sits below the primary
  group (same assertions, mobile viewport).
- axe serious/critical = 0 at 1280 and 375 incl. Sheet-open.
- No new strings → six catalogs unchanged at 1151 keys.

## Assumptions

- The Account group holds exactly one link today (Settings). The design also lists **Billing**,
  which is BLOCKED — see task 116; this task must NOT add a Billing entry.

## Evidence

_(filled in as the task runs)_
