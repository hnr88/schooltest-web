---
paths:
  - "src/**/*"
---

Always use @/ path alias for imports. Never use relative imports with ../ to go up directories.

Import order:
1. React and external libraries
2. next-intl
3. @/ internal modules
4. Relative imports (only within same module directory)

Never import from barrel index files in the same module — import directly from the source file.
