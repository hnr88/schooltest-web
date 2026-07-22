---
id: 034
title: Skin sonner to the export's toast — navy surface, st-toast-in, 4s auto-dismiss, progress rail
layer: ui
kind: implement
slice: Toast — the app-wide sonner surface in both the dark and light variants
target: src/modules/design-system/components/toast.tsx, src/modules/design-system/lib/toast.ts, src/modules/design-system/types/primitives.types.ts, src/app/[locale]/layout.tsx, src/modules/design-system/components/showcase/feedback-section.tsx, tests/e2e/ds-toast.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--alerts.html, .qa/design/screens/ds--dark-mode.html, .qa/design/spec/04-ds-foundations.md#7.3, .qa/design/spec/05-ds-components.md#4.5
status: TODO
depends_on: [001, 003, 006, 007, 008, 010, 011, 021]
---

## Objective

`sonner` is already the mandated toast library and `<Toaster />` is already mounted at
`src/app/[locale]/layout.tsx:68`. This task skins it to the export's two toast surfaces and wires
the design's documented behaviour (bottom-right, `st-toast-in`, 4000ms auto-dismiss) without
replacing the library or moving the mount point.

## Contract

n/a. `.qa/design/spec/04-ds-foundations.md` §7.3 + `05-ds-components.md` §4.5, verbatim.

**Live toast** (`ds--dark-mode.html:48`):
```
position:fixed; right:24px; bottom:24px; z-index:95;
display:flex; align-items:center; gap:12px;
background:#0E2350; color:#FFFFFF; padding:14px 16px; border-radius:12px;
box-shadow:0 16px 40px rgba(14,35,80,.35);
animation:st-toast-in .25s ease; max-width:340px
```
Leading icon 17×17 `circle-check`, `stroke:#2DD4BF`, `stroke-width:2.2`, `flex:none`.
Title `13.5px / 600` white; description `12.5px; color:#A9BADC; margin-top:1px`.
Dismiss 26×26, radius 7px, `color:#8FA3C7`, hover `background:#16326E`, 13×13 ✕ at 2.4.
Behaviour: `showToast()` starts a **4000ms** timer that hides it; the timer is cleared on
re-trigger and on unmount. **No exit animation exists in the export** (UNKNOWN) — one is authored.

**Light / progress toast** `[ALR:46-51]`: `background:#FFFFFF; border:1px solid #E3E8F0;
padding:13px 14px 17px; border-radius:12px; box-shadow:0 12px 32px rgba(14,35,80,.14);
max-width:330px`; 32×32 `#EFF5FF` chip with a 15×15 `#2563EB` download glyph; title
`13.5px/600/#0E2350`; body `12.5px/#64748B`; progress rail `position:absolute; left:14px;
right:14px; bottom:7px; height:3px; border-radius:999px; background:#EEF2F7` with a `#2563EB`
fill whose width equals the reported percentage.

`st-toast-in` keyframe: `from { opacity:0; transform:translateY(12px) } to { opacity:1;
transform:none }`, `.25s ease`.

## Design source

Tokens: `#0E2350` `--color-toast-surface` · `#A9BADC` `--color-toast-body` · `#2DD4BF`
`--color-toast-icon` · `#8FA3C7` `--color-toast-dismiss` · hover `#16326E` `bg-navy-800` ·
`--shadow-toast-live` (`0 16px 40px oklch(0.2692 0.0871 263.04 / 0.35)`) ·
`--shadow-toast` (`… / 0.14` light) · `--radius-lg` (12px) · `--radius-chip-lg` (9px chip) ·
`--radius-chip` (7px dismiss) · `#EEF2F7` `--color-rule` (rail track).
Type `--font-size-label` (13.5px) / `--font-size-caption` (12.5px).

Motion: `--animate-toast-in` (`toast-in 250ms var(--ease-out-quart)`) on enter;
`animate-out fade-out-0 slide-out-to-bottom-2 duration-150` on exit (authored — the export has
none). Under `prefers-reduced-motion` the toast appears and disappears with **no** transform, but
still auto-dismisses after 4000ms.

