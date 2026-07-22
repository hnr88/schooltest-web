---
id: 112
title: Sidebar logo lockup — 26px, flush left, 36px breathing room, focus ring the design never drew
layer: ui
kind: build
slice: The rail's logo link (desktop card + collapsed icon rail + mobile Sheet)
target: src/modules/shell/components/SidebarLogoLink.tsx
contract: n/a — pure presentation; design spec quoted below
design: .qa/design/screens/portal--detached-sidebar.html:3, .qa/design/spec/01-portal-dashboard.md#12-detached-sidebar--portal--detached-sidebarhtml231
status: TODO
depends_on: ["111"]
---

## Objective

Bring the rail's logo to the detached design's exact lockup — `height:26px`, `width:auto`,
`align-self:flex-start`, `margin:0 12px 36px` — while keeping the link, the localized alt text and
the collapsed-rail mark variant that the e2e suite already asserts.

## Contract

n/a. `portal--detached-sidebar.html:3`, verbatim:

```html
<img src="assets/logo.png" alt="SchoolTest"
     style="height:26px;width:auto;align-self:flex-start;margin:0 12px 36px" />
```

**PRESERVED BEHAVIOUR:** the logo is a `<Link href="/dashboard">` (design has no link — the app
does, and it works today; keep it). `Shell.sidebar.logoAlt` stays the alt text.
`shell.spec.ts`'s collapsed-rail test asserts
`aside.getByRole('img', { name: cat(en,'Shell.sidebar.logoAlt') })` is visible **after** Ctrl+B —
so the collapsed branch must keep rendering an `<img>` with that accessible name.

## Design source

| Property | Design value | Utility |
|---|---|---|
| height | `26px` | `<Logo height={26} />` (the component computes `width` from the intrinsic 503×160 ratio → 82×26) |
| align | `align-self:flex-start` | `self-start` |
| margin | `0 12px 36px` | `mx-3 mb-9` |
| collapsed rail | design has none (UNKNOWNS §1) — keep the existing `variant="mark"` at 24px, `mb-4`, `ml-0` |

Focus + hover are **authored** (`01-portal-dashboard.md` §11.5 and UNKNOWNS: the export declares no
focus state anywhere and no hover on the rail):
- focus: `focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none`
  (`--sidebar-ring` = `oklch(0.5461 0.2152 262.8809 / 35%)` = the design's own `--ring`).
- hover: `hover:opacity-80`, `transition-opacity duration-200 ease-out-expo`
  (`--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`), `motion-reduce:transition-none`.
  Opacity is one of the two properties `.claude/rules/tailwind.md` allows to animate.
- pointer target: the drawn lockup is 82×26 — under the 44px minimum in height. Keep the existing
  `relative` + `after:absolute after:-inset-2.5` idiom (26 + 2×10 = 46px) that already ships; it is
  a real fix, not decoration.

## Files

- `src/modules/shell/components/SidebarLogoLink.tsx` — the class string and the two `<Logo>`
  heights only. `Logo` itself (`src/modules/design-system/components/logo.tsx`) is NOT edited.

## Depends on

- **111** — the header's padding (`pt-7 px-4`) must already be the design's, or the 12px logo
  margin composes against the wrong box.

## Steps

1. Change `height={30}` → `height={26}` on the lockup; keep `variant="mark" height={24}` for the rail.
2. Change `mb-5.5 ml-2` → `mb-9 mx-3`; keep `self-start`, `relative`, the `after:-inset-2.5` target,
   and the collapsed overrides.
3. Swap `ease-out` → `ease-out-expo` on the opacity transition (RULES: exponential easings only).
4. `pnpm tsc --noEmit && pnpm lint`.
5. Extend `shell.spec.ts`'s sidebar test: the logo `<img>` has `height` 26px, its bounding box's
   left edge is 24 (frame) + 16 (card padding) + 12 (margin) = **52px** from the viewport at 1280,
   and a keyboard `Tab` from the top of the page lands on it with a computed `outline`/`box-shadow`
   ring that is not `none`.

## Project rules

- `.claude/rules/quality.md` — `next/image` with explicit width/height (the `Logo` component
  already does this; do not bypass it with a bare `<img>`); every interactive element needs a
  VISIBLE focus ring (WCAG 2.2 AA) — the design's omission is not a licence to ship none.
- `.claude/rules/tailwind.md` — no arbitrary values; animate opacity/transform only.
- `CLAUDE.md` §0 law 4 — touch nothing else in this file.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts` green, including the pre-existing
  collapsed-rail `getByRole('img', …)` assertion.
- New legs pass: 26px height, 52px left offset at 1280, visible focus ring on `Tab`.
- Reduced motion: with `page.emulateMedia({ reducedMotion: 'reduce' })` the link's computed
  `transition-duration` is `0s`.
- 375px: inside the open Sheet the logo renders at 26px and its tap target measures ≥44px in both
  dimensions (`elementFromPoint` scan, the idiom `a11y-auth.spec.ts` already uses).
- axe serious/critical = 0 on `/dashboard` at 1280 + 375 (`shell-a11y.spec.ts` unchanged).
- No new strings → six catalogs unchanged.

## Assumptions

- The collapsed-rail mark at 24px is retained from the current build; the export has no collapsed
  state to spec it from (`01-portal-dashboard.md` UNKNOWNS §1) and deleting a working feature is
  forbidden by the wave brief.

## Evidence

_(filled in as the task runs)_
