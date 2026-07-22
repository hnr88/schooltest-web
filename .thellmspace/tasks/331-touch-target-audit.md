---
id: 331
title: Touch-target audit — every interactive control is at least 44x44 CSS px at 375 and 1280
layer: a11y
kind: verify
slice: Mission-wide WCAG 2.5.5 / 2.5.8 target-size conformance, closing the D22 exemption
target: tests/e2e/touch-target-audit.spec.ts (new); size fixes at the module call sites; tests/e2e/helpers/ui.ts (collectSmallTargets is reused, not rewritten)
contract: n/a
design: .qa/design/spec/04-ds-foundations.md#4-buttons, .qa/design/spec/04-ds-foundations.md#5-form-controls, .qa/design/spec/05-ds-components.md#navigation
status: TODO
depends_on: ["320", "321", "322", "323", "324", "325", "326"]
---

## Objective

Assert that **every** interactive control in the parent portal has a hit area of at least
44×44 CSS px at 375px and at 1280px, and fix the ones that do not — at the module call site,
by padding or sizing the wrapper, never by editing `src/components/ui/*` and never by
weakening the assertion. This closes the exemption `.qa/DECISIONS.md` **D22**(1) deliberately
deferred to "a future dedicated a11y-hardening task". This is that task.

## Contract

n/a. Binding statements:

`.claude/rules/quality.md` — WCAG AA; keyboard reachable; the target-size requirement.

