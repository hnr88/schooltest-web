---
id: 301
title: Build the public/auth route loading skeleton and wire every auth submit to st-spin
layer: ui
kind: implement
slice: /[locale] route-level loading UI plus the pending state of all four auth submit buttons
target: src/app/[locale]/loading.tsx, src/modules/auth/components/AuthCardSkeleton.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/app--loading-skeleton.html:14-35 · .qa/design/spec/06-auth-states-landing.md#2-loading-skeleton-system-app-loading-skeletonhtml · #61-keyframes-global-declared-in-the-design-system--app-screens-stylesheets
status: TODO
depends_on: [300]
---

## Objective

Replace the two-grey-blocks placeholder at `src/app/[locale]/loading.tsx` with a skeleton built from
the design's shape catalogue, and make every auth submit show the design's `st-spin` spinner while
its mutation is pending — the one motion the spec explicitly assigns to auth.

## Contract

n/a — presentation. Binding design text, `.qa/design/spec/06-auth-states-landing.md` §6.1:

> `st-spin` | `to { transform:rotate(360deg) }` | rotation | not referenced by any screen in this spec
>
> `st-toast-in`, `st-fade-in`, `st-pop-in`, `st-spin` are the intended entrance/loading primitives
> for overlays, toasts, modals and spinners; **wire auth submit spinners to `st-spin`** … when
> building (design does not assign them).

And §2.1's shimmer rule (quoted in full in task 300): `background-size:800px 100%`,
`st-shimmer 1.4s linear infinite`, base one step darker than its surface.

## Design source

The public shell has no sidebar, so the skeleton is the design's **main region only**
(`app--loading-skeleton.html:14-35`) on the `#F7F9FC` page background — which means the **dark**
shimmer variant (`linear-gradient(90deg,#E9EEF6 25%,#E3E8F0 50%,#E9EEF6 75%)`,
`--color-skeleton-sheen` → `--color-border`), not the light one.

Shapes reused verbatim from task 300's catalogue: page title `320×28 r8`, page subtitle
`420×16 r6`, list row `h 44px r10`.

Auth card skeleton (`AuthCardSkeleton`) mirrors task 290's 420px rail: card title `180×18 r6`,
two field rows `h 44px r10`, a submit row `h 44px r10` — on the white card surface, so the **light**
shimmer variant (`--color-skeleton-base` → `--color-skeleton-sheen`).

Spinner: `st-spin`, `1s linear infinite` on a 16px `size-4` ring using `border-2` +
`border-t-transparent` in `currentColor`. The `Button` primitive already exposes `loading` — use it;
do not build a second spinner. Pending labels are the existing keys: `Auth.signingIn`,
`Auth.signingUp`, `Auth.sendingResetLink`, `Auth.resettingPassword`, `Auth.googleConnecting`.

Token map: `#F7F9FC` → `--color-background` · `#E9EEF6` → `--color-skeleton-sheen` · `#E3E8F0` →
`--color-border` · `#F1F5F9` → `--color-skeleton-base` · `#FFFFFF` → `--color-card`.

## Files

- `src/app/[locale]/loading.tsx` (rewrite)
- `src/modules/auth/components/AuthCardSkeleton.tsx` (new, module-internal)

No auth form file is edited for the spinner — they already pass `loading={mutation.isPending}` to
`Button`. Verify that is true for all four; if one does not, that one line is this task's fix.

## Depends on

- **300** — establishes the shape catalogue, the `aria-busy` / `role="status"` convention and the
  reduced-motion rule for `shimmer-sweep`. This task must not re-decide any of them.

## Steps

1. Read `src/app/[locale]/loading.tsx`, the four auth forms, and `tests/e2e/home.spec.ts` +
   `tests/e2e/landing.spec.ts`.
2. Rewrite the route loading UI: page title + subtitle (dark shimmer) then 3 list rows, inside a
   `max-w-5xl` rail with `px-6 py-12`, wrapper `aria-busy="true"` + one visually-hidden
   `role="status"` node reading `Common.loading`, every shape `aria-hidden="true"`.
3. Add `AuthCardSkeleton` for the auth rail (light shimmer) and use it where an auth route suspends.
4. Confirm each auth submit renders `st-spin` while pending and swaps to its pending label.
5. Motion: `shimmer-sweep` for shapes; `motion-safe:animate-spin motion-reduce:animate-none` for the
   spinner. Rotation is a `transform` — compliant with the animate-transform/opacity rule.
6. 375px: shapes are width-capped by `max-w-full`; no horizontal scroll; the spinner does not push
   the submit label out of the button.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 8, 11, 15.
- `.claude/rules/nextjs-patterns.md` — `loading.tsx` is a Server Component.
- `.claude/rules/tailwind.md` — tokens only; animate transform/opacity (and the design's own
  `background-position` keyframe) only.
- `.claude/rules/i18n.md` — `Common.loading` and the four pending labels already exist ×6 locales.
- `.claude/rules/quality.md` — a busy region must be announced once, not per frame.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/landing.spec.ts
  tests/e2e/sign-in.spec.ts tests/e2e/forgot-reset.spec.ts` green.
- Real Playwright assertions against the running app: (a) with `POST /api/auth/local` delayed via
  `page.route`, the sign-in submit is `disabled`, shows the `Auth.signingIn` label and a node whose
  computed `animation-name` is `st-spin`; (b) the same for forgot-password's
  `Auth.sendingResetLink`; (c) the route skeleton renders with `aria-busy="true"` and a
  `role="status"` announcement.
- Computed-style assertion that the page-level skeleton uses the **dark** variant (its gradient
  midpoint resolves to `--color-border`) and the auth-card skeleton the **light** one.
- Under `prefers-reduced-motion: reduce`: `animation-name: none` on both the spinner and the shapes.
- axe zero serious/critical on the loading states at 375 and 1280.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

Table, chart, report and test-taking skeletons do not exist in the design (spec §2 UNKNOWNS —
"Skeleton coverage: only the parent-overview shape is skeletonised"); this task ships only the two
surfaces the design does define and invents no third shape.

## Evidence

_(filled in as the task runs)_
