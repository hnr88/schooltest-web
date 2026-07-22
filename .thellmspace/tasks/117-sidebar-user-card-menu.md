---
id: 117
title: Rail user card — the design's #F4F6FA account card, carrying the existing user menu and Sign out
layer: ui
kind: build
slice: The rail footer: identity card (avatar + name + role) that is also the user-menu trigger
target: src/modules/shell/components/SidebarUserCard.tsx (new), src/modules/shell/components/AppSidebar.tsx, src/modules/shell/components/UserMenu.tsx, src/modules/shell/components/SidebarPromoPanel.tsx (deleted), src/i18n/messages/*.json
contract: n/a — presentation + preserved auth behaviour; design spec quoted below
design: .qa/design/screens/portal--detached-sidebar.html:24-30, .qa/design/spec/01-portal-dashboard.md#12-detached-sidebar--portal--detached-sidebarhtml231
status: TODO
depends_on: ["111"]
---

## Objective

Replace the rail footer's navy "Linked children / Add a child" promo panel (a mission-2 artefact
taken from the `app--parent-overview` variant, which is NOT this wave's composition) with the
detached design's account card, and make that card the trigger for the EXISTING user menu so the
Sign-out behaviour four e2e specs depend on survives verbatim.

## Contract

n/a for presentation. `portal--detached-sidebar.html:24-30`, verbatim:

```
card:   margin-top:14px; background:#F4F6FA; border-radius:16px; padding:12px 14px;
        display:flex; align-items:center; gap:11px
avatar: 36×36; border-radius:999px; background:#0E2350; color:#fff;
        display:grid; place-items:center; font-weight:600; font-size:13px; flex:none; glyph "M"
stack:  display:flex; flex-direction:column; gap:1px; min-width:0
name:   "Maria Rodriguez" — 13.5px / 600 / #0E2350
role:   "Parent account"  — 12px / 400 / #7C8698
No chevron, no menu, no logout affordance in the markup.
```

**BEHAVIOUR THAT MUST SURVIVE (this is the load-bearing half of the task):**

- The trigger keeps the accessible name `Shell.topbar.userMenuLabel`. **Do not rename that key** —
  `tests/e2e/shell.spec.ts:220`, `tests/e2e/dashboard.spec.ts:104,143`,
  `tests/e2e/change-password.spec.ts:81`, `tests/e2e/forgot-reset.spec.ts:151` and
  `tests/e2e/a11y-auth.spec.ts:433` all resolve the trigger by it. Its namespace now lies about
  where the chip lives; a comment records why the name is kept.
- The menu keeps both items: `Shell.userMenu.settings` (→ `/dashboard/settings`) and a destructive
  `Shell.userMenu.signOut` that calls `logout()` then `router.replace('/sign-in')` and leaves
  `localStorage['app.auth.token']` **null**.
- `a11y-auth.spec.ts`'s forward-focus-order test expects the user-menu trigger to be reached before
  the page's "Add student" link. The rail is DOM-first, so a footer trigger still precedes main
  content (≈8 tabs in, well inside the helper's 30-tab budget) — verify it, do not assume it.
- The `<Skeleton>` placeholder while `user` is undefined stays (no layout jump, no null render).

## Design source

| Property | Design value | Token / utility |
|---|---|---|
| card surface | `#F4F6FA` | `--color-rail-card` (task 110) → `bg-rail-card` |
| card radius | `16px` | `--radius-panel` (1rem) → `rounded-panel` |
| card padding | `12px 14px` | `py-3 px-3.5` |
| card gap | `11px` | `gap-2.75` |
| card top margin | `14px` | `mt-3.5` |
| avatar | `36×36`, round, `#0E2350` fill, `13px/600` white glyph | `size-9 rounded-full bg-navy-900 text-caption font-semibold text-sidebar-primary-foreground grid place-items-center` (`--text-caption` = 0.8125rem = 13px) |
| name | `13.5px / 600 / #0E2350` | `text-body-sm font-semibold text-foreground truncate` (`--text-body-sm` = 0.84375rem) |
| role | `12px / 400 / #7C8698` → **ink REJECTED** | `text-xs font-normal text-sidebar-foreground` — see below |
| stack | `gap:1px; min-width:0` | `flex flex-col gap-px min-w-0` |

**Authored a11y correction:** the design's role ink `#7C8698` on the card's `#F4F6FA` measures
**3.39:1**; even `--color-muted-foreground` (`#64748B`) only reaches **4.40:1** on that surface, so
both fail AA for 12px text. Use `--color-sidebar-foreground` (`#475569`) → **7.00:1**. Name ink
`#0E2350` on `#F4F6FA` = **14.12:1** ✓. Record both measurements in the component comment.

**Authored affordance:** the design draws no menu. The app has one and it is the only sign-out
path. The card therefore becomes a `<button>` (the `DropdownMenuTrigger`) with:
`w-full text-left`, `hover:bg-muted`, `transition-colors duration-200 ease-out-expo
motion-reduce:transition-none`, `focus-visible:ring-2 focus-visible:ring-sidebar-ring
focus-visible:outline-none`, and a `ChevronDown` (`size-4 text-sidebar-foreground`,
`group-data-popup-open:rotate-180`, `transition-transform duration-200 ease-out-expo`) pinned right
with `ml-auto` — the smallest possible signal that the card opens something. Card height
`12+36+12 = 60px` clears the 44px target with no `::after` idiom needed.

Menu surface: keep the existing `DropdownMenuContent align="end" className="w-50"`; change `align`
to `"start"` and add `side="top"` so it opens UP over the rail instead of off the bottom edge.
Entrance uses the design system's `st-pop-in` (180ms, `--ease-out-quart`) → `animate-pop-in
motion-reduce:animate-none`.

**Collapsed rail:** hide the text stack and the chevron
(`group-data-[collapsible=icon]:hidden`), keep the 36px avatar centred, keep the card as the
trigger, keep the accessible name. Do NOT hide the whole card — sign-out must stay reachable on the
icon rail.

## Files

- **new** `src/modules/shell/components/SidebarUserCard.tsx` — the card markup + the dropdown; a
  dumb component (props: none; it reads `useAuth()` exactly as `UserMenu` does today). ≤120 lines.
- `src/modules/shell/components/UserMenu.tsx` — either becomes the card (rename the file's
  responsibility) or is deleted and its menu body moved into `SidebarUserCard`. Pick ONE; do not
  leave a second, unused user chip in the tree.
- `src/modules/shell/components/AppSidebar.tsx` — `SidebarFooter` renders `<SidebarUserCard />`;
  remove the `useStudentsQuery()` call and the `childCount` prop wiring ONLY IF no other consumer
  in this file needs it (the `myChildren` count badge does — keep the query, drop nothing else).
- **delete** `src/modules/shell/components/SidebarPromoPanel.tsx`.
- `src/modules/shell/index.ts` — barrel stays exporting `AppSidebar`/`AppTopbar`; add nothing new
  unless another module imports the card (it must not).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — ONE new key: `Shell.sidebar.accountRole`
  (en: `Parent account`), in all six catalogs with identical shape.

## Depends on

- **111** — the footer's `px-4 pb-4` padding must be the design's before the card's `mt-3.5` reads
  correctly.

## Steps

1. Read `UserMenu.tsx` and `use-auth.ts` first: `logout()` clears the token, nulls and removes
   `['auth','me']`, then `router.refresh()`. That behaviour is copied verbatim, not re-derived.
2. Build `SidebarUserCard.tsx` with the geometry table above; reuse `getUserInitials()` from
   `src/modules/shell/lib/user-initials.ts` (do not re-implement it), and render the avatar as the
   design's own 36px navy circle rather than `PresenceAvatar` (whose fallback is hard-wired to
   `bg-blue-100 text-navy-900` and cannot be overridden from the root's className).
3. Mount it in `SidebarFooter`; delete `SidebarPromoPanel.tsx` and its import.
4. Add `Shell.sidebar.accountRole` to all six catalogs (English fallback for the five non-en per
   `D17`, unless a real translation is already carried for the same phrase elsewhere).
5. Confirm an entry point to `/dashboard/children/new` still exists on `/dashboard/children`
   (`ChildrenRosterSummary`) and on `/dashboard` (`DashboardGreeting`) — the promo CTA was one of
   seven, and removing it must not orphan the add-child route.
6. `pnpm tsc --noEmit && pnpm lint`.
7. Extend `shell.spec.ts`'s user-menu test rather than writing a new file.

## Project rules

- `.claude/rules/module-pattern.md` — component ≤120 lines, no business logic in the component,
  hooks from `hooks/`, no cross-module reach-in (import `useAuth` from `@/modules/auth`'s barrel).
- `.claude/rules/i18n.md` — six catalogs, identical key shape, PascalCase namespace + camelCase key.
- `.claude/rules/quality.md` — never `<div onClick>`; the card is a real `<button>`; modals/menus
  trap focus and close on Escape; AA contrast.
- `CLAUDE.md` §0 law 3 — never break existing logic; the sign-out path is asserted by four specs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/dashboard.spec.ts tests/e2e/change-password.spec.ts tests/e2e/forgot-reset.spec.ts tests/e2e/a11y-auth.spec.ts`
  ALL green — the four external sign-out/user-menu specs are the regression proof and are NOT edited.
- **Persistence/session proof:** click the card → click Sign out → `page.waitForURL('**/sign-in')`
  and `localStorage.getItem('app.auth.token')` is `null`; reload `/dashboard` and the guard still
  redirects to `/sign-in` (the cleared session survives a reload).
