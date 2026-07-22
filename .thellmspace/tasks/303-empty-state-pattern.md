---
id: 303
title: Rebuild the page-level empty-state pattern to app--empty-state.html and prove it on the real children empty state
layer: ui
kind: implement
slice: The generalised empty-state composition — 96px chip, 27px headline, explanation, primary action, "or" divider, escape-hatch link
target: src/modules/design-system/components/empty-state-hero.tsx, src/modules/children/components/ChildrenEmptyState.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/app--empty-state.html:16-28 · .qa/design/spec/06-auth-states-landing.md#4-empty-state-app-empty-statehtml
status: TODO
depends_on: []
---

## Objective

Make `EmptyStateHero` the design's page-level empty state, then prove it on the one empty state a
real account can actually reach today: a fresh parent with no children, at `/dashboard/children`.

## Contract

n/a — presentation. Binding design text, `.qa/design/spec/06-auth-states-landing.md` §4:

> **Empty-state pattern (generalised):** 96px circular `#EFF5FF` icon chip (`--blue-50`) → 27px/700
> navy headline → 15px/1.6 `#64748B` explanation (≤ 2 sentences, second sentence tells the user
> where to find the missing input) → **primary inline action inside a white card** → "or" divider →
> secondary text link. Column is 560px, centred in the content region, `gap:22px`.

The spec also records that this is *"a **full app shell with an empty main region**, not a bare card
— the chrome stays, the content is replaced"* — which is already how `ChildrenEmptyState` renders
(inside the guarded dashboard shell), so the shell is not rebuilt here.

## Design source

`.qa/design/screens/app--empty-state.html:16-28`:

| Element | Value | Token / utility |
|---|---|---|
| Main region | `flex:1; display:grid; place-items:center; padding:40px` | `grid flex-1 place-items-center p-10` |
| Content column | `width:560px; align-items:center; gap:22px; text-align:center` | `w-140 max-w-full items-center gap-5.5 text-center` |
| Illustration chip | `96×96; border-radius:999px; background:#EFF5FF`; lucide **user-plus** `42×42, stroke #2563EB, stroke-width 1.8` (note the lighter stroke at large size) | `size-24 rounded-full bg-brand-50`, icon `size-10.5 text-primary` `strokeWidth={1.8}` |
| `h1` | `27px / 700 / -0.015em / #0E2350` | 27px `--text-*` token, `font-bold tracking-tight text-foreground` |
| `p` | `15px / 1.6 / #64748B` | `text-base leading-relaxed text-muted-foreground` |
| Inline action card | `width:100%; background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:22px; display:flex; gap:10px; box-shadow:0 1px 2px rgba(14,35,80,.06)` | `w-full bg-card border border-border rounded-panel p-5.5 flex gap-2.5 shadow-sm` |
| Divider | `gap:14px; width:100%`; rules `1px background:#E3E8F0`; label `12.5px; #94A3B8` "or" | `gap-3.5 w-full`, `bg-border`, `text-xs text-muted-foreground-soft`, wrapper `aria-hidden="true"` |
| Escape-hatch link | `14px / 600`, inherits `#2563EB` | `text-sm font-semibold text-primary hover:text-brand-700 transition-colors duration-150` |

Tokens: `#EFF5FF` → `--color-brand-50` · `#2563EB` → `--color-primary` · `#0E2350` →
`--color-foreground` · `#64748B` → `--color-muted-foreground` · `#E3E8F0` → `--color-border` ·
`#94A3B8` → `--color-muted-foreground-soft` · `#FFFFFF` → `--color-card` · `--radius-panel` 16px.

**Contrast carry-over that must not regress.** `ChildrenEmptyState` today overrides the lede to
`--color-body` (`#475569`, 6.74:1) because the hero renders directly on the `#EEF2F7` well where
`--color-muted-foreground` measures 4.23:1 — under the AA body floor. The design's `#64748B` is
specified against `#F7F9FC`, not the well. Fix it properly this time: give `EmptyStateHero` a
`descriptionClassName` prop (or ink its lede `text-body` when it sits on the well) and **delete the
`LEDE_ON_WELL` hack**, which the existing comment already asks for.

