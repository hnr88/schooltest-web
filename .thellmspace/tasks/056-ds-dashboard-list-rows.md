---
id: 056
title: Rebuild the dashboard list rows — activity feed, upcoming event, rank row
layer: ui
kind: implement
slice: ActivityFeedRow + UpcomingEventRow + RankRow
target: src/modules/design-system/components/activity-feed-row.tsx, src/modules/design-system/components/upcoming-event-row.tsx, src/modules/design-system/components/rank-row.tsx, src/modules/design-system/types/record.types.ts, src/modules/design-system/components/showcase/record-rows.tsx, tests/e2e/ds-list-rows.spec.ts
contract: n/a (presentation slice — the rows' content is contracted in W2/W3; the "Upcoming" DATA is BLOCKED B-1/B-2)
design: .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#6.5,#6.6
status: TODO
depends_on: [001, 003, 006, 007, 010, 011, 020, 031, 035, 038]
---

## Objective

Three list rows the dashboard (W5) and child detail (W6) compose. They are built here as pure
presentation so W5 can mount the two that have real data and **not** mount the one whose data is
BLOCKED.

## Contract

n/a for presentation. **Note the blocking rule that governs one of these**, quoted from
`.qa/CONTRACTS.md`:

> **B-1** `coming up` hero stat (`2`) — `portal--main.html:34` — No scheduling model exists
> anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class`
> is only `{name, year_band, teacher, students}`. Nothing to count.
> **B-2** "Coming up" list (3 dated rows) — `portal--main.html:120-140` — Same as B-1.

`UpcomingEventRow` is therefore built as a **design-system primitive with no portal consumer**.
It ships in the showcase with static demo props only. W5 must not mount it against invented data;
that refusal is recorded in W5's own BLOCKED task.

**ActivityFeedRow** — §6.5, verbatim:
- Item: `display:flex; gap:11px; align-items:flex-start`.
- Icon bubble: `inline-grid; place-items:center; width:30px; height:30px; border-radius:50%;
  flex:none` — success `#DCFCE7`/`#16A34A` check at 2.4; info `#EFF5FF`/`#2563EB` file at 2;
  warning `#FEF3C7`/`#D97706` alert-triangle at 2.2.
- Text: `font-size:13px; line-height:1.5; color:#475569`; the actor/subject is
  `font-weight:600; color:#0E2350`.
- Timestamp: `font-size:11.5px; color:#94A3B8; margin-top:2px`.
- Footer ghost button, full width: `margin-top:14px; width:100%; background:transparent;
  color:#2563EB; font-size:12.5px; font-weight:600; padding:7px; border-radius:8px`;
  hover `background:#EFF5FF`.

**UpcomingEventRow** — §6.6a, verbatim:
- Row: `display:flex; align-items:center; gap:12px; border:1px solid #EEF2F7; border-radius:12px;
  padding:11px 13px` (bordered, no shadow, no fill).
- Date tile: `display:flex; flex-direction:column; align-items:center; width:40px; flex:none;
  border-radius:9px; padding:5px 0`; bg `#EFF5FF` (blue) or `#F0FDFA` (teal); month
  `10px / 700 / uppercase` in `#2563EB` / `#0D9488`; day `16px / 700 / #0E2350; line-height:1.1`.
- Body: `flex:1; min-width:0`; name `13.5px / 600 / #0E2350`; meta `12px / #94A3B8`.
- Status pill: `11.5px / 600; padding:3px 9px; border-radius:999px; flex:none` — **no leading
  dot**, unlike the table/card pills.

**RankRow** — §6.6b, verbatim:
- Row: `display:flex; align-items:center; gap:10px`.
- Rank: `width:20px; font-size:12.5px; font-weight:700; flex:none`; rank-specific colours
  1 → `#D97706`, 2 → `#94A3B8`, 3 → `#B45309`.
- Avatar 28×28 (task 038's stack size), backgrounds `#0E2350`, `#2563EB`, `#14B8A6` for 1/2/3.
- Name `13.5px / 600 / #0E2350; flex:1`; score `13px / 700 / #0E2350`.

## Design source

Tokens: bubbles `bg-success-soft`/`bg-secondary`/`bg-warning-soft` with `text-success`/
`text-primary`/`text-warning` glyphs; body `--font-size-caption-lg` (13px) `text-body` with
`text-foreground` weight 600 for the subject; timestamp `--font-size-count` (11.5px)
`text-muted-foreground`; upcoming border `--color-rule`, radius `--radius-lg` (12px), date tile
`bg-secondary`/`bg-accent-50` at `--radius-chip-lg` (9px); rank colours `text-warning`,
`text-muted-foreground-soft`, `text-warning-strong`.

Motion: rows enter with `--animate-fade-in` + a 4px translateY, staggered 40ms per index, so a
refreshed feed reads as arriving. The footer ghost button gets the standard 150ms background
transition. Reduced-motion from W0 removes the stagger and the translate.

## Files

- `activity-feed-row.tsx` — re-cut (also keep the existing `DotActivityRow` export).
- `upcoming-event-row.tsx` — re-cut; showcase-only consumer.
- `rank-row.tsx` — re-cut.
- `types/record.types.ts` — `ActivityFeedRowProps`, `UpcomingEventRowProps`, `RankRowProps`,
  `ActivityTone`.
- showcase `record-rows.tsx`; `tests/e2e/ds-list-rows.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **038** — the 28px avatar.
- **031** — the dot-less status-pill variant.
- **020** — the ghost footer button.
- **035** — the card they sit in.

## Steps

1. Rank colour is **not** the only rank signal — the numeral itself is the signal, so contrast on
   the numeral must still pass (`#94A3B8` at 12.5px on white fails; step to
   `--color-muted-foreground`, recorded).
2. Timestamps are passed in pre-formatted by the caller (relative time is locale-dependent and
   belongs in the i18n layer, not in a presentation component).
3. `UpcomingEventRow` ships with a doc comment stating B-1/B-2 and that it has no portal consumer
   — this is one of the few places `CLAUDE.md` law 15 permits a comment, because the constraint is
   non-obvious.
4. The activity row's bolded subject is a `<strong>`, not a styled span, so emphasis survives for
   AT.
5. i18n showcase strings; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 1 (no invention — do not wire `UpcomingEventRow` to anything), law 14, law 15
  (the single permitted comment above), law 3.
- `.qa/CONTRACTS.md` B-1/B-2 — binding.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md`; `.claude/rules/quality.md`;
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-list-rows.spec.ts` asserts on `/design-system`:
  - all three activity tones render the documented bubble fill and glyph stroke at 30×30;
  - the activity subject is a `<strong>` at weight 600 in `--color-foreground`;
  - the upcoming row has a 1px `--color-rule` border, 12px radius, a 40px date tile, and a status
    pill with **no** dot child;
  - rank rows 1/2/3 carry the documented rank colours and 28px avatars, and the name column
    truncates rather than pushing the score off-row at 375px;
  - the feed's footer button spans the full card width and hovers over 150ms.
- Motion: rows enter with a 40ms stagger; `0.01ms` and no stagger under `reducedMotion: 'reduce'`.
- 375px: every row fits with no horizontal scroll and no clipped score; 1280px unchanged.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `grep -rn "UpcomingEventRow" src/modules --include=*.tsx` shows consumers **only** under
  `design-system/components/showcase/` — proving the BLOCKED row was not wired to invented data.

## Assumptions

- `UpcomingEventRow` exists as a primitive but has no portal consumer this mission, per B-1/B-2.
  If a scheduling model ever lands, mounting it is a new task with a new contract.

## Evidence
