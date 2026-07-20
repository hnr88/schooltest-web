---
id: 33
title: Fix student selection option contrast
layer: a11y
kind: fix
slice: add-student wizard select and combobox option readability
target: src/modules/student-wizard/components/{NationalityCombobox,WizardSelectField}.tsx; tests/e2e/student-wizard-contrast.spec.ts
contract: C-UI-STUDENT-CONTRAST
status: DONE
depends_on: [32]
---
## Objective

Ensure highlighted and selected student-wizard options use dark readable text on light surfaces
without modifying the vendored select/combobox primitives.

## Contract

No transport change. Existing form values and client/server validation schemas remain unchanged;
only option state presentation is tightened.

## Files

The two named module-level field wrappers and focused browser contrast coverage.

## Depends on

Task 32 completes broader search visual work before the student wizard accessibility slice.

## Steps

1. Reproduce the open select/combobox state in the real add-student route.
2. Apply state-specific classes at consuming wrappers, not `src/components/ui/*`.
3. Test keyboard highlight and selected option computed foreground/background contrast.
4. Verify form submission still reaches the existing real persistence endpoint.

## Project rules

Follow accessibility and component-boundary rules; existing RHF/Zod flow stays untouched.

## Done criteria

Open option states are visibly high-contrast, keyboard selection works, an actual student
creation still persists after reload, and focused E2E plus tsc/lint pass.

## Assumptions

The reported multiselect issue refers to existing selectable option surfaces in the wizard.

## Evidence

Live Chromium verification passed: keyboard-highlighted and selected combobox options
measured at WCAG AA contrast or better, the native select path was exercised through the
same helper, and a real `POST /api/students` returned 200. The created child remained in
the real My Children list after a browser reload. Focused wizard regression ran 5/5 green;
`pnpm tsc --noEmit` passed; `pnpm lint` had zero errors and one pre-existing unrelated
CreateArticleForm warning; `git diff --check` and the touched-file banned-pattern scan were clean.
