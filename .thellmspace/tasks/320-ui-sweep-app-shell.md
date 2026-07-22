---
id: 320
title: UI sweep the app shell — every sidebar/topbar/user-menu/mobile-nav control at 375 and 1280
layer: ui
kind: verify
slice: The `/dashboard/*` chrome — detached sidebar, topbar, breadcrumb, notification bell, user menu, mobile nav sheet
target: src/modules/shell/** (AppSidebar, AppTopbar, SidebarNavItem, SidebarLogoLink, SidebarPromoPanel, RailSectionLabel, TopbarBreadcrumb, UserMenu, RecordCrumb), src/app/[locale]/dashboard/layout.tsx, new spec tests/e2e/sweep-app-shell.spec.ts
contract: n/a (presentation sweep) — the shell's only data reads are `GET /api/my/students` (AppSidebar) and `GET /api/notifications` (NotificationBell)
design: .qa/design/screens/portal--detached-sidebar.html, .qa/design/screens/portal--main.html:1-40, .qa/design/spec/01-portal-dashboard.md#1-page-shell, .qa/design/spec/05-ds-components.md#navigation
status: TODO
depends_on: []
---

## Objective

Prove that **every interactive control in the dashboard chrome** works at 375px and at 1280px:
it renders, it is enabled, activating it fires the endpoint it is supposed to fire (or performs
the navigation it is supposed to perform), the real response is rendered, any DB effect is real
and survives a reload, and its error path is honest. This is the first sweep in W11 because the
shell wraps every `/dashboard/*` route — a shell defect would otherwise be re-reported by all
six route sweeps.

## Contract

n/a for the chrome itself. The two live reads it owns, quoted from `.qa/intake/api-inventory.md`:

- `GET /api/my/students` (endpoint #1) — parent JWT required; grant
  `api::student.student.findMyStudents`; default filter `{ status: { $ne: 'archived' } }`;
  success `200 { data: [...], meta: { pagination: { page, pageSize, pageCount, total } } }`;
  `403 ForbiddenError "Only parents can list their students"` for a non-parent;
  `429 RateLimitError "Too many requests, please slow down."`.
- `GET /api/notifications` (endpoint #14) — success `200` with
  `meta.pagination` + `meta.unreadCount`; `400` on a bad `read`/`category` value;
  `403 "Only a signed-in parent, teacher, student or admin can access notifications"`.

No write. `POST`/`PUT` from the shell: none. Sign-out is client-side only — it clears
`localStorage['app.auth.token']`, nulls and removes the `['auth','me']` query, and calls
`router.refresh()` (`src/modules/auth/hooks/use-auth.ts:15-42`).

## Design source

`.qa/design/screens/portal--detached-sidebar.html:2-31` and `.qa/design/spec/01-portal-dashboard.md#1.2`:

- `<aside>`: `width: 248px` (`flex: none`), `background #FFFFFF` → `--color-sidebar`,
  `border-radius: 24px`, `box-shadow: 0 1px 2px rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06)`,
  `padding: 28px 16px 16px`. Outer frame `display:flex; gap:24px; padding:24px; height:100vh;
  max-width:1600px; margin:0 auto`; page background `#EEF1F6` → `--color-surface-well`.
- Nav item, default (`.qa/design/spec/05-ds-components.md:381`):
  `display:flex; align-items:center; gap:11px; font-size:14px; font-weight:500;
  color:#475569` → `--color-body`; `padding:10px 12px; border-radius:10px;
  transition: background .12s`; hover `background:#F1F5F9` → `--color-muted`,
  `color:#0E2350` → `--color-navy-900`.
- Nav item, active (`:380`): `font-weight:600; color:#FFFFFF` → `--color-primary-foreground`;
  `background:#2563EB` → `--color-primary`; same padding/radius. Weight steps 500 → 600.
- Global anchor rule (`01-portal-dashboard.md#1.1`): `a { color:#0E2350 } a:hover { color:#2563EB }`.
- Focus: the design declares **no** focus state (`04-ds-foundations.md` UNKNOWN 1). Per
  `.qa/PLAN.md` finding 2 the ring is authored from the design's own `--ring` token:
  `--color-ring: oklch(0.5461 0.2152 262.88 / 0.35)` rendered as
  `outline: 2px solid var(--color-ring); outline-offset: 2px` on `:focus-visible`.

Motion for the shell (D-DESIGN-3, `04-ds-foundations.md#I`): nav-item background
`transition: background var(--duration-fast, 150ms) var(--ease-out-quart)` — the design's
`.12s` rounds up to the mission's 150ms floor; the mobile nav Sheet enters with
`st-fade-in` (scrim, 180ms) + a translateX panel slide (180ms, `--ease-out-quart`);
the user-menu popover uses `st-pop-in` (180ms). Every one carries a
`@media (prefers-reduced-motion: reduce)` variant that collapses duration to `0.01ms`
and removes the transform, keeping the opacity end-state.

## Files

- `tests/e2e/sweep-app-shell.spec.ts` (new — the sweep's proof)
- Fix-in-place authority (only where the sweep finds a real defect):
  `src/modules/shell/components/{AppSidebar,AppTopbar,SidebarNavItem,SidebarLogoLink,SidebarPromoPanel,RailSectionLabel,TopbarBreadcrumb,UserMenu}.tsx`,
  `src/modules/shell/lib/nav-active.ts`, `src/modules/shell/constants/nav.constants.ts`,
  `src/app/[locale]/dashboard/layout.tsx`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` if any missing string is found
- Never: `src/components/ui/**` (CLAUDE.md law 11)

## Depends on

No intra-wave dependency. **Wave gate (prose, not an id edge): all of W4 (App shell,
ids 110-127) must be DONE before this task starts** — this sweeps the surface W4 delivers.
W11's other dashboard sweeps (321-325) depend on this one.

## Steps

1. Enumerate the shell's interactive controls from `.qa/intake/web-inventory.md` §1 and the
   `shell` module map: the 4 sidebar nav links (`/dashboard`, `/dashboard/children`,
   `/dashboard/search`, `/dashboard/settings` — `nav.constants.ts:9-32`), the sidebar logo
   link, the rail collapse toggle (+ `Ctrl+B`), the sidebar promo panel's CTA, the topbar
   breadcrumb links, the notification bell, the user chip → `Sign out`, and at 375px the
   mobile nav trigger + Sheet + its Escape close.
2. Write `tests/e2e/sweep-app-shell.spec.ts`. Log in with `loginAsParent` from
   `tests/e2e/helpers/auth.ts` (seeded `parent@schooltest.local`, D-AUTH-1). Read every label
   from the en catalog via `cat`/`loadMessages` (`tests/e2e/helpers/i18n.ts`) so a copy change
   breaks the test rather than drifting.
3. At **1280×800** and again at **375×812**, for each control assert in one pass:
   visible → enabled (`toBeEnabled`) → keyboard reachable (`Tab` reaches it, `:focus-visible`
   ring is non-transparent via `getComputedStyle(el).outlineColor`) → activation produces the
   contracted effect.
4. Endpoint proof: `page.waitForResponse` on `**/api/my/students*` for the sidebar mount and
   `**/api/notifications*` for the bell; assert `status() === 200` and that the rendered child
   count equals `meta.pagination.total` from the real body — never a hardcoded number.
5. Navigation proof: each nav link lands on its exact URL and the active pill moves — assert
   the active item's computed `background-color` equals the resolved `--color-primary` and its
   `font-weight` is `600`, while a sibling reads `500`.
6. Sign-out proof: click the user chip → `Sign out`; assert `localStorage['app.auth.token']`
   is null, the URL becomes `/sign-in`, and a hard reload of `/dashboard` redirects back to
   `/sign-in` (the guard is client-side, `ParentGuard`).
7. Error path: `page.route('**/api/my/students*', r => r.fulfill({ status: 500, ... }))`
   before mount; assert the sidebar renders its translated error/empty affordance and **no**
   uncaught console error (`watchErrors` from `tests/e2e/helpers/ui.ts` stays empty).
   Then release the route and assert recovery on retry.
8. 375px: assert the desktop rail is not rendered, the Sheet trigger is ≥44×44,
   opening it traps focus, `Escape` closes it and returns focus to the trigger.
9. Motion: assert each nav item's computed `transition-duration` is between `150ms` and
   `200ms` and `transition-property` includes `background-color`; then re-run the same
   assertions under `test.use({ colorScheme: 'light' })` +
   `page.emulateMedia({ reducedMotion: 'reduce' })` and assert the duration collapses
   (`<= 0.02s`) and the Sheet has no transform animation.
10. Fix any defect found at the module call site only. Never edit `src/components/ui/*`;
    never weaken an assertion to make it pass.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 12, 14, 15 — no extras, never break existing
  logic, never edit `src/components/ui/*`, never run `pnpm dev/build/start`, no `any`, no
  unsolicited comments.
- `.claude/rules/module-pattern.md` — components in `components/`, pure helpers in `lib/`,
  constants in `constants/`; cross-module imports through the barrel only; 200-line file cap,
  120-line component cap.
- `.claude/rules/tailwind.md` — OKLCH only, no arbitrary values, 4pt spacing, animate
  transform/opacity only (the design's `background` transition is the documented exception
  recorded in `04-ds-foundations.md#I`), exponential easings.
- `.claude/rules/quality.md` — visible focus rings, keyboard reachable, never `<div onClick>`,
  modals trap focus and close on Escape.
- `.claude/rules/i18n.md` — no hardcoded user-facing string; all six catalogs key-identical.
- `.claude/rules/testing.md` + D-VERIFY-1 — proof is a real Playwright run against the running app.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` both exit 0.
- `pnpm exec playwright test tests/e2e/sweep-app-shell.spec.ts` passes against the running
  app on `http://localhost:3100`, with **every** control above asserted at both 375×812 and
  1280×800 — renders, enabled, keyboard-reachable, correct endpoint fired with a real 200,
  rendered value derived from the real response body, and the error path asserted.
- Persistence proof: after sign-out and a full reload, `/dashboard` still redirects to
  `/sign-in` and `localStorage['app.auth.token']` is absent; after sign-in it is present again.
- Motion proof: every nav item / bell / user-chip transition measures 150-200ms in the real
  DOM, and the same assertions under `reducedMotion: 'reduce'` measure `<= 0.02s`.
- `watchErrors(page)` is empty for every navigation in the spec (zero console errors,
  zero pageerrors).
- Zero axe serious/critical on the shell at both widths (`327` owns the full page-level axe
  run; this task must not leave a new violation behind).
- If any string changed: all six catalogs in `src/i18n/messages/` are key-identical
  (`en, zh, ko, ms, vi, th`), verified by a key-set diff, count equal across all six.
- Zero banned-pattern grep hits in the diff (`mock|fake|stub|dummy|placeholder|TODO|FIXME`
  and any hardcoded array standing in for a query result).
- No file under `src/components/ui/` appears in the diff.

## Assumptions

- The seeded parent `parent@schooltest.local` has ≥1 child and ≥1 notification, as
  `tests/e2e/students-list.spec.ts` and `tests/e2e/notification-feed.spec.ts` already rely on.
- W4 kept the existing `useStudentsQuery` / `useNotificationsQuery` hooks rather than
  replacing them (D-SCOPE-3 requires the wiring be preserved and re-dressed).

## Evidence

<!-- filled in as the task runs: status codes, request/response bodies, e2e output, screenshots -->
