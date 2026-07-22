---
id: 119
title: Breadcrumb — the design system's 13.5px trail with a 13px chevron separator, replacing the "/" text
layer: ui
kind: build
slice: The shell's single breadcrumb trail (section crumb + optional record crumb)
target: src/modules/shell/components/TopbarBreadcrumb.tsx
contract: n/a — pure presentation; design spec quoted below
design: .qa/design/screens/ds--navigation.html:34-43, .qa/design/spec/05-ds-components.md#53-breadcrumbs
status: TODO
depends_on: ["118"]
---

## Objective

Re-skin the breadcrumb to the design system's Breadcrumbs spec — the only place in the whole export
that draws one — while keeping the record-crumb mechanism (`useRecordCrumb` → zustand → topbar)
and the two assertions that pin it.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §5.3, verbatim (`ds--navigation.html:34-43`):

```
Row: display:flex; align-items:center; gap:8px; font-size:13.5px
Ancestor link: color:#64748B; font-weight:500; text-decoration:none; hover color:#2563EB
Separator: 13×13 chevron-right SVG, stroke:#CBD5E1; stroke-width:2.4, round caps/joins
Current page: color:#0E2350; font-weight:600 (a <span>, not a link)
Trail: Dashboard › Tests › Midterm Algebra (last item = current entity name)
```

**PRESERVED BEHAVIOUR:** the `<nav>` keeps `aria-label` from `Shell.topbar.breadcrumbLabel`
(`shell.spec.ts` finds it by role+name); the current page keeps
`data-slot="topbar-page-title"` (asserted by text); the first crumb keeps
`Shell.topbar.dashboard` linking to `/dashboard`; the section crumb becomes a LINK only when a
record crumb is published (`useRecordCrumbLabel`), exactly as today; `getShellRouteMeta()` and
`use-record-crumb-store.ts` are NOT touched — the pathname-scoped staleness guard in that store is
load-bearing.

## Design source

| Property | Design value | Token / utility |
|---|---|---|
| row gap | `8px` | `gap-2` |
| row size | `13.5px` | `--text-body-sm` (0.84375rem) → `text-body-sm` |
| ancestor ink | `#64748B` | `--color-muted-foreground` → `text-muted-foreground` (**4.20:1** on the `#EEF1F6` well — see correction) |
| ancestor weight | `500` | `font-medium` |
| ancestor hover | `#2563EB` | `--color-primary` → `hover:text-primary` |
| separator | 13×13 chevron-right, `#CBD5E1`, stroke-width 2.4 | `<ChevronRight className="size-3.25 text-input" strokeWidth={2.4} aria-hidden />` (`--color-input` = `#CBD5E1`) |
| current | `#0E2350` / `600` | `text-foreground font-semibold` (**13.49:1** on the well) |

**Authored a11y correction:** the ancestor ink `#64748B` measures **4.20:1** on the new `#EEF1F6`
well — it passed on white (4.76:1) but the row no longer sits on white (118). Use
`--color-body` (`#475569`, **6.69:1** on the well) for the ancestor links and keep `hover:text-primary`
(`#2563EB` = 4.57:1 on the well, and hover is not the resting state). Record both measurements.

The `size-3.25` (13px) chevron replaces the current literal `"/"` text separator. Keep the
separator elements `aria-hidden` — the vendored `BreadcrumbSeparator` already handles the role.

Motion: `transition-colors duration-200 ease-out-expo motion-reduce:transition-none` on the links
(the DS declares none on breadcrumbs; this matches the rest of the shell). No layout animation —
the trail changing length must not slide.

375px: the first crumb (`Dashboard`) and its separator stay `max-sm:hidden` (existing behaviour);
the section/record crumbs keep `min-w-0 truncate` so a long child name cannot widen the row.

## Files

- `src/modules/shell/components/TopbarBreadcrumb.tsx` — `CRUMB_LINK_CLASSES`, the two
  `BreadcrumbSeparator` children (text `/` → `<ChevronRight>`), the `BreadcrumbList` classes, and
  the `BreadcrumbPage` classes. Nothing else in `src/modules/shell/` changes.

## Depends on

- **118** — the row must already be transparent over the well, or the contrast numbers above are
  measured against the wrong background.

## Steps

1. Set `BreadcrumbList` to `flex-nowrap items-center gap-2 text-body-sm`.
2. Replace both separators' `/` children with a `ChevronRight` from `lucide-react` at
   `size-3.25`, `strokeWidth={2.4}`, `text-input`, `aria-hidden="true"`.
3. Set `CRUMB_LINK_CLASSES` ink to `text-body` with `hover:text-primary`, keep `font-medium`, the
   `relative` + `after:inset-x-0 after:-inset-y-3` 44px pointer target, the focus ring, and the
   reduced-motion variant.
4. Set both `BreadcrumbPage`s to `truncate font-semibold text-foreground`.
5. `pnpm tsc --noEmit && pnpm lint`.
6. Extend `shell.spec.ts`'s breadcrumb test (do not create a spec): computed `font-size: 13.5px`,
   `gap: 8px`; the separator `<svg>` measures 13×13 with `stroke-width: 2.4`; the current page
   computes `font-weight: 600`; ancestor-vs-well contrast ≥ 4.5.

## Project rules

- `CLAUDE.md` §0 law 11 — `src/components/ui/breadcrumb.tsx` is read-only; style through the
  wrapper's className and children only.
- `.claude/rules/quality.md` — WCAG AA on the new background; every link keyboard-reachable with a
  visible ring; `<a>` never used for internal nav (the `next-intl` `Link` stays).
- `.claude/rules/tailwind.md` — no arbitrary values (`size-3.25` is a real scale step: 3.25×4=13px).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/children-profile.spec.ts tests/e2e/shell-a11y.spec.ts`
  green — including the pre-existing `breadcrumb toContainText(Shell.topbar.dashboard)` /
  `(Shell.nav.myChildren)` / `[data-slot="topbar-page-title"]` legs.
- **Record-crumb behaviour re-proven live:** navigate to a real child's detail page, assert the
  trail is `Dashboard › My children › <the child's real name from Postgres>`, then navigate away
  and assert the record crumb is gone (the store's pathname guard).
- New legs pass (13.5px, gap 8px, 13×13 chevron at stroke-width 2.4, 600 current, ≥4.5 contrast).
- Motion: link `transition-duration` `0.2s`, `0s` under reduced motion.
- 375px: the Dashboard crumb is hidden, the row does not scroll horizontally with a 40-character
  child name (assert `scrollWidth <= clientWidth`).
- axe serious/critical = 0 at 1280 + 375.
- No new strings → six catalogs unchanged.

## Assumptions

- `lucide-react`'s `ChevronRight` matches the design's `m9 18 6-6-6-6` path exactly; it does. No
  hand-inlined SVG is added.

## Evidence

_(filled in as the task runs)_
