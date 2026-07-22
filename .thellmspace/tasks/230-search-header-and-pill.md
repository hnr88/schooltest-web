---
id: 230
title: Re-skin the Find-a-school header band and the 48px search pill to the design
layer: ui
kind: implement
slice: The `/dashboard/search` header row — h1, sub-line, rounded search pill, Search button
target: src/modules/unified-search/components/UnifiedSearchScreen.tsx, src/modules/unified-search/components/UnifiedSearchBar.tsx, src/i18n/messages/{en,zh,ko,ms,vi,th}.json
contract: C-UI-SEARCH-UNIFIED (existing), C-SEARCH-SCHOOLS (read path unchanged)
design: .qa/design/screens/portal--main.html lines 150-160 · .qa/design/spec/01-portal-dashboard.md#8.1
status: TODO
depends_on: []
---

## Objective

The search surface opens with the design's header row instead of the current generic page
header: title + sub-line on the left, a single white pill containing the magnifier, the input
and a navy "Search" button on the right. Behaviour — the debounced binding to the active pane
store's `q` — is preserved exactly.

## Contract

Pure presentation over an existing wire. No HTTP contract changes: the field keeps writing the
active store's `q` through `useUnifiedSearchField` (300 ms debounce, render-phase reconcile so a
store reset blanks the field), which keeps feeding `POST /api/search/schools` /
`POST /api/search/agents` exactly as today. `?mode=` stays the only URL-synced state
(`useSearchModeSync`).

Design spec quoted (`01-portal-dashboard.md` §8.1):

> Row: `display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap`.
> `<h1>` **"Find a school"** — `margin:0; font-size:30px; font-weight:500; letter-spacing:-0.02em; color:#0E2350`.
> Sub-line: `margin:6px 0 0; font-size:14px; color:#7C8698`.
> Search pill: `display:flex; align-items:center; gap:10px; background:#FFFFFF; border-radius:999px;
> height:48px; padding:0 8px 0 20px; width:360px; box-shadow:0 1px 2px rgba(14,35,80,.05)`.
> Search button: `height:36px; padding:0 18px; border-radius:999px; background:#0E2350; color:#fff;
> font-size:13px; font-weight:600`, `style-hover="background:#16326E"`.

## Design source

`.qa/design/screens/portal--main.html:150-160`. Exact values and the token each maps to:

| Element | Design value | Implementation |
|---|---|---|
| Header row | flex, `align-items:flex-end`, `justify-content:space-between`, gap 20px, wrap | `flex flex-wrap items-end justify-between gap-5` |
| `<h1>` | 30px / 500 / `-0.02em` / `#0E2350` | `text-[--text-search-title]`-free: use `text-h3`-adjacent step — declare `--text-search-title: 1.875rem` (30px), `--text-search-title--line-height: 1.2`, `--text-search-title--letter-spacing: -0.02em` in the `@theme inline` block of `src/app/globals.css`; colour `text-navy-900` (`--color-navy-900`, `oklch(0.2692 0.0871 263.0388)`, design `#0E2350`); weight `font-medium` |
| Sub-line | 14px / `#7C8698`, `margin-top:6px` | `mt-1.5 text-body-sm text-body` — **NOT** the design hex: `#7C8698` is **3.67:1** on white and **3.24:1** on the `#EEF1F6` page well, below the 4.5:1 body minimum in `.claude/rules/quality.md`. `--color-body` (`#475569`) is 7.58:1 / 6.69:1 |
| Pill | white, r999, h48, `padding:0 8px 0 20px`, w360, `0 1px 2px rgba(14,35,80,.05)` | `h-12 w-90 rounded-full bg-card pr-2 pl-5 shadow-sm` (`--shadow-sm` is already `0 1px 2px oklch(0.2692 0.0871 263.0388 / 6%)`) |
| Magnifier | 16×16, `stroke:#7C8698` | lucide `Search` `className="size-4 text-muted-foreground"` |
| Input | 14px, `color:#0E2350`, borderless, `outline:none` | `text-body-sm text-navy-900 border-0 bg-transparent`; **do not port `outline:none`** — see Steps 4 |
| Search button | h36, `0 18px`, r999, `#0E2350`, white, 13/600, hover `#16326E` | `h-9 rounded-full bg-navy-900 px-4.5 text-meta font-semibold text-primary-foreground hover:bg-navy-800` |

Motion (D-DESIGN-3; the design declares hover with no duration): button and pill animate
`background-color` / `box-shadow` over `150ms` `var(--ease-out-expo)`
(`transition-colors duration-150 ease-out-expo`), plus `active:scale-95` on the button; every
one carries `motion-reduce:transition-none motion-reduce:active:scale-100`. The pill mounts with
the existing `animate-in fade-in slide-in-from-bottom-1 duration-300` (already on
`UnifiedSearchBar`) — keep it, keep its `motion-reduce:animate-none`.

