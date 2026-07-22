---
id: 166
title: Rebuild the "My children" page header to the portal slice with an honest count subline
layer: ui
kind: build
slice: PageHeader of the children list — 30px title, real child-count subline, and the navy pill "Add a child" action.
target: src/modules/children/components/ChildrenScreen.tsx, src/modules/children/components/ChildrenRosterSummary.tsx, src/i18n/messages/{en,zh,ko,ms,vi,th}.json
contract: C-STUDENT-LIST · C-DASH-HOUSEHOLD (childCount)
design: .qa/design/screens/portal--my-children-list.html (L4-10) · .qa/design/spec/02-portal-children.md §A.2, §A.3
status: TODO
depends_on: ["165"]
---

## Objective

Replace the current roster summary block with the portal slice's PageHeader: title, one-line real
count, and the pill "Add a child" button that routes to the existing wizard.

## Contract

No new HTTP operation. The count comes from `C-DASH-HOUSEHOLD` `data.household.childCount`
("active + enrolled children of this parent") or, when that response is unavailable, from the
already-loaded `C-STUDENT-LIST` rows. The design's literal subline is
`2 children · Family plan covers up to 4`; the seat cap half is **BLOCKED B-7** ("No payment,
credit, invoice, plan or subscription content-type exists") and MUST NOT be rendered in any form.

## Design source

`.qa/design/screens/portal--my-children-list.html`:

- Container (L3): `display:flex; flex-direction:column; gap:24px; padding:8px 4px 8px 8px` →
  `flex flex-col gap-6` with the asymmetric 8px/4px/8px/8px page padding (`pt-2 pr-1 pb-2 pl-2`).
- Header (L4): `flex items-end justify-between gap-5 flex-wrap` (20px gap).
- `h1` (L6): 30px / weight 500 / letter-spacing `-0.02em` / `#0E2350` →
  `text-3xl` (1.875rem = 30px, stock) `font-medium tracking-[-0.02em]`-equivalent via the W0
  `--tracking-*` token, `text-navy-900`.
- Subline (L7): `margin:6px 0 0`, 14px, `#7C8698` → `mt-1.5 text-sm text-portal-muted`
  (`#7C8698` = `oklch(0.6180 0.0297 262.27)`, W0 `--color-portal-muted`).
- Button (L9): `inline-flex items-center gap-2`, bg `#0E2350` (`bg-navy-900`), white label,
  14px / weight 600, padding `12px 22px`, `border-radius:999px` (`rounded-full`), no border.
  Hover `background:#16326E` (`--color-navy-800`). Leading icon: 15x15 `viewBox 0 0 24 24`,
  `stroke-width 2.2`, `stroke-linecap round`, path `M12 5v14M5 12h14` — the lucide `Plus` at
  `size-[0.9375rem]` via a W0 size token, `strokeWidth={2.2}`. Rendered height ~42px.

## Files

- `ChildrenScreen.tsx` — header markup + container padding/gap.
- `ChildrenRosterSummary.tsx` — becomes the title/subline pair (or is deleted and inlined if it drops
  under the 120-line component rule); keep `data-slot="children-roster-summary"`, which
  `tests/e2e/children-profile.spec.ts:66` asserts.
- Six locale catalogs: `Children.childCount` = `{count, plural, one {# child} other {# children}}`.

## Depends on

- `165` — the header's count reads the same view model the cards read.

## Steps

1. Keep `data-surface="children-roster"` on `<main>` and `Children.heading` as the single `<h1>`
   (`tests/e2e/students-list.spec.ts:52` matches `heading level 1`).
2. Add `Children.childCount` to en, then to zh/ko/ms/vi/th with identical shape (ICU plural in all six).
3. Wire the button to `<Link href="/dashboard/children/new">` from `@/i18n/navigation` styled as the
   pill (never `<a>`, never `<div onClick>`), reusing the design-system `Button` `asChild` if the
   navy pill variant exists after W1; otherwise the pill classes live on the Link.
4. Delete the "Family plan covers up to 4" half of the subline; record the deletion in Evidence with
   the B-7 quote.

## Project rules

- `.claude/rules/i18n.md` — no hardcoded string; all six catalogs key-identical.
- `.claude/rules/tailwind.md` — no arbitrary values, 4pt spacing, OKLCH tokens only.
- `.claude/rules/quality.md` — one `<h1>` per page; the pill must show a visible focus ring from
  `--color-ring`; 44px minimum pointer target (42px design height + the existing `after:` inset).
- `CLAUDE.md` §0.13 internal nav uses `<Link>` from `next-intl/navigation`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `/dashboard/children` shows `h1` = `Children.heading`; the subline text equals the ICU
  render of `Children.childCount` for the number of rows the API actually returned; clicking
  "Add a child" lands on `/dashboard/children/new` with the wizard step 1 visible.
- Motion: button `background-color` transition `200ms` (`--duration-switch`, the portal's only
  committed timing, `.qa/design/spec/02-portal-children.md` AN-2) with `--ease-out-quart`;
  `motion-reduce:transition-none` proven under `page.emulateMedia({ reducedMotion: 'reduce' })`.
- 375px: header wraps (`flex-wrap`) with the button full-width below the title, no horizontal scroll
  (`document.documentElement.scrollWidth <= window.innerWidth`). 1280px: title left, button right.
- axe: zero serious/critical on `/dashboard/children`.
- All six catalogs key-identical.
- `students-list.spec.ts` (incl. its six-locale heading loop) and `children-profile.spec.ts` green.

## Assumptions

The 30px/500 title uses the stock `text-3xl`; the `-0.02em` tracking comes from a W0 `--tracking-*`
token, not an arbitrary value.

## Evidence

<!-- filled in as the task runs -->
