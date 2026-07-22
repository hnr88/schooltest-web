---
id: 110
title: Portal shell frame — 24px detached gutter, 1600px cap, and the four @theme tokens the shell is missing
layer: ui
kind: build
slice: The dashboard shell's OUTER FRAME — the flex frame that holds the detached sidebar card and the scrolling main column
target: src/app/globals.css (@theme + :root), src/app/[locale]/dashboard/layout.tsx
contract: n/a — pure presentation; the design spec is quoted below in place of a contract
design: .qa/design/spec/01-portal-dashboard.md#11-outer-frame--parent-portaldchtml25, .qa/design/screens/portal--detached-sidebar.html:2, .qa/design/spec/04-ds-foundations.md#tailwind-v4-mapping
status: TODO
depends_on: []
---

## Objective

Turn `/dashboard/*`'s shell frame from the current edge-to-edge "attached rail + white
64px bar" into the design's **detached composition**: a `#EEF1F6` page well, a 24px gutter on
every side, a 24px gap between the sidebar card and the main column, centred with a 1600px cap,
exactly `100svh` tall with only the main column scrolling. This task delivers the FRAME and the
four `@theme` tokens every later W4 task consumes. It does not restyle the sidebar's interior
(111-117) or the top row (118-121).

## Contract

n/a. The binding text is `.qa/design/spec/01-portal-dashboard.md` §1.1, quoted verbatim:

```
display:flex; gap:24px; padding:24px; height:100vh; box-sizing:border-box;
max-width:1600px; margin:0 auto
Page background: body { margin:0; background:#EEF1F6 }
Two children: the detached <aside> (fixed 248px) and <main> (flex:1).
```
and §1.3: `<main>` is `flex:1; min-width:0; display:flex; flex-direction:column; overflow-y:auto`.

**PRESERVED BEHAVIOUR (must still be true after this task):** `ParentGuard` still wraps every
`/dashboard/*` route exactly once; `--sidebar-width` is still `248px`; `tests/e2e/shell.spec.ts`'s
`expect([data-slot="sidebar"]).toHaveCSS('width','248px')` and the 48px collapsed reading still
pass; `tests/e2e/dashboard.spec.ts`'s "no horizontal scroll at 375" leg still passes.

## Design source

`portal--detached-sidebar.html:2` + `Parent Portal.dc.html:25`, values and the token each maps to
(`04-ds-foundations.md` TAILWIND V4 MAPPING §A-J):

| Design value | Hex | Token to use / add | Utility |
|---|---|---|---|
| page well | `#EEF1F6` | **retarget** `--color-surface-well` to `oklch(0.9573 0.0074 260.73)` | `bg-surface-well` |
| frame padding 24px | — | 4pt scale | `p-6` (`max-md:p-4` = 16px, authored — see Assumptions) |
| frame gap 24px | — | 4pt scale | `gap-6` |
| frame max-width 1600px | — | **add** `--container-portal: 1600px` | `max-w-portal mx-auto` |
| frame height 100vh | — | — | `h-svh` (svh, not vh — mobile URL bar) |
| sidebar card radius 24px | — | **add** `--radius-panel-lg: 1.5rem` | `rounded-panel-lg` |
| sidebar card shadow | `0 1px 2px rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06)` | **add** `--shadow-panel` | `shadow-panel` |
| search pill / bell shadow | `0 1px 2px rgba(14,35,80,.05)` | **add** `--shadow-pill` | `shadow-pill` |
| rail user-card surface | `#F4F6FA` | **add** `--color-rail-card: oklch(0.9728 0.0057 264.53)` | `bg-rail-card` |

