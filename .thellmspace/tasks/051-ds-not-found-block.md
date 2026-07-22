---
id: 051
title: Rebuild the 404 block — 64px numeral with the logo mark as the zero
layer: ui
kind: implement
slice: NotFound block (the reusable 404 composition)
target: src/modules/design-system/components/not-found-block.tsx, src/modules/design-system/types/brand.types.ts, src/app/[locale]/not-found.tsx, src/modules/design-system/components/showcase/feedback-section.tsx, tests/e2e/ds-not-found.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--footers.html, .qa/design/spec/05-ds-components.md#7.4, .qa/design/spec/06-auth-states-landing.md
status: TODO
depends_on: [001, 006, 007, 010, 011, 020, 035, 039]
---

## Objective

`src/app/[locale]/not-found.tsx` already renders a 404 card using `Logo` + `Button`
(`.qa/intake/web-inventory.md`). Re-cut it to the export's composition, and factor the block into
the design system so W10's 404 route and any in-app "not found" panel share it.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §7.4 (`ds--footers.html:78-86`), verbatim:

- Card: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:36px;
  display:flex; flex-direction:column; align-items:center; text-align:center` (**no shadow**).
- Numeral: `font-size:64px; font-weight:700; letter-spacing:-0.04em; color:#0E2350;
  line-height:1; display:flex; align-items:center; gap:12px` — the literal characters `4` … `4`
  with `assets/logo-mark.png` (`alt="0"`, `height:52px; width:auto`) standing in for the zero.
- Title: `font-size:16px; font-weight:600; color:#0E2350; margin-top:16px` — `This page hopped
  away`.
- Body: `font-size:13.5px; color:#64748B; margin-top:5px; max-width:300px` — `The link may be
  broken, or the test may have been deleted.`
- Buttons: `display:flex; gap:10px; margin-top:18px` — primary `Back to dashboard`
  (`#2563EB`, `padding:9px 17px; border-radius:9px; font-size:13.5px; font-weight:600`,
  hover `#1D4ED8`) and outline `Report a problem` (`padding:8px 16px`, `1px solid #CBD5E1`,
  `color:#16326E`, hover `#F7F9FC`).

## Design source

Tokens: card `bg-card`/`border-border`/`--radius-2xl`, `shadow-none`, padding 36px token;
numeral `--font-size-404` (64px, weight 700, `tracking-[-0.04em]` → W0 `--tracking-display-tight`)
`text-foreground`; title `--font-size-body` (16px) weight 600; body `--font-size-label` (13.5px)
`text-muted-foreground` at a 300px measure; buttons = task 020's `default` and `outline`.

Motion: the numeral's mark-as-zero plays `st-pop-in` (180ms, opacity + scale) on mount and the
copy fades 80ms behind it. Reduced-motion from W0 renders everything statically. No looping
animation — a 404 that pulses is noise.

## Files

- `src/modules/design-system/components/not-found-block.tsx` — **new**.
- `types/brand.types.ts` — `NotFoundBlockProps { title, description, primaryAction,
  secondaryAction }`.
- `src/app/[locale]/not-found.tsx` — re-point at the block. **This is the only file outside the
  module this task touches**; its existing metadata/locale behaviour is preserved.
- showcase `feedback-section.tsx`; `tests/e2e/ds-not-found.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **035** — the card shell.
- **039** — the logo-mark asset handling.
- **020** — the two buttons.

## Steps

1. The numeral is decorative typography: wrap it so a screen reader reads "404" once — the mark
   image carries `alt="0"` exactly as the design specifies, and the two `4`s are plain text. Do
   **not** also put "404" in the heading.
2. The mark is `next/image` with explicit `width`/`height` (`.claude/rules/quality.md`).
3. The page's real `<h1>` is the title, not the numeral — keep heading order valid.
4. `Back to dashboard` uses `Link` from `@/i18n/navigation` so the locale prefix survives
   (`.claude/rules/i18n.md`: never a bare `<a>`).
5. i18n title/body/both button labels; six catalogs. `Report a problem` links to the existing
   support destination if one exists; if none exists, the secondary action is **omitted**, not
   pointed at a dead URL (`.qa/DECISIONS.md` D-SCOPE-1: do not invent).
6. E2E.

## Project rules

- `CLAUDE.md` law 3 (`not-found.tsx` is live), law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md`; `.claude/rules/quality.md`
  (one `<h1>`, `next/image`, contrast); `.claude/rules/i18n.md` (locale-aware `Link`);
  `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-not-found.spec.ts` asserts, on a **real 404 route** (`/en/this-does-not-exist`)
  and on `/design-system`:
  - the numeral is 64px/700 with `letter-spacing: -0.04em` and the mark image is 52px tall with
    `alt="0"`;
  - the accessible text of the numeral row is exactly `404` (no duplication);
  - the page has exactly one `<h1>` and it is the title;
  - `Back to dashboard` navigates to the locale-prefixed dashboard (`/en/dashboard`), and the
    same test in `zh` lands on `/zh/dashboard`;
  - the card has `box-shadow: none` and 36px padding.
- Motion: mark plays a 180ms `st-pop-in`; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: the numeral does not overflow and the buttons stack; 1280px side by side.
- axe zero serious/critical on the 404 route; six catalogs key-identical; zero banned-pattern hits.
- `locale-routing.spec.ts` still green.

## Assumptions

- `Report a problem` is omitted unless a real destination exists in the repo — a button that goes
  nowhere is invention.

## Evidence
