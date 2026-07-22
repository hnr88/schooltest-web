---
id: 033
title: Rebuild the Alert — four variants, 36px icon chip, dismiss and action rows
layer: ui
kind: implement
slice: Alert (info / success / warning / destructive) with dismiss and xs action buttons
target: src/modules/design-system/components/alert.tsx, src/modules/design-system/types/design-system.types.ts, src/modules/design-system/components/showcase/alerts-section.tsx, src/modules/design-system/components/showcase/alert-dismiss-demo.tsx, tests/e2e/ds-alert.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--alerts.html, .qa/design/spec/04-ds-foundations.md#7.1,#7.2, .qa/design/spec/05-ds-components.md#8.6
status: TODO
depends_on: [001, 003, 006, 007, 008, 010, 011, 020, 021, 030]
---

## Objective

The inline message surface used by every form error, the query-error module and the dashboard's
BLOCKED-metric notices. Four variants, exact chip tints, two trailing-affordance shapes.

## Contract

n/a. `.qa/design/spec/04-ds-foundations.md` §7.1-7.2, verbatim.

Shell `[ALR:7,12,17,28]`:
```
display:flex; gap:13px; align-items:flex-start;
background:#FFFFFF; border:1px solid #E3E8F0; border-radius:14px;
padding:15px 16px; box-shadow:0 1px 2px rgba(14,35,80,.05);
```
Icon chip: `inline-grid; place-items:center; width:36px; height:36px; border-radius:10px;
background:<tint>; flex:none`; glyph `17×17, fill:none, stroke:<accent>, stroke-width:2.2,
stroke-linecap:round`.
Body: `flex:1; min-width:0`; title `14px / 600 / #0E2350`; description `13.5px / 1.5 / #64748B;
margin-top:2px`.
Dismiss `[ALR:10,15]`: 26×26, `border-radius:7px`, transparent, `color:#94A3B8`,
`aria-label="Dismiss"`, hover `background:#F1F5F9; color:#475569`, 13×13 ✕ at `stroke-width:2.4`.
Action row: `display:flex; gap:8px; margin-top:11px`.

| variant | chip bg | stroke | lucide icon | trailing |
|---|---|---|---|---|
| info | `#EFF5FF` | `#2563EB` | `info` | ✕ dismiss |
| success | `#DCFCE7` | `#16A34A` | `circle-check` | ✕ dismiss |
| warning | `#FEF3C7` | `#D97706` | `triangle-alert` | 2 action buttons, **no** ✕ |
| destructive | `#FEE2E2` | `#DC2626` | `alert-circle` | 1 action button, **no** ✕ |

Action buttons (xs, task 020's `xs` size): `font-size:12.5px; font-weight:600; padding:6px 12px;
border-radius:8px`. `Review questions` = `bg #EFF5FF / #16326E`, hover `#DBEAFE`;
`Dismiss` = ghost `#64748B`, hover `#F1F5F9`; `Retry` = `#DC2626 / #FFFFFF`, hover `#B91C1C`.

**Dark mode** (`05-ds-components.md` §8.6): dark alerts are tinted glass —
`background:rgba(59,130,246,.10); border:1px solid rgba(59,130,246,.35); border-radius:12px;
padding:14px 16px`, icon `#60A5FA`, title `#E6ECF7`, body `#A9BADC`.

## Design source

Tokens: shell `bg-card` / `border-border` / `--radius-xl` (14px) / `--shadow-alert`
(`0 1px 2px oklch(0.2692 0.0871 263.04 / 0.05)`). Chips: `bg-secondary`+`text-primary`,
`bg-success-soft`+`text-success`, `bg-warning-soft`+`text-warning`,
`bg-destructive-soft`+`text-destructive`. Chip radius `--radius-md` (10px). Title
`--font-size-body-sm` (14px) `text-foreground`; body `--font-size-label` (13.5px)
`text-muted-foreground` at `--leading-body` 1.5.

Motion: the alert enters with `st-fade-in` + a 4px translateY (`--animate-fade-in`, 180ms
`ease-out-quart`) and leaves with `animate-out fade-out-0` 150ms; the dismiss button gets the
standard 150ms colour transition. Reduced-motion from W0 — the alert then appears instantly, which
is required because an error message must never be delayed behind an animation.

## Files

- `src/modules/design-system/components/alert.tsx` — re-cut; keep the current
  `variant`/`title`/`children`/`onDismiss` prop shape so `src/modules/query-errors` and the auth
  screens keep compiling.
- `types/design-system.types.ts` — `AlertVariant`, `AlertProps` (+ `actions?`).
- showcase `alerts-section.tsx` + `alert-dismiss-demo.tsx`; `tests/e2e/ds-alert.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **020** — the `xs` button size for the action row.
- **021** — the 26px dismiss button.
- **030** — the tint tokens shared with the badges.

## Steps

1. Semantics: `role="alert"` (assertive) for `destructive`, `role="status"` (polite) for the other
   three — an error must be announced, a success note must not interrupt.
2. Icons come from `lucide-react` (already a dep) — `Info`, `CircleCheck`, `TriangleAlert`,
   `CircleAlert` — at `size-[17px]`-equivalent token; `aria-hidden`.
3. `onDismiss` renders the ✕ IconButton; when `actions` is provided the ✕ is omitted, matching
   the export.
4. Dark-mode branch per §8.6 (alpha fills, not solid tints).
5. i18n: reuse the existing `DesignSystem.alert*` keys; add `alertDestructiveAction`; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 3 (query-errors + auth consume `Alert`), law 11, law 14, law 15.
- `.claude/rules/module-pattern.md` (component ≤120 lines — split the icon map into
  `constants/alert.constants.ts`); `.claude/rules/tailwind.md`; `.claude/rules/quality.md`
  (`role=alert` only where interruption is warranted; 4.5:1 body text);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-alert.spec.ts` asserts on `/design-system`:
  - all four variants render with the documented chip `background-color` and glyph `stroke`;
  - the shell has `border-radius: 14px` and the `--shadow-alert` box-shadow;
  - the destructive alert exposes `role="alert"`, the info alert `role="status"`;
  - clicking ✕ removes the info alert from the DOM and returns focus to a sensible element;
  - the warning alert has two xs buttons at 12.5px / 8px radius and no ✕.
- Motion: entry `animation-name` non-`none` at 180ms; `0.01ms` under `reducedMotion: 'reduce'`,
  and the alert text is present in the DOM on the very first frame in both modes.
- 375px: the 2-up alert grid (`[ALR:6]` `1fr 1fr`, no breakpoint) collapses to one column —
  the export leaves this undefined (UNKNOWN 7), so the collapse is authored here and stated;
  1280px stays 2-up. No horizontal overflow at 375.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `parent-auth-errors.spec.ts` and `notification-mutation-error.spec.ts` still green.

## Assumptions

- Alert grid collapse at <640px is authored (design UNKNOWN 7). One column below `sm`.

## Evidence
