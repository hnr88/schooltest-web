---
id: 237
title: Re-skin the school result card frame, typography and hover state to the design
layer: ui
kind: implement
slice: The design's §8.4 school card — box, name, meta, states
target: src/modules/school-search/components/SchoolCard.tsx, src/modules/school-search/components/SchoolCardCover.tsx
contract: C-SEARCH-SCHOOLS (incl. the coverImage amendment)
design: .qa/design/screens/portal--main.html:175-182 · .qa/design/spec/01-portal-dashboard.md#8.4
status: TODO
depends_on: []
---

## Objective

Each result card becomes the design's box: 20px radius, 20/22 padding, name over meta on the
left, a trailing fact on the right, and the design's default/selected border+shadow pair. The
existing cover-image behaviour and the card↔pin hover sync are preserved.

## Contract

`C-SEARCH-SCHOOLS` cover-media amendment (`.qa/CONTRACTS.md`): `coverImage` is `null` or
`{ url, alternativeText|null, width|null, height|null }`; *"an absent verified media relation
remains `null`; the client then renders an honest metadata-based identity tile, never a false
photo."* `school-search-presentation.spec.ts:74-75,119-121` asserts BOTH branches — the
`[data-slot="school-card-identity"]` fallback for a school with no media, and a real
`localhost:5500/uploads/` `img` for Abbotsleigh. Both must survive.

## Design source

`.qa/design/screens/portal--main.html:175-182`:

```
background:#FFFFFF; border-radius:20px; padding:20px 22px; cursor:pointer;
box-shadow:{{ s.shadow }}; border:1.5px solid {{ s.borderColor }}
```

| State | border | box-shadow | Implementation |
|---|---|---|---|
| default | `1.5px solid transparent` | `0 1px 2px rgba(14,35,80,.04)` | `border border-transparent shadow-sm` |
| selected | `1.5px solid #0E2350` | `0 8px 24px rgba(14,35,80,.12)` | `border-navy-900 shadow-lg` (`--shadow-lg` is exactly `0 8px 24px oklch(0.2692 0.0871 263.0388 / 12%)`) |

| Element | Design | Implementation |
|---|---|---|
| Box | white, r20, `20px 22px` | `rounded-2xl bg-card px-5.5 py-5` (`--radius-2xl` = `calc(var(--radius) * 1.8)` = 18px; if W0 lands `--radius-card: 1.25rem` use it) |
| Top row | flex, `align-items:flex-start`, `justify-content:space-between`, gap 12 | `flex items-start justify-between gap-3` |
| Name | 15.5 / 600 / `#0E2350` | `text-panel-title font-semibold text-navy-900` rendered as `<h3>` — `unified-search.spec.ts:99,140` and `agent-search-polish.spec.ts` resolve the card title via `locator('h3')`; the tag MUST stay `h3` |
| Meta | 13 / `#7C8698`, `margin-top:3px` | `mt-0.75 text-meta text-muted-foreground` — the design hex is 3.67:1 and fails AA on white |
| Trailing fact | 13 / 600 / `#0E2350`, `flex:none` | `shrink-0 text-meta font-semibold text-navy-900` |

The card KEEPS its cover slot. The design's card has no image, but `C-SEARCH-SCHOOLS` and two
passing assertions make the real Strapi media a functional behaviour; the cover is laid out
ABOVE the design's top row at the same 20px radius (`rounded-t-2xl`) and the design's padding
applies to the text block below it. This deviation and its reason are stated in Assumptions.

Motion: `transition-[border-color,box-shadow,transform] duration-200 ease-out-expo`; hover and
`data-active=true` lift by `-translate-y-0.5` (the current behaviour, retained);
`motion-reduce:transition-none motion-reduce:data-[active=true]:translate-y-0`. The design
declares no hover state (§11.5 lists it as a gap) — the lift is authored, not invented data.

375px: single column, full width, no horizontal scroll; the trailing fact wraps under the meta
line rather than truncating the name.

## Files

- `src/modules/school-search/components/SchoolCard.tsx`
- `src/modules/school-search/components/SchoolCardCover.tsx` (radius only)
- `src/modules/design-system/components/media-card.tsx` — only if the design's geometry cannot be
  reached by props; prefer composing over editing a shared DS component

## Depends on

Nothing inside W8. (Task 238 fills the card's footer; 239 adds the selected state's behaviour.)

## Steps

1. Rewrite `SchoolCard`'s box and top row to the values above, keeping `data-slot="school-card"`,
   `data-active`, the four hover/focus handlers and the `activeSchoolId` boolean selector
   verbatim — `school-map.spec.ts:58-81` is built on all of them.
2. Keep `SchoolCardCover` and both its slots (`school-card-image`, `school-card-identity`).
3. Keep `SchoolCardBadges` mounted (task 238 decides its final position).
4. Re-run the map + presentation specs before anything else.

## Project rules

`schooltest-web/CLAUDE.md` §0.3 (read surrounding code before editing), §0.11 (never edit
`src/components/ui/*`). `.claude/rules/tailwind.md`: no arbitrary values, OKLCH only, animate
transform/opacity. `.claude/rules/module-pattern.md`: ≤120 lines, no logic in the component.
`.claude/rules/quality.md`: `next/image` with `fill`/dimensions, alt on every image, one `h3` per
card, 4.5:1 contrast.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the first `[data-slot="school-card"]` has computed `border-radius` ≥ 18px, padding
  `20px 22px` on the text block, and its `h3` computed `font-size` is 15.5px / weight 600.
- Hovering the card sets `data-active="true"` and exactly one `.school-map-marker--active`
  appears (`school-map.spec.ts` scenario 3, unmodified).
- `school-search-presentation.spec.ts` still passes: the no-media card shows
  `[data-slot="school-card-identity"]` and zero `img`; Abbotsleigh's card shows an `img` whose
  `src` matches `/localhost:5500\/uploads\//`.
- `unified-search.spec.ts` pagination assertion (first `h3` differs on page 2) still passes.
- At 375 the card does not overflow (`document.scrollingElement.scrollWidth <= 375`).
- axe clean at both widths; reduced-motion removes the transition and the lift.
- Zero raw hex / arbitrary values / `any` in the diff.

## Assumptions

The design's school card carries no image. The cover slot is retained because
`C-SEARCH-SCHOOLS` defines it, one live record actually has media, and two specs assert both
branches — removing it would delete functional, contracted behaviour, which D-SCOPE-3 forbids.

## Evidence

_(filled in as the task runs)_