375px: the row wraps (it already has `flex-wrap`), the pill becomes `w-full` below `sm`
(`w-full sm:w-90`) and the Search button stays inside it at 36px so the pill never overflows.

## Files

- `src/modules/unified-search/components/UnifiedSearchScreen.tsx` (header band markup)
- `src/modules/unified-search/components/UnifiedSearchBar.tsx` (pill + button)
- `src/app/globals.css` (`--text-search-title` step only; no new colour tokens)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` (`UnifiedSearch.searchAction`)

## Depends on

Nothing inside W8. Requires the W0 `@theme` foundation and the W1 button/input primitives to be
landed (wave-level, per `.qa/PLAN.md`); it consumes only tokens that already exist in
`src/app/globals.css` today, so it cannot be blocked by them.

## Steps

1. Add the `--text-search-title` type step to `@theme inline` in `src/app/globals.css`.
2. Rewrite the `<header>` in `UnifiedSearchScreen.tsx`: `h1` keeps `t('titleSchools')` /
   `t('titleAgents')` (both catalog keys already exist and `unified-search.spec.ts:190,198`
   asserts them, including in `zh`) — only its classes change.
3. Rebuild the pill in `UnifiedSearchBar.tsx` around the existing `InputGroup`/`InputGroupInput`
   so `aria-label={placeholder}` (the `school-map.ts` helper resolves the field by
   `UnifiedSearch.searchPlaceholderSchools`) and the clear button survive untouched.
4. Add the Search button. It submits the current field value immediately (calls the same store
   setter the debounce would) — the design binds no handler, but a button that does nothing is
   not "only add design that is functional" (D-SCOPE-1). New key
   `UnifiedSearch.searchAction: "Search"` in all six catalogs.
5. Visible focus: `focus-within:ring-2 focus-within:ring-ring` on the pill and
   `focus-visible:ring-2 focus-visible:ring-ring` on the button. The design sets `outline:none`
   with nothing replacing it (`.qa/design/spec/01-portal-dashboard.md` UNKNOWNS) — WCAG 2.2 AA
   and `.claude/rules/quality.md` require a visible ring, so the ring is authored from `--ring`.
6. Run the seven W8 regression specs.

## Project rules

`schooltest-web/CLAUDE.md` §0.3 (never break existing logic), §0.11 (never edit
`src/components/ui/*` — wrap), §0.15 (no unsolicited comments).
`.claude/rules/tailwind.md`: OKLCH only, **no arbitrary values** (`w-[360px]`, `text-[30px]`,
`#0E2350` are all failures — use the token/utility), animate transform + opacity (colour
transitions are the documented exception in `.qa/design/spec/04-ds-foundations.md` §I).
`.claude/rules/i18n.md`: no hardcoded user-facing string; six catalogs key-identical.
`.claude/rules/quality.md`: one `<h1>` per page; 4.5:1 body contrast; visible focus.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright (new spec `tests/e2e/search-header.spec.ts`): at 1280×800 on `/dashboard/search`,
  `getByRole('heading', { level: 1, name: cat(en,'UnifiedSearch.titleSchools') })` is visible and
  `getComputedStyle` reports `font-size: 30px`, `font-weight: 500`, `letter-spacing: -0.6px`;
  the Search button's computed `background-color` equals the `--navy-900` OKLCH resolved value
  and changes on hover.
- Typing "Abbotsleigh" in the pill still produces exactly ONE `POST /api/search/schools` after
  the 300 ms debounce and one `[data-slot="school-card"]` (guards the preserved wiring).
- `tests/e2e/unified-search.spec.ts`, `unified-search-states.spec.ts`, `school-map.spec.ts`,
  `school-filter-panel.spec.ts`, `school-search-presentation.spec.ts`, `dashboard-search.spec.ts`,
  `agent-search-polish.spec.ts` all still pass.
- At 375×812 the pill is full-width, the header does not scroll horizontally, and the Search
  button's box is ≥ 36px tall.
- `page.emulateMedia({ reducedMotion:'reduce' })` → no transition on the button
  (`transition-property: none`).
- axe: zero serious/critical on `/dashboard/search` at both widths.
- All six catalogs contain `UnifiedSearch.searchAction`; key sets are identical.
- Grep the diff: zero raw hex, zero `[` arbitrary values, zero `any`, zero `<div onClick>`.

## Assumptions

The design's `<h1>` is 30px here vs 32px on the dashboard (noted verbatim in §8.1); 30px is used
because this task implements §8.1. The sub-line's copy is owned by task 231, not this task.

## Evidence

_(filled in as the task runs)_
