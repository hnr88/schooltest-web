---
id: 031
title: Rebuild the status-dot pills and the count badges (notification, nav, avatar overflow)
layer: ui
kind: implement
slice: StatusPill (Live/Scheduled/Draft/Closed) + CountBadge + NavCountBadge
target: src/modules/design-system/components/status-pill.tsx, src/modules/design-system/components/status-badge.tsx, src/modules/design-system/components/count-badge.tsx, src/modules/design-system/components/nav-count-badge.tsx, src/modules/design-system/types/data-display.types.ts, src/modules/design-system/components/showcase/badges-section.tsx, tests/e2e/ds-status-pill.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--badges.html, .qa/design/screens/ds--table.html, .qa/design/screens/ds--cards.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/screens/ds--navigation.html, .qa/design/spec/04-ds-foundations.md#6.3,#6.5, .qa/design/spec/05-ds-components.md#2.4,#5.1,#6.6a
status: TODO
depends_on: [001, 006, 007, 010, 011, 030]
---

## Objective

Three related chips the whole portal reuses: the dot-status pill (four tones, two geometries), the
red notification count badge, and the tonal nav count badge. All three already exist as separate
components; this task re-cuts them to the export and unifies their tone table.

## Contract

n/a. Verbatim from the slices:

**Status dot badge** `[BDG:17-19]` — base badge (§6.1) plus `display:inline-flex;
align-items:center; gap:6px`; dot `width:6px; height:6px; border-radius:50%`.

| status | text | background | dot |
|---|---|---|---|
| `Live` | `#15803D` | `#DCFCE7` | `#16A34A` |
| `Scheduled` | `#16326E` | `#EFF5FF` | `#2563EB` |
| `Draft` | `#475569` | `#F1F5F9` | `#94A3B8` |
| `Closed` (`ds--table.html` resolved rows) | `#475569` | `#F1F5F9` | `#94A3B8` |

**Compact pill inside cards/tables** (`ds--cards.html:24`, `ds--table.html:17`):
`font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px`, same dot.
**Dot-less pill** (`ds--dashboard-components.html:65` upcoming rows): `font-size:11.5px;
font-weight:600; padding:3px 9px; border-radius:999px`, **no leading dot**.

**Count badge** `[BDG:21]`: `display:inline-grid; place-items:center; min-width:20px; height:20px;
padding:0 6px; border-radius:999px; background:#DC2626; color:#FFFFFF; font-size:11.5px;
font-weight:700`. It grows via `min-width` + padding, never a fixed width.

**Nav count badge** (`ds--navigation.html:10`): same box but `background:#EFF5FF; color:#2563EB`,
`margin-left:auto`.

**Topbar unread dot** (`ds--navigation.html:29`): `position:absolute; top:7px; right:8px;
width:7px; height:7px; border-radius:50%; background:#DC2626; border:1.5px solid #fff` — a
boolean, not a count.

## Design source

Tokens: `#DCFCE7` `bg-success-soft` · `#15803D` `text-success-strong` · `#16A34A` `bg-success` ·
`#EFF5FF` `bg-secondary` · `#16326E` `text-secondary-foreground` · `#2563EB` `bg-primary` ·
`#F1F5F9` `bg-muted` · `#475569` `text-body` · `#94A3B8` `bg-muted-foreground-soft` ·
`#DC2626` `bg-destructive` · `#FFFFFF` `text-destructive-foreground`.
Type: `--font-size-caption` (12.5px), 12px, 11.5px `--font-size-count`. Radius `--radius-full`.

Motion: the count badge is the one live number here — when it changes it plays `st-pop-in`
(180ms, `--animate-pop-in`, opacity + scale .96→1) so an arriving notification is perceptible.
Reduced-motion from W0 removes the scale and keeps the value change instant.

## Files

- `status-pill.tsx` — tones `live | scheduled | draft | closed`, sizes `default | compact | bare`
  (`bare` = the dot-less upcoming pill).
- `status-badge.tsx` — align to the same tone table; delete duplication rather than adding a
  third table.
- `count-badge.tsx` (destructive) and `nav-count-badge.tsx` (tonal) — one shared box, two tones.
- `types/data-display.types.ts` — `StatusPillTone`, `StatusPillSize`, `CountBadgeProps`.
- showcase `badges-section.tsx`, `tests/e2e/ds-status-pill.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **030** — the badge base (12.5px / 600 / pill radius) these three extend.

## Steps

1. Single tone table in `constants/status-tone.constants.ts`; both pill components read it.
2. The dot is `aria-hidden`; the pill's text is the accessible content. Never encode status by
   colour alone (`.claude/rules/quality.md`).
3. Count badge: `min-w-5 h-5 px-1.5`; verify `3`, `12` and `99+` all render without clipping.
4. `st-pop-in` on value change via a `key`-ed span so React remounts it.
5. i18n every status label and the count's `aria-label`
   (`{count, plural, one {# unread} other {# unread}}`); six catalogs, ICU plurals.
6. E2E.

## Project rules

- `CLAUDE.md` law 11, law 14, law 15; `.claude/rules/module-pattern.md` (tone table in
  `constants/`); `.claude/rules/tailwind.md`; `.claude/rules/i18n.md` (ICU plurals for counts);
  `.claude/rules/quality.md` (status not conveyed by colour alone);
  `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-status-pill.spec.ts` asserts on `/design-system`: each of the four tones has the
  documented text/background/dot colours; the compact pill is 12px/`3px 10px` and the bare pill
  has no dot child; the count badge is ≥20px wide at `3` and grows at `99+` while staying 20px
  tall; the nav badge uses the tonal pair.
- The count badge's accessible name pluralises correctly in `en` and `zh` (assert both).
- Motion: changing the count plays a non-`none` `animation-name`; `0.01ms` under
  `reducedMotion: 'reduce'`.
- 375px + 1280px; axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `notification-feed.spec.ts` and `shell.spec.ts` still green (both assert the unread badge).

## Assumptions

- `Closed` reuses the `Draft` tone — that is what the export's resolved table data does
  (`.qa/design/spec/05-ds-components.md` §2.4), not an invention.

## Evidence
