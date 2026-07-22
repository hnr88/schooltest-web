---
id: 290
title: Rebuild the auth split layout to the login brand panel (560px navy / 1fr form column)
layer: ui
kind: implement
slice: The shared two-column auth shell that wraps sign-in, sign-up, forgot-password and reset-password
target: src/modules/auth/components/AuthSplitLayout.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/app--login.html:1-14 · .qa/design/spec/06-auth-states-landing.md#11-login--split-layout-app-loginhtml · #16-auth-screen-inventory--layout-comparison
status: TODO
depends_on: []
---

## Objective

Re-skin the existing `AuthSplitLayout` to the design's login split: a 560px navy brand panel
(logo top / copy centre / legal footnote bottom) beside a form column that centres a 420px
content rail. Every auth route already renders through this component; nothing about routing,
guards or the children it wraps changes.

## Contract

n/a — presentation. Binding design text, `.qa/design/spec/06-auth-states-landing.md` §1.1:

> **Layout** (`:1`): `display:grid; grid-template-columns:560px 1fr` on the 1440px frame ⇒ left
> brand panel **560px**, right form panel **880px**.
> Left brand panel (`:2-14`): `background:#0E2350` (`--navy-900`), `padding:56px`,
> `display:flex; flex-direction:column; justify-content:space-between`.
> Right form panel (`:15`): `display:grid; place-items:center; padding:56px`.
> Form column (`:16`): `width:420px; flex column; gap:24px`.

## Design source

`.qa/design/screens/app--login.html:1-16`. Literal values — use the `@theme` token whose
provenance comment records the hex (`.qa/design/spec/04-ds-foundations.md#tailwind-v4-mapping`),
never the raw hex, never an arbitrary value:

| Element | Value | Token / utility |
|---|---|---|
| Frame grid | `560px 1fr` | `lg:grid-cols-[560px_1fr]` is already in place — keep the named track, it is the one exception the file already carries |
| Brand panel bg | `#0E2350` | `--color-navy-900` → `bg-navy-900` (today it is `bg-navy-950` = `#0A1A3C` — **this is the fix**) |
| Brand panel padding | `56px` | `p-14` |
| Logo | `height:40px`, `filter:brightness(0) invert(1)`, `align-self:flex-start` | `Logo theme="white" height={40}` from `@/modules/design-system` (already used) |
| Copy stack gap | `20px` | `gap-5` (today `gap-6`) |
| `h1` | `40px / line-height 1.15 / 700 / letter-spacing -0.02em / #FFFFFF` | the `--text-*` token whose provenance is 40px (`--text-h1`-class); `font-bold`, `tracking-tight`, `text-white` |
| Lead `p` | `16px / 1.6 / #A9BADC / max-width 360px` | `--color-navy-body`; `text-base`, `leading-relaxed`, `max-w-90` |
| Benefit list gap | `12px`, `margin-top:8px` | `gap-3`, `mt-2` |
| Benefit row | `gap:10px; font-size:14px; color:#C7D6F2` | `gap-2.5`, `text-sm`, on-navy secondary ink token |
| Bullet marker | `22px` circle, `background:#14B8A6`, check `11×11 stroke #fff stroke-width 3` | `size-5.5 rounded-full bg-accent-500`, lucide `Check className="size-3"` `strokeWidth={3}` |
| Legal footnote | `12.5px; color:#5E729E` | `--color-navy-label`, `text-xs` |
| Form column | `width:420px`, children `gap:24px`, panel padding `56px` | `w-105 max-w-full`, `gap-6`, `p-14` desktop |

Copy is unchanged and stays in `Auth.split.*` (`title`, `body`, `benefitTests`, `benefitScores`,
`benefitFeedback`, `legal`) — do NOT retranslate or rename keys.

## Files

- `src/modules/auth/components/AuthSplitLayout.tsx` (rewrite the markup, keep the export, keep it
  a Server Component — it holds no state)

## Depends on

None inside W10. Wave-level: W1 must have landed the token/type-scale layer before the `@theme`
names above resolve; if a name is absent, take the W1 token whose provenance comment carries the
same hex rather than inventing one.

## Steps

1. Read the current file and `tests/e2e/auth-logo.spec.ts` before editing.
2. Swap the panel surface to `bg-navy-900`, re-space the three pinned children to the table above.
3. Re-scale the h1 / lead / benefit rows to the design values via type-scale tokens.
4. Recolour the bullet marker to `bg-accent-500` and the footnote to the navy-label token.
5. Set the right column to a 420px rail centred in the remaining track, `gap-6` between children.
6. Motion: the copy block keeps its entrance —
   `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2
   motion-safe:duration-200 motion-safe:ease-out-expo motion-reduce:animate-none`
   (design keyframe `st-fade-in` + `st-toast-in`, `.qa/design/spec/06-auth-states-landing.md` §6.1).
   No new keyframe, no new dependency (D-DESIGN-3).
7. 375px: the brand panel stays `hidden lg:flex`; the form column drops to `px-5 py-10`, the rail
   goes full width (`w-full max-w-105`). No horizontal scroll at 375.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 8, 11, 15 — read before editing, no extras, keep it a
  Server Component, never touch `src/components/ui/*`, no comments beyond what already exists.
- `.claude/rules/tailwind.md` — OKLCH `@theme` tokens only, no raw hex, **no arbitrary values**
  (`text-[14.5px]` and `p-[23px]` are failures), 4pt spacing scale, animate transform/opacity only.
- `.claude/rules/i18n.md` — no hardcoded user-facing string; `Auth.split.*` keys already exist in
  all six catalogs and must stay key-identical.
- `.claude/rules/quality.md` — visible focus ring on the logo link; `next/image` via `Logo`.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/auth-logo.spec.ts` green: **exactly one visible
  `[data-slot="logo"]` on `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` at both
  375×800 and 1280×800** — the brand-panel logo and the in-card logo must never both be visible.
- `pnpm exec playwright test tests/e2e/a11y-auth.spec.ts` green — the sign-in and sign-up focus
  orders (logo → Google → email → …) are unchanged; this task must not move a focusable node.
- `pnpm exec playwright test tests/e2e/sign-in.spec.ts tests/e2e/sign-up.spec.ts
  tests/e2e/forgot-reset.spec.ts` stay green.
- A Playwright assertion that at 1280px the brand `<aside>` computed `background-color` resolves to
  the `--color-navy-900` value and its computed width is `560px`; at 375px the aside is not visible.
- axe: zero serious/critical on `/sign-in` at 375 and 1280.
- Motion present and a `prefers-reduced-motion: reduce` emulation shows the copy block with no
  animation and no transform.
- No i18n key added or removed; all six catalogs stay key-identical.
- Zero banned-pattern grep hits in the diff (`#[0-9a-fA-F]{3,6}`, `-\[`, `any`, `glassmorphism`).

## Assumptions

The 1440×900 gallery frame, its `border-radius:14px` and `box-shadow` are gallery furniture and are
NOT shipped (spec §0.3). `560px` is a named grid track, not an arbitrary value — it is the design's
declared column and already exists in the file.

## Evidence

_(filled in as the task runs)_
