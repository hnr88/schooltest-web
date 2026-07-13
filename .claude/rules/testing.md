---
paths:
  - "tests/**"
  - "src/**/*.test.*"
---

## TDD Workflow (non-negotiable)

1. **Red:** Write a failing test that defines the expected behavior.
2. **Green:** Write the minimum code to make it pass.
3. **Refactor:** Clean up without changing behavior.

Never write tests after implementation — they'll "cheat" by matching broken logic instead of catching it.

## Testing Rules

Docs: `.claude/docs/guides/testing/vitest.md`, `.claude/docs/guides/testing/playwright.md`

1. Server Components: CANNOT render in JSDOM. Extract logic into pure functions or test via Playwright.
2. Client Components: render with RTL, simulate with `userEvent`, assert DOM.
3. Server Actions: import and call directly as async functions.
4. Co-locate: `Component.test.tsx` next to `Component.tsx` or in `__tests__/`.
5. Every new feature ships with at least ONE test.
