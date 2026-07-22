---
id: 038
title: Rebuild the Avatar family — five sizes, presence dot, overlapping stack with overflow chip
layer: ui
kind: implement
slice: Avatar (xs/sm/md/lg + stack) with tinted initials and presence indicator
target: src/modules/design-system/components/avatar-tint.tsx, src/modules/design-system/components/presence-avatar.tsx, src/modules/design-system/components/avatar-stack.tsx, src/modules/design-system/lib/initials.ts, src/modules/design-system/types/record.types.ts, src/modules/design-system/components/showcase/overlays-section.tsx, tests/e2e/ds-avatar.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--overlays.html, .qa/design/screens/ds--cards.html, .qa/design/screens/ds--navigation.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#4.6,#1.3,#5.1,#6.6b
status: TODO
depends_on: [001, 006, 007, 010, 011]
---

## Objective

Children rows (W6), the household dashboard (W5), the sidebar user block (W4) and top-performer
rows all use the same avatar. Ship the five documented sizes, the presence dot and the
overlapping stack, reusing the existing `getInitials` helper.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §4.6, verbatim — all avatars share
`display:inline-grid; place-items:center; border-radius:50%; font-weight:700`:

| size | box | font-size | background | color | sample |
|---|---|---|---|---|---|
| xs | 24×24 | 9.5px | `#EFF5FF` | `#2563EB` | MK |
| sm | 32×32 | 12px | `#2563EB` | `#fff` | JM |
| md | 40×40 | 14px | `#0E2350` | `#fff` | AK |
| md + presence | 40×40 | 14px | `#14B8A6` | `#fff` | RS |
| lg | 56×56 | 18px | `#DBEAFE` | `#16326E` | ST |

**Presence dot**: parent `position:relative`; dot `position:absolute; right:0; bottom:0;
width:11px; height:11px; border-radius:50%; background:#16A34A; border:2px solid #EEF2F7` — the
ring colour is the **demo stage** colour, so in production it must be set to the surrounding
surface colour (make it a prop, default `--color-card`).

**Stacked variant** (§1.3): 28×28, `font-size:10.5px; font-weight:700; border:2px solid #fff`;
2nd..4th get `margin-left:-8px`; backgrounds rotate `#0E2350`, `#2563EB`, `#14B8A6`; overflow chip
is `#F1F5F9` with `color:#475569` and label `+19` (= participants − 3).

**Sidebar/topbar variant** (§5.1/§5.2): 34×34, `font-size:12.5px`, backgrounds `#0E2350` /
`#14B8A6`.

## Design source

Tokens: `bg-secondary`+`text-primary` (xs) · `bg-primary`+`text-primary-foreground` (sm) ·
`bg-navy-900`+white (md) · `bg-accent`+white (md-presence) · `bg-brand-100`+
`text-secondary-foreground` (lg) · `bg-muted`+`text-body` (overflow chip) · presence
`bg-success` with a `--color-card` ring. Sizes 24/28/32/34/40/56px; type 9.5/10.5/12/12.5/14/18px
— all as named W0 tokens, never arbitrary.

Motion: an avatar that appears in a stack plays `st-pop-in` (`--animate-pop-in`, 180ms opacity +
scale .96→1), staggered 40ms per index so a household of children reads as arriving, not
flickering. Reduced-motion from W0 removes both.

## Files

- `avatar-tint.tsx` — the base (wraps `Avatar`/`AvatarFallback` from `@/components/ui/avatar`);
  keep the exported `getAvatarTone`.
- `presence-avatar.tsx` — md + dot; `ringColor` prop.
- `avatar-stack.tsx` — overlap + overflow chip; `max` prop (design uses 3).
- `lib/initials.ts` — reuse; extend only for single-word and non-Latin names (zh/ko/th are live
  locales — a two-letter Latin initial rule must not mangle 张明).
- `types/record.types.ts` — `AvatarStackEntry`, `AvatarStackProps`; `types/design-system.types.ts`
  — `AvatarTintSize`, `PresenceAvatarSize`.
- showcase `overlays-section.tsx`; `tests/e2e/ds-avatar.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

## Steps

1. Every avatar needs an accessible name: either `alt` on a real image or `aria-label` with the
   full person name — initials alone are not a name. The initials span is `aria-hidden`.
2. Presence dot is decorative unless `presenceLabel` is given; if given it renders as
   `sr-only` text, never colour-only status.
3. Stack: `+N` chip carries `aria-label` = `t('avatarStackMore', { count })` with ICU plural.
4. `getInitials` must handle CJK (take the first character), single names, and names with
   diacritics; add unit-level coverage through the e2e by rendering the cases in the showcase.
5. Six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`avatar.tsx` read-only), law 14, law 15.
- `.claude/rules/module-pattern.md` (`getInitials` stays a pure helper in `lib/`);
  `.claude/rules/tailwind.md` (no `w-[34px]`); `.claude/rules/quality.md` (accessible names,
  contrast on every tint pair); `.claude/rules/i18n.md` (ICU plural for `+N`);
  `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-avatar.spec.ts` asserts on `/design-system`: each of the five sizes reports its
  exact `boundingBox()` and `font-size`; the presence dot is 11×11 with a 2px ring whose colour
  equals the surrounding surface token; the stack overlaps by 8px (measure the x-delta between
  consecutive avatars = box − 8) and the `+19` chip carries a plural-correct accessible name in
  `en` and `zh`; every avatar exposes a non-empty accessible name.
- `getInitials` renders `张明` → `张`, `Mia` → `M`, `Mia Kessler` → `MK` (assert in the showcase).
- Motion: stack entries play `st-pop-in` with a 40ms stagger; `0.01ms` under `reducedMotion`.
- 375px + 1280px, no overflow; axe zero serious/critical; six catalogs key-identical; zero
  banned-pattern hits.
- `dashboard-students.spec.ts` and `children-profile.spec.ts` still green.

## Assumptions

- The presence ring colour is a prop (the export hard-codes the demo stage `#EEF2F7`, which would
  be wrong on a white card).

## Evidence
