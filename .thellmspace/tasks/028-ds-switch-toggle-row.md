---
id: 028
title: Rebuild the Switch (40×22 track, 18px travel) and the settings ToggleRow it sits in
layer: ui
kind: implement
slice: Switch + ToggleRow (settings list row with title, description and switch)
target: src/modules/design-system/components/switch-control.tsx, src/modules/design-system/components/toggle-row.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/choice-controls.tsx, tests/e2e/ds-switch.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--forms.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/04-ds-foundations.md#5.7, .qa/design/spec/05-ds-components.md#6.11a
status: TODO
depends_on: [001, 004, 006, 007, 008, 010, 013, 026]
---

## Objective

The switch is the control behind the notification-preference surface (W9) — the one surface with
a **known live defect** (`.qa/PLAN.md` regression baseline: SMS opt-out does not survive reload).
This task re-skins the control only; the persistence fix is W9's. `ToggleRow` already exists and
is re-cut here, not replaced.

## Contract

n/a. `.qa/design/spec/04-ds-foundations.md` §5.7 + `05-ds-components.md` §6.11a, verbatim:

- Row `[FRM:74-84]`: `display:flex; align-items:center; gap:12px; cursor:pointer;
  user-select:none`.
- Track: `position:relative; display:inline-block; width:40px; height:22px; border-radius:999px;
  background:<bg>; transition:background .18s`.
- Knob: `position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%;
  background:#FFFFFF; box-shadow:0 1px 3px rgba(14,35,80,.25); transform:<t>;
  transition:transform .18s`.

| state | track | knob transform |
|---|---|---|
| off | `#CBD5E1` | `translateX(0)` |
| on | `#2563EB` | `translateX(18px)` |
| disabled / hover / focus-visible | not specified (UNKNOWNS 3, 4) |

Travel maths: `40 − 18 − 2 − 2 = 18px` — the transform matches exactly. Do not round.

Settings row `ds--dashboard-components.html:127-135`: `display:flex; align-items:center;
justify-content:space-between; gap:14px; padding:14px 0; border-bottom:1px solid #F1F5F9`; the
**last row has no bottom border**. Title `13.5px / 600 / #0E2350`; description `12px / #94A3B8;
margin-top:2px`.

## Design source

Tokens: `#CBD5E1` → `bg-input`; `#2563EB` → `bg-primary`; knob `bg-card` + `--shadow-knob`
(`0 1px 3px oklch(0.2692 0.0871 263.04 / 0.25)`); row divider `#F1F5F9` → `border-muted`;
title `--font-size-label` (13.5px) `text-foreground`; description 12px
`text-muted-foreground` — **not** `#94A3B8`, which is 2.8:1 on white and fails
`.claude/rules/quality.md`'s 4.5:1; the substitution is recorded in Evidence.

Motion: track `transition-[background-color] duration-[--duration-switch] ease-out-quart`
(180ms — the design's `.18s`), knob `transition-transform duration-[--duration-switch]
ease-out-quart` (a transform animation, fully compliant). Reduced-motion from W0.

Focus-visible: keep the vendored `focus-visible:ring-3 focus-visible:ring-ring/50` on the track.

## Files

- `src/modules/design-system/components/switch-control.tsx` — **new**; wraps `Switch` from
  `@/components/ui/switch` (read-only).
- `src/modules/design-system/components/toggle-row.tsx` — re-cut to the row spec; keep its current
  props so `src/modules/notifications` and `src/modules/settings` keep compiling.
- `src/modules/design-system/types/primitives.types.ts` — `SwitchControlProps`; `ToggleRowProps`
  gains `isLast?`.
- showcase `choice-controls.tsx`, `tests/e2e/ds-switch.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **026** — the shared row / label / disabled treatment.

## Steps

1. Wrap `Switch`; the visible control keeps `role="switch"` and `aria-checked` from the primitive.
2. Knob travel is a `translate-x-*` token equal to 18px; never `translate-x-[18px]`.
3. `ToggleRow` renders `<label>` + description with `aria-describedby`; the last row drops its
   border via `last:border-b-0`, not a prop-driven conditional class where avoidable.
4. **Preserve behaviour:** `ToggleRow`'s existing `checked`/`onCheckedChange`/`name` props and the
   notification-preference call sites must keep working; do not change the control's value
   semantics (W9 owns the persistence bug).
5. i18n showcase strings; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 3 (never break existing logic — read `notifications/components/*` before
  touching `ToggleRow`), law 11, law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (animate transform/opacity —
  the knob is a transform, the track colour is the documented exception; no arbitrary values);
  `.claude/rules/quality.md`; `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-switch.spec.ts` asserts on `/design-system`:
  - `getByRole('switch', { name: 'Timed test' })` is `aria-checked="true"`, `Email me results`
    is `false`;
  - track `boundingBox()` 40×22, `border-radius` ≥ 999px-equivalent; knob 18×18;
  - the ON knob's computed `transform` matrix has `translateX` = 18px, the OFF knob 0px;
  - clicking the row title toggles the switch (row is the hit target);
  - focus ring visible on `Tab`.
- Motion: `transition-duration` 180ms on both track and knob; `0.01ms` under
  `reducedMotion: 'reduce'`.
- 375px: the row does not wrap the switch under the text; ≥44px hit target; no horizontal scroll.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `notification-preference-controls.spec.ts` shows **no new failures** beyond the one pre-existing
  red at line 75 recorded in `.qa/PLAN.md`; `notification-preferences.spec.ts` and
  `settings-tabs.spec.ts` stay green.

## Assumptions

- The pre-existing SMS opt-out persistence failure is W9's task, not this one. This task must not
  "fix" it by changing control semantics, and must not mask it either.

## Evidence