**The student-code input** (`app--empty-state.html:24`, placeholder `NH-4823-EM`) is **not** built:
no endpoint accepts a student code (`.qa/intake/web-inventory.md` §3 lists every hook — there is no
link-by-code call), so the inline action card holds the app's real primary action, the existing
`/dashboard/children/new` CTA. Shipping the code field would be a control that cannot submit
(D-SCOPE-1 §4). The "or" divider and escape-hatch link are therefore shipped only if a genuine
second route exists for the surface; on the children empty state that is the wizard's "add manually"
path, which **is** the primary CTA — so this surface renders chip → headline → explanation → action
card, and no divider. Do not render an empty divider.

## Files

- `src/modules/design-system/components/empty-state-hero.tsx` (rebuild to the pattern; add the
  optional `descriptionClassName` / divider + secondary-link slots, both optional)
- `src/modules/design-system/types/design-system.types.ts` (props type — types live in `types/`)
- `src/modules/children/components/ChildrenEmptyState.tsx` (drop `LEDE_ON_WELL`, pass the new prop)

`src/modules/design-system/**` is module code and is editable; `src/components/ui/**` is not and is
not touched.

## Depends on

None inside W10. Wave-level: W1's empty-state primitive work, if it lands first, is the base this
extends — never a second parallel component.

## Steps

1. Read `empty-state-hero.tsx`, `empty-state.tsx`, `ChildrenEmptyState.tsx` and
   `tests/e2e/students-list.spec.ts` (which asserts a fresh parent sees the real empty state).
2. Rebuild the hero to the table above; keep the existing prop names (`icon`, `title`,
   `description`, `action`) so no other call site breaks — grep for every consumer first.
3. Add the optional divider + secondary-link slots; render neither when not passed.
4. Delete `LEDE_ON_WELL` and ink the lede correctly from inside the component.
5. Motion: entrance `motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95
   motion-safe:duration-200 motion-safe:ease-out-expo motion-reduce:animate-none` (`st-pop-in`); the
   chip does not animate on its own; the action button keeps `transition-colors duration-150`.
6. 375px: the column is full width minus `p-6`, the chip stays 96px, the action card stacks its
   children (`flex-col sm:flex-row`) and the CTA is full width and ≥44px.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 11, 14, 15.
- `.claude/rules/module-pattern.md` — props types in `types/`, component stays dumb.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, `gap-*` over margins.
- `.claude/rules/quality.md` — WCAG AA 4.5:1 for the lede on the surface it actually renders on;
  one `<h1>` per page (the hero's title must be a heading of the right level for its context, not a
  bare `<p>` if it is the page's only heading).
- `.claude/rules/i18n.md` — reuse `Children.emptyTitle` / `emptyDescription` / `addStudent`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/students-list.spec.ts tests/e2e/dashboard.spec.ts
  tests/e2e/design-system.spec.ts` green — including every other `EmptyStateHero` consumer found in
  step 2.
- **Real-account proof:** create a throwaway parent through the existing
  `tests/e2e/helpers/throwaway-parent.ts`, sign in, land on `/dashboard/children`, and assert the
  empty state renders with the 96px chip, the headline, the explanation and the working CTA; then
  add a child through the wizard, reload, and assert the empty state is gone and the new
  `students` row is visible — i.e. the empty state is driven by real Postgres data, not a flag.
- Computed-style assertions: chip is 96×96 with `border-radius: 9999px` and `background-color` =
  `--color-brand-50`; the lede's computed colour has ≥4.5:1 contrast against the well it sits on
  (assert the colour equals `--color-body`).
- axe zero serious/critical at 375 and 1280.
- Reduced-motion: no entrance animation.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits; the `LEDE_ON_WELL` override no longer exists in the codebase.

## Assumptions

The student-code field and the "or / add manually" escape hatch are not shipped on this surface
because no endpoint backs the former and the latter duplicates the primary CTA; both refusals are
recorded above rather than silently dropped.

## Evidence

_(filled in as the task runs)_
