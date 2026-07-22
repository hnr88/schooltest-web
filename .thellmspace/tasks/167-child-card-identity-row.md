---
id: 167
title: Build the ChildCard shell, auto-fit grid and identity row with the CEFR level pill
layer: ui
kind: build
slice: The children-list card itself — 24px white card in an auto-fit grid, 52px avatar, name + meta line, CEFR "Level {band}" pill, hover elevation, keyboard-reachable profile link.
target: src/modules/children/components/ChildCard.tsx (new), src/modules/children/components/ChildrenRoster.tsx, src/app/globals.css (@utility grid-cols-child-cards), src/i18n/messages/*.json
contract: C-STUDENT-LIST · C-DASH-HOUSEHOLD (cefrBand)
design: .qa/design/screens/portal--my-children-list.html (L11-21) · .qa/design/spec/02-portal-children.md §A.4, §A.5
status: TODO
depends_on: ["165", "166"]
---

## Objective

Replace the flush `DataGridRow` roster with the design's card grid, and build the card's first row:
avatar, name, meta line, CEFR band pill. The whole card opens the child, without a `<div onClick>`.

## Contract

`C-DASH-HOUSEHOLD` → `children[].cefrBand` is "latest OFFICIAL result band; **nullable when never
assessed**", drawn from `CEFR_LADDER = ["pre_A1","A1","A2","B1","B2","C1"]`. The pill renders
`Level {band}` when a band exists and the honest `Children.notBanded` ("Not banded yet", already in
all six catalogs) when it is `null`. No band is ever inferred, defaulted or rounded up.

## Design source

`.qa/design/screens/portal--my-children-list.html`:

- Grid (L11): `repeat(auto-fit, minmax(360px,1fr)); gap:20px` → new `@utility grid-cols-child-cards`
  in `globals.css` using `repeat(auto-fit, minmax(min(22.5rem, 100%), 1fr))` so a 375px viewport
  (343px content box) does not overflow a 360px track; `gap-5`.
- Card (L13): `background:#FFFFFF` (`bg-card`), `border-radius:24px` (`rounded-3xl` = 1.5rem),
  `padding:28px` (`p-7`), `box-shadow:0 1px 2px rgba(14,35,80,.04)` → W0 `--shadow-portal-card`
  = `0 1px 2px oklch(0.2692 0.0871 263.04 / 0.04)`; `flex flex-col gap-[22px]` → the W0 spacing
  decision (04-ds-foundations §J): faithful token `--spacing-card-gap: 1.375rem`, or normalised
  `gap-6`. Never a bracket value.
- Hover (L13): `box-shadow:0 10px 32px rgba(14,35,80,.10)` = W0 `--shadow-portal-card-hover`.
- IdentityRow (L14): `flex items-center gap-[15px]` (→ `gap-4` normalised).
- Avatar (L15): 52px square (`size-13`), `rounded-full`, bg `#EEF1F6` (W0 `--color-portal-rule`,
  `oklch(0.9573 0.0074 260.73)`), fg `#0E2350` (`text-navy-900`), `font-semibold`, 18px (`text-lg`),
  `grid place-items-center`, `flex-none`.
- Name (L17): 18px / 600 / `#0E2350` → `text-lg font-semibold text-navy-900`, `truncate`.
- Meta (L18): 13px / `#7C8698` / `margin-top:2px` → `text-caption text-portal-muted mt-0.5`.
- Level pill (L20): 12px / 600 / `#0E2350`, `border:1px solid #D8DFEA` (W0 `--color-portal-border`,
  `oklch(0.9016 0.0168 259.42)`), `padding:5px 12px`, `rounded-full`, transparent background,
  `flex-none`.

## Files

- `src/modules/children/components/ChildCard.tsx` (new, <=120 lines).
- `ChildrenRoster.tsx` — grid instead of `DataPanel`; keep `aria-label={t('cardListLabel')}`.
- `src/app/globals.css` — `@utility grid-cols-child-cards` (the file already owns nine such utilities).
- Catalogs: `Children.levelPill` = `Level {band}`.

## Depends on

- `165` (row shape), `166` (page container it sits in).

## Steps

1. Card root is `<article aria-label={t('childCardLabel', { name })}>` — `students-list.spec.ts` and
   `dashboard-students.spec.ts` both select by that role+name; keep it exactly.
2. Inside, the name is a `<Link href={'/dashboard/children/' + documentId}>` with
   `aria-label={t('viewProfileLabel', { name })}` and an `after:absolute after:inset-0` overlay so the
   whole card is the target while remaining one tab stop with a visible focus ring
   (`focus-visible:ring-2 focus-visible:ring-ring`) — the pattern already used by `ChildRosterRow.tsx`.
3. Meta line: `Year {n}` from `year_level`/`current_year_level` (the specs assert the card contains
   `8` and `10`), then nationality, then target entry — each omitted when null, joined with ` · `.
   There is **no school relation on `student`**, so the design's `Riverside College, Parramatta` half
   has no data source and is not rendered.
4. Keep the `StatusPill` (`Children.statusActive` / `statusArchived` / `statusEnrolled`) next to the
   level pill — `students-list.spec.ts:63` and `dashboard-students.spec.ts` assert that text inside
   the card.
5. Hover elevation is animated **opacity-only** to satisfy `.claude/rules/tailwind.md:19`: an
   `after:`/`before:` layer carrying `--shadow-portal-card-hover`, `opacity-0` →
   `group-hover:opacity-100 group-focus-within:opacity-100`, `transition-opacity duration-200
   ease-out-quart`, `motion-reduce:transition-none`.

## Project rules

- `.claude/rules/quality.md` — never `<div onClick>`; 44px pointer target; visible focus.
- `.claude/rules/tailwind.md` — OKLCH tokens, no arbitrary values, animate transform/opacity only.
- `.claude/rules/module-pattern.md` — 120-line component cap; presentational only.
- `.qa/DECISIONS.md` D-DESIGN-2 (hex → OKLCH `@theme`), D-DESIGN-3 (motion is part of done).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the seeded parent sees `article` cards for `Mia Keller` and `Jonas Keller`; each shows
  `Level {band}` matching that child's `cefrBand` from the live `GET /api/my/progress` body, or
  `Children.notBanded` when the API returned `null` — asserted against the parsed response, not a literal.
- Keyboard: `Tab` reaches exactly one focusable per card, `Enter` navigates to
  `/dashboard/children/{documentId}`, focus ring visible in the screenshot.
- Motion: hover elevation transitions 200ms and is inert under reduced motion.
- 375px: one column, no horizontal scroll; 768px: two columns; 1280px: three columns.
- axe zero serious/critical; six catalogs key-identical.
- `students-list.spec.ts`, `dashboard-students.spec.ts`, `children-profile.spec.ts` green.

## Assumptions

`size-13` (52px) exists on the 4pt scale (13 * 4px); if the repo's spacing scale stops earlier, W0
adds the token rather than the task using `w-[52px]`.

## Evidence

<!-- filled in as the task runs -->