## Files

- `src/modules/design-system/components/toast.tsx` — a `<StToaster />` wrapping
  `Toaster` from `@/components/ui/sonner` (read-only) with `position="bottom-right"`,
  `duration={4000}`, `offset` 24px, and the classNames map for surface/title/description/close.
- `src/modules/design-system/lib/toast.ts` — the typed call surface
  (`toastSuccess`, `toastError`, `toastProgress`) so no component imports `sonner` directly.
- `src/app/[locale]/layout.tsx` — swap `<Toaster />` for `<StToaster />`. **This is the only file
  outside the design-system module this task may touch.**
- `types/primitives.types.ts` — `ToastProgressProps`.
- showcase `feedback-section.tsx` — a "Trigger toast" navy button (`[ALR:53]`) and a progress
  toast; `tests/e2e/ds-toast.spec.ts`.

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

- **021** — the 26px dismiss button.

## Steps

1. Read `src/components/ui/sonner.tsx` — it already sets `--normal-bg/--normal-text/
   --normal-border/--border-radius` from tokens and a `cn-toast` class. Override through
   `toastOptions.classNames` on the wrapper, never by editing that file.
2. Map the design's dark surface onto the **default** toast (the export's default toast is navy in
   light mode — it is deliberately not theme-following); the light/progress form is the
   `toastProgress` variant.
3. Auto-dismiss 4000ms; the dismiss button clears the timer immediately.
4. Progress rail: an absolutely-positioned track + fill; the fill's width is the data value as an
   inline `style` percentage (data, not an arbitrary Tailwind value).
5. `aria-live`: sonner's region is polite by default; errors go through `toastError` which sets
   `aria-live="assertive"`.
6. i18n every toast string at the call site (the lib takes already-translated strings — it must
   not import `next-intl`); showcase strings in six catalogs.
7. E2E.

## Project rules

- `CLAUDE.md` law 11 (`sonner.tsx` read-only), law 2 (stack table: **sonner only**, never
  react-toastify), law 14, law 15.
- `.claude/rules/module-pattern.md` (the imperative API is a `lib/`, not a hook);
  `.claude/rules/tailwind.md` (animate transform/opacity only — `st-toast-in` complies);
  `.claude/rules/i18n.md` (no hardcoded toast copy); `.claude/rules/quality.md`;
  `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-toast.spec.ts` asserts on `/design-system`:
  - clicking `Trigger toast` shows a toast whose computed `background-color` = resolved
    `--color-toast-surface`, `border-radius` 12px, `box-shadow` = `--shadow-toast-live`;
  - it is positioned bottom-right (`right`/`bottom` ≈ 24px) with `z-index` above the page;
  - its `animation-name` on enter is non-`none` and `animation-duration` is 250ms;
  - it auto-dismisses: the node is gone after 4.5s and **still present** at 3.5s
    (both asserted, so the timer is proven rather than assumed);
  - the ✕ dismisses immediately and is labelled;
  - the progress toast renders a rail whose fill width equals the given percentage.
- Reduced motion: `animation-duration` 0.01ms and the toast still auto-dismisses at 4s.
- 375px: toast honours `max-width: 340px` but never exceeds `100vw - 48px`; no horizontal scroll.
- axe zero serious/critical on `/design-system` with a toast open.
- Six catalogs key-identical; zero banned-pattern hits.
- Full suite still at baseline — `layout.tsx` is shared by every route, so re-run the whole suite,
  not just this spec.

## Assumptions

- The exit animation is authored (design UNKNOWN 15) and stacking uses sonner's default gap.
- The navy toast surface is intentionally fixed in light mode; dark mode keeps the same surface,
  which §8.7's `--popover` `#162240` would otherwise override — the export's toast is hard-coded
  navy in both, so the token `--color-toast-surface` is theme-invariant.

## Evidence