- New legs: card computes `background-color` = `rgb(244, 246, 250)` ±2, `border-radius: 16px`,
  `padding: 12px 14px`; avatar is 36×36 with `rgb(14, 35, 80)` fill; name/role computed ratios
  against the card ≥ 4.5 (log the real 14.12 / 7.00).
- Focus order: `a11y-auth.spec.ts`'s children focus-order test still reaches the trigger before the
  "Add student" link (run it, paste the output).
- Motion: menu content has a non-`none` `animation-name`; `none` under reduced motion. Card hover
  transition `0.2s`, `0s` under reduced motion.
- 375px: with the Sheet open the card is visible, ≥44px tall, and Sign out works from it (new
  mobile leg — sign-out must not become desktop-only).
- Collapsed rail: card still present, avatar centred, trigger still named, menu still opens.
- axe serious/critical = 0 at 1280 + 375 + Sheet-open.
- Six catalogs key-identical, 1152 keys each (1151 + `Shell.sidebar.accountRole`).

## Assumptions

- The design's glyph is a single initial (`M`); `getUserInitials()` yields up to two. Two is kept —
  it is the existing behaviour and disambiguates real families.
- The promo panel's "Linked children" count is not lost information: the same number renders as the
  `myChildren` nav count badge, which stays.

## Evidence

_(filled in as the task runs: computed styles, contrast numbers, e2e output for all five specs,
token null-after-signout reading)_
