---
id: 15
title: E2E — accessibility (axe) + responsive sweep + screenshots
layer: a11y
kind: verify
slice: axe WCAG pass + mobile/desktop UI sweep on / and /design-system
target: tests/e2e/a11y-responsive.spec.ts, .qa/screenshots/
contract: C-E2E (E2E-A11Y-RESP)
status: TODO
depends_on: [12, 07]
---
## Objective
Add @axe-core/playwright (devDependency — pre-authorized D11) and prove: zero
serious/critical axe violations, no broken layout at 375px and 1280px, touch targets ≥44px,
no console errors; capture screenshots for the report.

## Contract (C-E2E entry 6)
1. `pnpm add -D @axe-core/playwright`.
2. axe scan on '/' (en + de) and '/design-system' at 1280px: fail on any violation with
   impact serious|critical; list moderate/minor in Evidence (fix serious+ only, per mission).
3. Viewports 375×812 and 1280×800 on both pages: no horizontal scrollbar
   (document.documentElement.scrollWidth <= innerWidth + 1); every visible interactive
   element (a, button, [role=button], input, select) has bounding box ≥44×44 OR is an
   inline text link inside a paragraph/footer list (assert only standalone controls);
   no element overflowing the viewport (spot: hero card, pricing grid, footer columns).
4. Full-page screenshots: landing-en-desktop, landing-de-desktop, landing-en-mobile,
   ds-desktop, ds-mobile → .qa/screenshots/ (from playwright dir? test writes to
   ../.qa/screenshots? NO — .qa lives in schooltest-web; write to .qa/screenshots via
   relative path from project root using path.resolve).
5. Keyboard: tab from top → skip link focused first on '/', then header links; Escape
   closes mobile menu; focus-visible outline present (computed outline on focused CTA).

## Files
- CREATE tests/e2e/a11y-responsive.spec.ts; EDIT package.json/pnpm-lock via pnpm add.

## Steps
1. Install axe. 2. Write spec. 3. Run full `pnpm exec playwright test`. 4. Fix every
   serious/critical violation in MARKUP (never disable rules). 5. Screenshots saved.

## Project rules
testing.md, quality.md (WCAG AA), ACCESSIBILITY & UI mission section.

## Done criteria
- Full suite green incl. axe gates at both widths; screenshots on disk (verifier lists
  the dir + opens one); no rule suppressions in the spec (grep for disableRules → none).
- Verifier re-runs the whole suite fresh.
## Assumptions
- Moderate/minor axe findings are documented, not necessarily fixed (mission scope).
## Evidence
(filled by builder/verifier)
