---
id: 28
title: Single logo on every authentication screen
layer: ui
kind: fix
slice: auth branding hierarchy
target: src/modules/auth/components/{AuthSplitLayout,SignInCard,SignUpCard,ForgotPasswordCard,ResetPasswordCard}.tsx; tests/e2e/auth-logo.spec.ts
contract: C-UI-AUTH-LOGO
status: DONE
depends_on: []
---
## Objective

Render exactly one visible product logo on desktop and mobile variants of sign-in, sign-up,
forgot-password, and reset-password screens without changing authentication behaviour.

## Contract

No transport change. The public auth route DOM has one visible brand logo at each viewport;
desktop uses the split-layout mark and mobile uses the card mark.

## Files

The five named auth components, all six message catalogs only if a new accessible label is
needed, and the focused Playwright spec.

## Depends on

None.

## Steps

1. Add a failing live browser assertion for each auth route at desktop and mobile widths.
2. Scope the existing marks by responsive visibility classes rather than duplicating branding.
3. Keep links, labels, focus order and layout semantics intact.
4. Run focused E2E, typecheck and lint against the live app.

## Project rules

Read web `CLAUDE.md` and module/Next/i18n/testing/quality rules; use existing Logo and do not
edit design-system primitives.

## Done criteria

Every auth route has one visible logo at both widths, real login controls still render, axe
has no new serious/critical issue, and the live focused E2E passes.

## Assumptions

The duplicate is the existing split-layout plus card mark, not two independent logo assets.

## Evidence

Builder proof: the new live Playwright spec first failed on desktop with two visible
`[data-slot="logo"]` elements, then passed after the card logo links became `lg:hidden`.
Independent sequential verification: `pnpm exec playwright test tests/e2e/auth-logo.spec.ts
tests/e2e/a11y-auth.spec.ts --project=chromium --grep 'each auth page renders one visible
logo|sign-in — a11y|sign-up — a11y'` passed 6/6 against web :3100 and API :5500; it covered
all four auth routes at 1280px and 375px plus sign-in/sign-up axe/focus checks. `pnpm tsc
--noEmit` passed; `pnpm lint` had 0 errors (one unchanged CreateArticleForm warning);
`git diff --check` passed. A broader a11y command separately exposed a dashboard search-panel
`.bg-muted` color-contrast failure, outside this diff and carried into the in-scope search work
instead of being suppressed.