`.qa/DECISIONS.md` **D22**(1), quoted: *"44px tap-target shortfall, systemic, not this mission's
regression. A blanket `collectSmallTargets` sweep across /sign-in, /sign-up, /dashboard (incl.
the students table, the add-student dialog's open state, and the search results panel) found many
controls under 44×44px: the sign-in/up card's logo-home `<Link>` (82×26 …); and, throughout
/dashboard, every control at shadcn's vendored default cva size — `Button` "sm"/"default"
(~32-40px), `Input`/`Select`/`InputGroup*` defaults (~32px) … the dialog's shadcn `Dialog`
close-X is 28×28 … flagged here for a future dedicated a11y-hardening task, not silently
dropped."*

**Resolution path that is legal under Law 11:** `src/components/ui/*` is never edited. The size
comes from the module-level wrappers this mission authors —
`src/modules/design-system/lib/button-variants.ts` (which already carries `after:` pointer-target
insets), the design-system's `IconButton`, `FieldShell`, and the module call sites' `className`.
A 26×26 visual control (e.g. the alert dismiss button,
`.qa/design/spec/04-ds-foundations.md:472`) keeps its 26×26 **visual** box and gains a ≥44×44
**hit** area via a centred `::after` inset overlay — the design's pixel geometry is preserved and
the target requirement is met. That is the sanctioned pattern for every undersized control.

## Design source

The design's own control geometry, which must remain visually intact while the hit area grows:

- Button default (`04-ds-foundations.md#4.1`): `font-size:14px; font-weight:600;
  padding:10px 18px; border-radius:10px; gap:8px` → computed height ≈ 40px. **Needs +4px of hit
  area**, delivered by the `after:` inset, not by changing the padding.
- Outline button: `padding:9px 17px` + `1px` border so the border-box height matches exactly —
  changing its padding would break that parity, so the `after:` inset is mandatory here.
- Alert dismiss (`:472`): `width:26px; height:26px; border-radius:7px`, `aria-label="Dismiss"`.
- Input / select / textarea (`:339,:357,:362`): `padding:10px 13px; border-radius:10px` →
  computed height ≈ 40px.
- Checkbox (`:368`) and radio (`:384`): `18×18` boxes — the **label** is the hit area; assert the
  clickable region (`<label>` wrapping or `htmlFor`) is ≥44 tall, not the 18px box.
- Switch (`:398`): track `40×22` — same treatment.
- Sidebar nav item (`05-ds-components.md:381`): `padding:10px 12px; font-size:14px` → ≈ 40px tall,
  full-rail wide.
- Tab button (`:246`): `padding:0 2px 12px` → very short; needs a real ≥44px hit area.
- Link button (`04-ds-foundations.md:298`): `padding:10px 4px` → 8px wide hit area horizontally.
  Inline text links inside `p/li/td/blockquote` are exempt under the WCAG 2.5.8 inline exception
  (already implemented in `collectSmallTargets`); a standalone Link button is **not**.

## Files

- `tests/e2e/touch-target-audit.spec.ts` (new)
- `tests/e2e/helpers/ui.ts` — reuse `collectSmallTargets` as-is; extend only if a new exemption
  class is genuinely needed, and then with a cited reason in the code
- Size fixes: `src/modules/design-system/lib/button-variants.ts`,
  `src/modules/design-system/components/**`, and the module call sites in
  `src/modules/{shell,dashboard,children,student-wizard,notifications,settings,school-search,agent-search,search-shared,unified-search,auth,landing}/**`
- `tests/e2e/a11y-responsive.spec.ts` — the `(see D22)` comment at ~line 117 is resolved
- Never `src/components/ui/**`

## Depends on

- **320-326** — the sweeps deliver the final markup and the final control inventory.
- Wave gate (prose): **W1 (020-057)** owns the primitives whose sizing carries most of the fix.

## Steps

1. Write `tests/e2e/touch-target-audit.spec.ts` reusing `collectSmallTargets` from
   `tests/e2e/helpers/ui.ts` (threshold `MIN = 43`, i.e. 44px minus 1px tolerance; sr-only and
   `display:none` skipped; the TanStack devtools trigger excluded as dev-only third-party
   chrome; inline anchors inside `p/li/td/blockquote` exempt per WCAG 2.5.8).
2. Log in with `loginAsParent`. For each surface, at **375×812** and **1280×800**, run
   `collectSmallTargets(page)` and assert the returned array is **empty**, printing every
   offender (`<tag> "label" W×H`) on failure:
   - `/dashboard`; `/dashboard` at 375 with the mobile nav Sheet open
   - `/dashboard/children`; the same with the archive confirm dialog open
   - `/dashboard/children/[documentId]` — once per tab
   - `/dashboard/children/new` — once per step (1-5)
   - `/dashboard/children/[documentId]/edit`
   - `/dashboard/search?mode=schools`; with the filter sheet open; with the map active
   - `/dashboard/search?mode=agents`
   - `/dashboard/notifications`
   - `/dashboard/settings` — once per tab (account, search, notifications, children)
   - `/`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, a 404 route
   - `/design-system` (the gallery — D22's other named offender)
3. For every offender, apply the sanctioned fix at the module call site:
   - a wrapper `size-11` / `min-h-11 min-w-11` where the visual box may grow, or
   - a centred `::after` inset overlay (`after:absolute after:inset-[-9px]` expressed through the
     design-system's existing pointer-target utility, never a raw arbitrary value) where the
     design's pixel geometry must be preserved, or
   - making the `<label>` the hit area for a checkbox/radio/switch.
   Never change `src/components/ui/*`; never raise the threshold; never add an offender to an
   allow-list.
4. Assert the hit area is **real**, not just measured: for a sample of fixed controls, click at
   the extreme corner of the 44×44 box (e.g. `boundingBox.x + 2, boundingBox.y + 2`) and assert
   the control activates.
5. Assert overlapping hit areas do not swallow neighbours: for each fixed control, assert
   `document.elementFromPoint(centerX, centerY)` of its **neighbour** still resolves to the
   neighbour (an inset overlay that covers the next control is a regression).
6. Resolve D22: remove or update the `(see D22)` comment in
   `tests/e2e/a11y-responsive.spec.ts:117` and turn the previously **logged-only** target checks
   there into real `expect` assertions.
7. Re-run until every surface returns an empty offender list twice in a row.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, **11** (never edit `src/components/ui/*`), 12, 15.
- `.claude/rules/tailwind.md` — no arbitrary values; the pointer-target inset is expressed as a
  design-system utility/token, not `after:inset-[-9px]` written inline everywhere.
- `.claude/rules/quality.md` — WCAG AA target size, keyboard reachability.
- `.claude/rules/module-pattern.md` — 200/120-line caps still apply to any touched component.
- `.qa/DECISIONS.md` D22 — the exemption is closed here.
- `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/touch-target-audit.spec.ts` passes with an **empty**
  `collectSmallTargets` result on every surface in step 2, at both 375×812 and 1280×800
  (≥ 27 surface-states × 2 widths).
- Corner-click activation proven for a sample of fixed controls; neighbour `elementFromPoint`
  proven unchanged (no swallowed neighbours).
- `tests/e2e/a11y-responsive.spec.ts` no longer contains a `(see D22)` logged-only exemption for
  target size; its checks are real assertions and it still passes.
- `git diff --stat` shows **no** file under `src/components/ui/`.
- The `MIN` threshold in `tests/e2e/helpers/ui.ts` is unchanged at `43`; no offender is added to
  any allow-list.
- Zero banned-pattern grep hits in the diff.
- Zero new axe serious/critical introduced (re-run 327/328/329's specs in the same session).

## Assumptions

- The TanStack Query devtools trigger stays excluded — it is dev-only third-party chrome absent
  from production builds, already documented in `collectSmallTargets`.
- If a control genuinely cannot reach 44×44 without breaking the design's stated geometry **and**
  the `::after` inset is impossible (e.g. inside a vendored file that owns the DOM), the task is
  BLOCKED with that exact element and reason quoted — never re-exempted silently.

## Evidence

<!-- filled in as the task runs: per-surface offender lists before and after -->
