---
id: 004
title: Settle the spacing scale against the design's off-4pt values and land the 1240px page frame token
layer: ui
kind: implement
slice: The layout frame — the design's universal 1240px container cap as a token, and the binding rule for how its off-grid paddings are written without arbitrary values
target: src/app/globals.css (`@theme inline`), src/lib/utils.ts (`THEME_CLASS_GROUPS['max-w']`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/spec/04-ds-foundations.md#9-responsive-behaviour-present-in-the-markup, #10-radius-spacing-and-size-inventory, #TAILWIND-V4-MAPPING-J · .qa/design/screens/ds--colors.html:1 · ds--header.html:2
status: TODO
depends_on: []
---

## Objective

`.qa/design/spec/04-ds-foundations.md` §J states a decision that must be made ONCE, before any
primitive is built: the design is not on a 4pt grid (`7, 9, 11, 13, 15, 17, 18, 22, 26px` all
appear) while `.claude/rules/tailwind.md:3` bans arbitrary values. Left unmade, 38 W1 tasks each
guess. This slice makes it, proves it in the running app, and lands the one layout token the design
uses on every single section that the repo has no equivalent for.

## Contract

n/a. Binding sources:

> `.qa/design/spec/04-ds-foundations.md` §J: "**(a) Faithful:** define named tokens so no square
> brackets are needed … **(b) Normalised:** snap to 4pt … accept ~1–2px drift per component. Two
> options — pick one before implementing, do not mix."
>
> §9: "Page container cap `max-width:1240px; margin:0 auto` — every section `[HDR:2]`, `[LOGO:1]`,
> `[COL:1]`, `[TYP:1]`, `[BTN:1]`, `[FRM:1]`, `[BDG:1]`, `[ALR:1]`". "Section padding `64px 48px 0`
> (masthead: `64px 48px 56px`) — fixed, does **not** shrink."

## Design source

**Resolution: neither (a) nor (b) verbatim — Tailwind v4's built-in fractional spacing scale
already expresses every value the design uses, at 1px granularity, with no square brackets and no
new tokens.** Tailwind v4 derives `p-<n>` as `calc(var(--spacing) * n)` with `--spacing: 0.25rem`,
so quarter steps are first-class. This is not theoretical: `gap-2.75` (11px), `size-4.25` (17px),
`px-5.5` (22px), `p-6.5` (26px), `px-3.5` (14px) and `px-4.5` (18px) already ship in
`src/modules/**` today. §J option (a)'s named tokens are therefore refused as redundant, and
option (b)'s 1–2px drift is refused as a loss of the pixel-close guarantee.

The canonical mapping every later wave writes against — this table IS the deliverable:

| Design px | Utility | Design px | Utility |
|---|---|---|---|
| 2 | `0.5` | 15 | `3.75` |
| 3 | `0.75` | 16 | `4` |
| 4 | `1` | 17 | `4.25` |
| 5 | `1.25` | 18 | `4.5` |
| 6 | `1.5` | 20 | `5` |
| 7 | `1.75` | 22 | `5.5` |
| 8 | `2` | 24 | `6` |
| 9 | `2.25` | 26 | `6.5` |
| 10 | `2.5` | 28 | `7` |
| 11 | `2.75` | 32 | `8` |
| 12 | `3` | 36 | `9` |
| 13 | `3.25` | 48 | `12` |
| 14 | `3.5` | 64 | `16` |

The five load-bearing composites that W1 will write constantly, spelled out so nobody re-derives
them: default button `padding:10px 18px` → `px-4.5 py-2.5`; outline button `9px 17px` →
`px-4.25 py-2.25`; sm button `7px 13px` → `px-3.25 py-1.75`; lg button `13px 26px` →
`px-6.5 py-3.25`; input `10px 13px` → `px-3.25 py-2.5`; search input `10px 13px 10px 38px` →
`py-2.5 pr-3.25 pl-9.5`; badge `4px 11px` → `px-2.75 py-1`; alert shell `15px 16px` →
`px-4 py-3.75`; card `28px` → `p-7`; section `64px 48px` → `px-12 py-16`.

**The one real token gap.** Every DS and portal section is capped at `max-width:1240px`. The repo
has `--container-landing: 1200px` and `--container-hero: 1360px` — neither is 1240. Add:

```
--container-board: 77.5rem;  /* 1240px — universal section cap, §9 [HDR:2] [COL:1] [TYP:1] */
```

`1240 / 16 = 77.5`.

**Mobile, named explicitly.** §9 records that the design's `64px 48px` section padding is fixed and
"does **not** shrink", and §9's Consequence line says the collapse behaviour "is undefined by the
design and must be decided by the engineer". At 375px, `px-12` (48px) leaves a 279px measure and
`max-w-board` is inert. The binding decision for every later wave: **section padding is
`px-5 py-10` below `sm` and `px-12 py-16` from `sm` up** (20px/40px → 48px/64px), because 48px of
side padding on a 375px viewport is a 26% gutter and would force the design's fixed
`repeat(3,1fr)` / `repeat(6,1fr)` grids into unreadable columns. Recorded here as the single source
so no screen task invents its own.

## Files

- `src/app/globals.css` — one line in `@theme inline`, next to `--container-landing`.
- `src/lib/utils.ts` — add `'board'` to `THEME_CLASS_GROUPS['max-w']`. **Mandatory**: the
  `TOKENS: every --container-* @theme token is registered in the "max-w" classGroup` test in
  `tests/e2e/design-tokens.spec.ts` fails on an unregistered token, and an unregistered `max-w-*`
  silently loses to a competing width class through tailwind-merge.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: spacing + frame` block.

## Depends on

Nothing.

## Steps

1. Add `--container-board: 77.5rem;` with the provenance comment.
2. Register `'board'` in `THEME_CLASS_GROUPS['max-w']` in `src/lib/utils.ts`.
3. Extend the e2e with the four proofs in Done criteria. Prove the fractional steps ON A REAL
   ELEMENT that already ships them — `src/modules/design-system/components/button.tsx` renders
   `px-4.5` (18px) at `size="default"` and `px-3.5` (14px) at `size="sm"` — so no probe markup is
   invented for the common cases; a `page.evaluate`-injected probe covers only `px-3.25` and
   `pl-9.5`, which no component uses yet.
4. Change no component. This task moves no pixel on any existing screen.

## Project rules

- `.claude/rules/tailwind.md:2` enumerates `p-1 p-2 p-3 p-4 p-6 p-8 p-12 p-16 p-24`. Read as the
  4pt *ladder* for page-level rhythm, not an exhaustive allow-list — `:3` bans **arbitrary values**
  (`p-[23px]`), which a generated fractional step is not, and `:4` caps the maximum at `p-24`.
  The repo's own shipped code has relied on this reading since mission-2. Recorded, not assumed.
- `.claude/rules/tailwind.md:6` — `gap-*` for sibling spacing, never margin. The design's
  `display:flex; flex-direction:column; gap:Npx` shells map straight onto this.
- `.claude/rules/tailwind.md:4` — max `p-24`; the design's largest is `64px` = `p-16`. No conflict.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`: `getComputedStyle(document.documentElement).getPropertyValue('--container-board').trim()`
  is `'77.5rem'`, and an element with `max-w-board` computes `max-width: 1240px`.
- The `max-w` classGroup parity test passes with `'board'` registered — and, as a negative proof,
  the verifier confirms it FAILS if `'board'` is removed (run once, revert).
- Fractional-step proof against the running app: the default `Button` on `/design-system` computes
  `padding-left: 18px`; the `sm` Button computes `padding-left: 14px`; an injected probe with
  `class="px-3.25 pl-9.5 gap-2.75"` computes `13px`, `38px`, `11px`. If any of these does not
  generate, the fallback is a named `--spacing-*` token per §J(a) — record which, do not use
  brackets.
- Mobile: at 375px, `document.documentElement.scrollWidth <= 375` on `/design-system` and
  `/dashboard` (no horizontal overflow introduced).
- Motion: none in this slice; state so.
- axe zero serious/critical at 375 and 1280.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits — in particular zero `[`-bracket spacing utilities in the diff.
- Full suite at the 157-pass baseline.

## Assumptions

- Tailwind v4 in this repo generates arbitrary quarter-step spacing utilities on demand. Evidenced
  by shipped usage (`gap-2.75`, `size-4.25`, `p-6.5`, `px-5.5`) rendering correctly in the current
  green suite; re-proven here rather than trusted.
- The `px-5 py-10` mobile section padding is an engineering decision the design does not make
  (§9 Consequence). It is recorded here as the wave-wide default so it is made once and visibly,
  rather than 24 times invisibly.

## Evidence

<!-- --container-board resolved value, max-w-board computed max-width, the four padding probes,
     the negative parity-test run, scrollWidth at 375, axe summary, suite pass count -->