Exact CSS to emit in the `@theme` block (navy tint `oklch(0.2692 0.0871 263.0388)` = `#0E2350`,
already the file's shadow tint):

```css
--container-portal: 1600px;                 /* Parent Portal.dc.html:25 max-width:1600px */
--radius-panel-lg: 1.5rem;                  /* 24px — portal--detached-sidebar.html:2 */
--shadow-panel:
  0 1px 2px oklch(0.2692 0.0871 263.0388 / 4%),
  0 8px 32px oklch(0.2692 0.0871 263.0388 / 6%);   /* aside box-shadow */
--shadow-pill: 0 1px 2px oklch(0.2692 0.0871 263.0388 / 5%); /* portal--main.html:13,17 */
--color-rail-card: oklch(0.9728 0.0057 264.53);    /* #F4F6FA — rail user card */
```
and retarget the existing bespoke token in place, keeping its name so no consumer moves:
`--color-surface-well: oklch(0.9573 0.0074 260.73); /* #EEF1F6 — portal page well */`
(was `oklch(0.9595 0.008 253.8534)` = `#EEF2F7`; ΔL 0.2%, no consumer changes meaning).

Contrast proof for the retarget: `#0E2350` on `#EEF1F6` = **13.49:1**, `#475569` on `#EEF1F6` =
**6.69:1**, `#64748B` on `#EEF1F6` = **4.20:1** (so `--color-muted-foreground` is still fine for
non-text chrome but must NOT be used for body text on the well — see 113/117).

## Files

- `src/app/globals.css` — add the five tokens above to the existing `@theme` block, retarget
  `--color-surface-well`. Nothing else in the file changes.
- `src/app/[locale]/dashboard/layout.tsx` — the frame:
  - `SidebarProvider` className → `mx-auto h-svh min-h-0 max-w-portal gap-6 overflow-hidden bg-surface-well p-6 max-md:gap-0 max-md:p-4`
    (keep `style={{ '--sidebar-width': '248px' }}`).
  - `SidebarInset` className → add `bg-transparent` (the vendored `<main>` ships `bg-background`;
    the well must show through) and keep `min-h-0 min-w-0 overflow-hidden`.
  - `[data-slot="dashboard-content"]` → drop `bg-surface-well` (the well moved up to the frame),
    keep every other class (`overflow-y-auto overscroll-contain scroll-smooth motion-reduce:scroll-auto`).

## Depends on

Nothing inside W4. **Wave gate:** W0 (foundations) and W1 (primitives) must be DONE before this
wave starts — that gate is PLAN.md's wave table, not an id edge: W0/W1 ids are authored by a
parallel agent and a `depends_on` entry to an id that does not exist makes `.qa/gen-state.mjs`
exit non-zero (`dangling depends_on`). If W0 has already emitted a token whose computed value
equals any of the five above, REUSE it and do not add a duplicate.

## Steps

1. Read `src/app/globals.css`'s `@theme` block and confirm which of the five tokens W0 already
   emits. Add only what is missing, each with the provenance comment shown above.
2. Retarget `--color-surface-well`; grep every consumer (`rg "surface-well" src/`) and eyeball that
   none of them meant `#EEF2F7` specifically.
3. Edit `dashboard/layout.tsx` exactly as listed. Do not touch `ParentGuard`, the provider's
   `--sidebar-width`, or the `dashboard-content` scroll utilities.
4. `pnpm tsc --noEmit && pnpm lint`.
5. Add to `tests/e2e/shell.spec.ts` a frame leg inside the existing desktop describe (do not
   create a new file): read `[data-slot="sidebar-wrapper"]`'s computed `padding`, `gap`,
   `max-width`, `height` and its `backgroundColor`; assert `24px`, `24px`, `1600px`,
   `= viewport height`, and that the well is a light navy-tinted grey (all three channels
   `> 232` and `< 246`, `b > r`).

## Project rules

- `schooltest-web/.claude/rules/tailwind.md` — **OKLCH only, never raw hex**; **no arbitrary
  values** (`max-w-[1600px]`, `p-[24px]`, `shadow-[0_1px_2px...]` all fail review); 4pt spacing.
- `schooltest-web/CLAUDE.md` §0 law 11 — `src/components/ui/*` is READ-ONLY; the frame is changed
  from the caller (layout + className) only. Law 12 — never run `pnpm dev/build/start`.
- `.claude/rules/quality.md` — one `<h1>` per page and semantic landmarks are untouched here;
  `SidebarInset` must stay a `<main>`.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts tests/e2e/dashboard.spec.ts`
  green, INCLUDING the pre-existing 248px + 48px-collapsed legs (regression proof) and the new
  frame leg above, run against the live app on :3100 in front of :5500.
- At 1280×800 a real screenshot at `.qa/screenshots/110-frame-1280.png` shows the sidebar card
  inset 24px from the top/left edges with the well visible around it.
- At 375×812: `document.documentElement.scrollWidth <= clientWidth` (no horizontal scroll) and the
  frame padding computes to `16px`.
- `rg -n "#[0-9A-Fa-f]{6}" src/app/globals.css` shows hex only inside `/* … */` provenance
  comments, never in a declaration value.
- Zero banned-pattern grep hits in the diff (`any`, `p-[`, `w-[`, `text-[`, raw `fetch(`).
- No new user-facing string → no i18n change; catalogs stay at 1151 keys × 6.

## Assumptions

- `max-md:p-4` (16px at <768px) is AUTHORED — the design has zero media queries (§9) and a 24px
  gutter at 375px would leave a 327px card. Recorded here so it is visibly a decision, not a port.
- `h-svh` is used instead of the design's `100vh` because `100vh` is wrong under a mobile URL bar;
  the existing layout already uses `h-svh`.

## Evidence

_(filled in as the task runs: computed style readings, screenshot paths, e2e output)_
