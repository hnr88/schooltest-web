---
id: 147
title: Metric 7 — per-child "Focus: {skill}" pill from children[].focusSkill
layer: ui
kind: implement
slice: Design metric inventory row 7
target: src/modules/dashboard/components/DashboardFocusPill.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:80 · .qa/design/spec/01-portal-dashboard.md#4.6 #10 (row 7)
status: TODO
depends_on: ["145", "130"]
---

## Objective
The blue pill at the right of each child row naming the skill that child should work on next.

## Contract
`C-DASH-HOUSEHOLD` → `children[].focusSkill`: `reading | listening | speaking | writing`, **null
when no skill has an official result**. The derivation is server-side and is quoted here so no
client-side ranking is ever attempted:

> **`focusSkill` derivation** (design says "the weakest skill"; the docs forbid a composite %):
> rank each skill's latest official result by `readiness` — `not_yet`(0) < `approaching`(1) <
> `met`(2), `not_assessed` excluded — and take the lowest. Ties break on the lower mean of that
> result's per-attribute `prob` values in `attributes` … Still tied ⇒ the skill enum's declaration
> order. **No percentage is ever surfaced to the user.**

The design's own derivation (`Parent Portal.dc.html:973`,
`k.skills.reduce((a,b) => parseInt(a.pct) < parseInt(b.pct) ? a : b).name`) is percentage-based and
is replaced by the above. The client renders `focusSkill` as given; it must not re-derive it, and it
must not display any `prob`, percentage or readiness number next to it.

## Design source
- `portal--main.html:80`: `font-size:12px; font-weight:600; color:#2563EB; background:#EEF3FE;
  padding:6px 13px; border-radius:999px; flex:none`
  → `shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600`.
  `text-xs` = 12px ✓ exact; `py-1.5` = 6px ✓ exact; `px-3` = 12px vs 13px (1px delta);
  `--color-blue-600` = `oklch(0.5461 0.2152 262.8809)` (`#2563EB`) ✓ exact;
  `--color-blue-50` = `oklch(0.9685 0.0148 260.7297)` (`#EFF5FF`) — the design's `#EEF3FE` has no
  token and is one hex step away; `--color-blue-50` is the sanctioned `--secondary` value. Record
  the delta; do not add a near-duplicate token.
  Contrast check: `#2563EB` on `#EFF5FF` is 5.31:1 ✓ AA for 12px text.
  `data-slot="dashboard-focus-pill"` + `data-skill={focusSkill}`.
- **Visible label: the literal prefix `Focus: ` then the skill name** (spec §4.6), title-cased in
  the design (`Focus: Speaking`). One ICU message, `Dashboard.children.focusPill` =
  `"Focus: {skill}"`, with `{skill}` resolved from `Dashboard.skill.reading|listening|speaking|
  writing` (the keys added in 134). Never concatenate `"Focus: " + skill` in TSX — several of the
  six locales put the label after the value.
- **`focusSkill === null`** ⇒ **the pill is not rendered at all.** Not "Focus: —", not a greyed
  pill, not "Focus: none". A child with no official result has no focus skill; an empty pill would
  imply the system had computed one. The row's other content shifts right naturally
  (`flex` + `shrink-0`).
- Motion: `animate-in fade-in zoom-in-95 duration-200 ease-out-expo motion-reduce:animate-none` on
  mount — the design system's `st-pop-in` shape (opacity 0 + scale .96), expressed with
  tw-animate-css. Opacity + transform only.
- 375px: the pill moves to the second line with the CEFR strip (157); it keeps `shrink-0` so it
  never squashes to an ellipsis.

## Files
- CREATE `src/modules/dashboard/components/DashboardFocusPill.tsx` (≤40 lines).
- EDIT `DashboardChildRow` — slot between the CEFR strip and the chevron.
- i18n: `Dashboard.children.focusPill` (+ the `Dashboard.skill.*` set from 134).

## Depends on
- **145** (the row), **130** (household data), **134** (the `Dashboard.skill.*` keys).

## Steps
1. Build the pill; render nothing when `focusSkill` is null.
2. Wire the ICU message with the skill label lookup.
3. Six-catalog keys.

## Project rules
- `.claude/rules/i18n.md` — one ICU message; no runtime string concatenation of translated parts.
- `.claude/rules/tailwind.md` — token colours; no arbitrary values; transform/opacity motion only.
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD — no percentage surfaced.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright against live data: for each child in `GET /api/my/progress`, if `focusSkill` is
  non-null the row has one `[data-slot="dashboard-focus-pill"][data-skill="<value>"]` and its text
  equals the ICU message rendered with the matching `Dashboard.skill.*` string; if `focusSkill` is
  null the row has **zero** focus pills.
- Computed: `font-size: 12px`, `font-weight: 600`, colour resolves to `oklch(0.5461 0.2152
  262.8809)`; measured contrast against the pill background ≥ 4.5:1.
- `grep -rniE "pct|percent|%" src/modules/dashboard/components/DashboardFocusPill.tsx` returns
  nothing; no percentage renders anywhere in the row.
- `/zh/dashboard`: the pill renders the zh skill name and the zh label order.
- Reduced motion ⇒ `animation-name: none`.
- axe clean; six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- Skill labels are title-cased in `en` and whatever each locale's convention is elsewhere — that is
  a translation decision, not a code one.

## Evidence
<filled in as the task runs>
