---
id: 200
title: Add the portal wizard token block and rebuild /dashboard/children/new as the portal two-column frame
layer: ui
kind: build
slice: Add-child wizard page frame — back link, `Add a child` h1, 230px rail column + step-card column
target: src/app/globals.css, src/lib/utils.ts, src/modules/student-wizard/components/WizardScreen.tsx, src/i18n/messages/*.json
contract: n/a — pure presentation; the design spec section below is the contract
design: .qa/design/screens/portal--add-child-multi-step.html:3-8, .qa/design/spec/03-portal-forms.md#21-page-layout
status: TODO
depends_on: []
---

## Objective
Replace the wizard's current centred 640px column (`WizardScreen.tsx:64` —
`mx-auto flex w-full max-w-160 flex-col gap-6`) with the portal's real frame: a back link, a 30px
`Add a child` heading, and a `230px 1fr` grid that holds the step rail (task 201) and the step card
(task 202). Emit, once, the portal-local colour/radius/utility tokens every later W7 task consumes.

## Contract
n/a — presentation. `03-portal-forms.md` §2.1, quoted verbatim:

```
root   : display:flex; flex-direction:column; gap:24px;
         padding:8px 4px 8px 8px; height:100%; box-sizing:border-box     (L3)
body   : display:grid; grid-template-columns:230px 1fr; gap:24px;
         flex:1; min-height:0                                            (L8)
```

| Element | Copy | Spec |
|---|---|---|
| Back link | `← My children` | `13.5px / 500 / #7C8698`, hover `#2563EB`, `cursor:pointer`; navigates to the children roster |
| `h1` | `Add a child` | `margin:12px 0 0; 30px / 500 / letter-spacing -0.02em / #0E2350` |

## Design source
`.qa/design/screens/portal--add-child-multi-step.html:3-8`.

**Token block** — add to the existing `@theme` in `src/app/globals.css` (D-DESIGN-2: the design's hex
is the provenance, the token is OKLCH). If W0 already emitted a name below, reuse it, never redeclare:

| Token | Provenance hex | OKLCH | Role in this wave |
|---|---|---|---|
| `--color-portal-fg` | `#3D4A5C` | `oklch(0.4051 0.0347 256.58)` | portal body copy, info-panel copy, done-step rail title |
| `--color-portal-muted` | `#7C8698` | `oklch(0.6180 0.0297 262.27)` | design provenance only — see ink policy |
| `--color-portal-faint` | `#9AA6B8` | `oklch(0.7215 0.0295 258.37)` | design provenance only — see ink policy |
| `--color-portal-input` | `#D8DFEA` | `oklch(0.9016 0.0168 259.42)` | input + chip border, unselected chip border |
| `--color-portal-line` | `#EEF1F6` | `oklch(0.9573 0.0074 260.73)` | review-table hairline, dropzone icon well |
| `--color-portal-line-2` | `#E4E9F2` | `oklch(0.9328 0.0133 262.38)` | incomplete rail connector |
| `--color-portal-surface-2` | `#F4F6FA` | `oklch(0.9728 0.0057 264.53)` | info/notice panel fill |
| `--color-portal-dash` | `#C4CEDC` | `oklch(0.8480 0.0224 256.74)` | dropzone dashed border |
| `--radius-portal-card` | — | `1.5rem` (24px) | step card + settings/notification cards |
| `--text-portal-h1` | — | `1.875rem` (30px), `--line-height 1.2`, `--letter-spacing -0.02em` | portal `h1` |

Navy/brand tokens already exist and are NOT redeclared: `--color-navy-900` (`#0E2350`),
`--color-navy-800` (`#16326E`), `--color-blue-600` (`#2563EB`).

**Named utilities** (the design's 1.5px hairlines are not on any Tailwind scale, and
`.claude/rules/tailwind.md:13` bans `border-[1.5px]`):

```css
@utility border-hairline { border-width: 1.5px; }
@utility rail-line { width: 1.5px; }
```

**Ink policy for this whole wave** (`.claude/rules/quality.md` WCAG AA 4.5:1, and the precedent
already written into `design-system/components/field-shell.tsx`): `#7C8698` is 3.67:1 and `#9AA6B8`
is 2.46:1 on `#FFFFFF` — neither may carry text. Substitutes, which keep the design's two-level
hierarchy: portal-muted text → `text-body` (`#475569`, 7.4:1); portal-faint text →
`text-muted-foreground` (`#64748B`, 4.76:1). Both tokens still ship for non-text use.

**Frame classes**: root `flex h-full flex-col gap-6 py-2 pl-2 pr-1`; body
`grid min-h-0 flex-1 gap-6 lg:grid-cols-[230px_1fr]` — the fixed `230px 1fr` is a named grid track,
so register it as `@utility grid-cols-wizard { grid-template-columns: 230px 1fr; }` alongside the
existing `grid-cols-*` utilities in globals.css rather than an arbitrary bracket value (375px
behaviour is task 223's). Back link: `text-body-sm font-medium text-body transition-colors
duration-150 ease-out-expo hover:text-blue-600 motion-reduce:transition-none`, rendered as the
next-intl `<Link href="/dashboard/children">` (never a bare `<a>`), with the `←` as an aria-hidden
`ArrowLeft` 14px icon. `h1`: `mt-3 text-portal-h1 font-medium text-navy-900`.

Register `portal-card` (radius) and `portal-h1` (text) in `THEME_CLASS_GROUPS`
(`src/lib/utils.ts`) so `cn()` does not drop them — the file already does this for `segment` and
`selection`; `tests/e2e/design-tokens.spec.ts` is the parity guard.

## Files
- `src/app/globals.css` — `@theme` additions + 3 `@utility` blocks
- `src/lib/utils.ts` — `THEME_CLASS_GROUPS` entries
- `src/modules/student-wizard/components/WizardScreen.tsx` — the new frame
- `src/modules/student-wizard/components/WizardHeader.tsx` (new — back link + `h1`)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `StudentWizard.title`, `StudentWizard.backToChildren`

## Depends on
Nothing inside W7. Wave-level prerequisite: W0 foundations (Google Sans, the six keyframes, the
focus-ring token) and W1 primitives — this task must reuse whatever of the table above W0 emitted
rather than duplicate it.

## Steps
1. Add tokens + utilities to `globals.css`; register them in `THEME_CLASS_GROUPS`.
2. Add `StudentWizard.title` (`Add a child`) and `StudentWizard.backToChildren` (`My children`) to all
   six catalogs.
3. Build `WizardHeader`; rebuild `WizardScreen`'s outer markup as the frame; keep `FormProvider`, the
   `useStudentWizard` hook, `useWizardSubmit`, the media-store reset effect and the `noValidate`
   `<form>` exactly as they are.
4. Playwright proof, then axe.

## Project rules
`.claude/rules/tailwind.md` (OKLCH only; **no arbitrary values**; 4pt-scale spacing; animate transform
/opacity only; exponential easings) · `.claude/rules/module-pattern.md` (components live in
`components/`, ≤120 lines) · `.claude/rules/i18n.md` (six catalogs, identical key shape) ·
`.claude/rules/quality.md` (one `h1` per page; `<Link>` from `next-intl/navigation`, never `<a>`) ·
`CLAUDE.md` §0 law 11 (never edit `src/components/ui/*`).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright against the running app at `/dashboard/children/new`: the grid container's computed
  `grid-template-columns` starts with `230px` at 1280px; the `h1` reads `Add a child` with computed
  `font-size: 30px`, `font-weight: 500`, `letter-spacing: -0.6px`; the back link is an `<a>` whose
  `href` ends `/dashboard/children` and whose colour changes on hover.
- A DOM assertion that `border-hairline` resolves to `border-width: 1.5px` and `rounded-portal-card`
  to `border-radius: 24px` (this is the guard for the no-arbitrary-values escape hatch).
- `design-tokens.spec.ts` still passes with the two new groups registered.
- axe: zero serious/critical on `/dashboard/children/new`.
- Six locale catalogs key-identical (`tests/e2e/helpers/i18n.ts` loaders).
- Zero banned-pattern grep hits (`#[0-9a-fA-F]{6}`, `p-[`, `w-[`, `text-[`) in the diff.
- `051-step-guardian`, `052-step-media`, `053-wizard-controls`, `student-wizard-contrast` and
  `dashboard-students` remain green.

## Assumptions
The `230px 1fr` grid is desktop-only; the phone composition is task 223 and this task ships the
`lg:` prefix so nothing is crushed in the meantime. If W0 named the portal scale differently, the
W0 names win and this task adopts them.

## Evidence
