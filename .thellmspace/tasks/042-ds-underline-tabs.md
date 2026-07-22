---
id: 042
title: Rebuild UnderlineTabs — 2px indicator over the 1px rule, 150ms colour transition
layer: ui
kind: implement
slice: Underline tabs + their panels
target: src/modules/design-system/components/underline-tabs.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/data-section.tsx, tests/e2e/ds-tabs.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--tabs.html, .qa/design/spec/05-ds-components.md#3.1
status: TODO
depends_on: [001, 004, 005, 007, 010, 011, 013]
---

## Objective

The child-detail surface (W6) and settings (W9) both use tabs. `UnderlineTabs` already exists;
re-cut it to the export and give the indicator the motion the design lacks.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §3.1, verbatim:

- Tablist: `display:flex; gap:26px; border-bottom:1px solid #E3E8F0`.
- Tab button: `background:none; border:none; cursor:pointer; font-size:14px; font-weight:600;
  padding:0 2px 12px; color:<c>; border-bottom:2px solid <b>; margin-bottom:-1px;
  transition:color .15s`. The `margin-bottom:-1px` pulls the 2px indicator over the 1px rule.
- Active → `color:#2563EB`, `border-bottom-color:#2563EB`.
- Inactive → `color:#64748B`, `border-bottom-color:transparent`.
- The transition is on **`color` only**; the border colour change is instant. **No hover state is
  declared.**
- Panel: `padding:16px 2px 0; font-size:14px; color:#64748B`.

## Design source

Tokens: rule `border-border`; active `text-primary` + `border-primary`; inactive
`text-muted-foreground` + `border-transparent`; `--font-size-body-sm` (14px); gap 26px via the
W0 spacing token; panel `--font-size-body-sm` `text-muted-foreground`.

Motion: `transition-[color] duration-150 ease-out-quart` as declared, **plus** a sliding indicator
— a single absolutely-positioned 2px bar that `translateX`/`scaleX`es to the active tab over
180ms `ease-out-quart` (transform-only, compliant). This is an addition over the export's instant
border swap and is recorded as such. Panel content cross-fades with `--animate-fade-in` (180ms
opacity). Reduced-motion from W0 makes both instant.

Focus-visible: the export declares none (UNKNOWN). Keep the vendored primitive's
`focus-visible:ring-3 focus-visible:ring-ring/50` on the tab trigger.

## Files

- `src/modules/design-system/components/underline-tabs.tsx` — re-cut; wraps `Tabs*` from
  `@/components/ui/tabs` (read-only, re-exported via `primitives/data.ts`). Keep the existing
  `UnderlineTabOption` prop shape so `children` and `settings` modules keep compiling.
- `types/primitives.types.ts` — `UnderlineTabsProps` (+ `panelClassName`).
- showcase `data-section.tsx`; `tests/e2e/ds-tabs.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **005** — the eight published type steps.
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

## Steps

1. Keep the primitive's `role="tablist"/"tab"/"tabpanel"` + `aria-selected` + `aria-controls`
   wiring — do not re-author roles.
2. Keyboard: Left/Right move between tabs, Home/End jump; activation follows selection
   (automatic activation) as the primitive implements it.
3. The sliding indicator is one element positioned from the active trigger's offset — measure with
   a ref, never with `window` at module scope (`CLAUDE.md` §5 pitfall 14).
4. Overflow at 375px: the tablist scrolls horizontally inside its own `overflow-x-auto` container
   with the existing `scroll-region-x` `@utility`, and the page body must not scroll.
5. i18n tab labels + panel copy; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 3 (children/settings consume `UnderlineTabs`), law 11, law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (transform/opacity only;
  no arbitrary gaps); `.claude/rules/quality.md` (tab semantics, keyboard, visible focus);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-tabs.spec.ts` asserts on `/design-system`:
  - `getByRole('tab', { name: 'Overview' })` has `aria-selected="true"`, `color` = resolved
    `--color-primary`, and a 2px bottom border in the same colour;
  - inactive tabs are `--color-muted-foreground` with a transparent border;
  - `ArrowRight` moves selection and swaps the visible `tabpanel`;
  - the tablist has a 1px bottom rule and the indicator overlaps it (indicator's bottom edge is
    within 1px of the rule's).
- Motion: the indicator's `transition-property` includes `transform` at 180ms; colour at 150ms;
  both `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: the tablist scrolls inside its own container, `document.documentElement.scrollWidth <=
  clientWidth`; 1280px: all tabs visible with a 26px gap.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `settings-tabs.spec.ts` and `children-profile.spec.ts` still green.

## Assumptions

- The sliding indicator is an addition (the export swaps the border instantly). It degrades to an
  instant swap under reduced motion, so nothing is lost.

## Evidence
