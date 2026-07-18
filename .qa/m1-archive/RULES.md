# RULES.md — binding project rules, tagged by package

Scope of this mission: **schooltest-web only** (frontend). No backend work — the landing
page is content-driven from i18n JSONs; no datastore writes. schooltest-api (Strapi) and
schooltest-app are NEIGHBORS — do not touch.

## [schooltest-web] CLAUDE.md — ABSOLUTE LAWS (src: schooltest-web/CLAUDE.md)
1. DO EXACTLY WHAT IS ASKED. Zero extras, zero refactors, zero nice-to-haves.
2. THINK 3x, WRITE 1x.
3. NEVER BREAK EXISTING LOGIC — read surrounding code before editing.
4. NEVER TOUCH ANYTHING NOT EXPLICITLY REQUESTED.
5. WHEN IN DOUBT, ASK (mission overrides: never ask → log decision in DECISIONS.md).
6. pnpm ONLY (never npm/yarn/bun). Lockfile pnpm-lock.yaml.
7. TypeScript ONLY for new files.
8. Server Components by default; `'use client'` ONLY for state/effects/browser APIs/handlers, on line 1.
9. NEVER fetch from client components (typed axios in src/lib/axios/).
10. App Router ONLY.
11. NEVER edit src/components/ui/* — wrap shadcn primitives in modules.
12. NEVER run dev/build/start directly. Allowed: `pnpm tsc --noEmit`, `pnpm lint`,
    `pnpm test --run`, `pnpm exec playwright test`. (Mission reconciliation: the Playwright
    `webServer` config manages the app lifecycle inside `playwright test` — an allowed
    command. No manual dev/build/start processes.)
13. NEVER commit secrets.
14. NEVER `any` — use `unknown` + narrow.
15. NEVER add unsolicited comments or docs in code.

## [schooltest-web] .claude/rules/module-pattern.md
- ALL custom code in src/modules/[name]/ with components/ hooks/ stores/ queries/ actions/
  schemas/ lib/ types/ constants/ index.ts barrel. Subfolders only when needed.
- Cross-module imports via barrel index.ts ONLY. Components are dumb: no API calls, no
  business logic, ≤3 useState, >15 non-JSX lines → extract.
- File placement: types→types/, zod→schemas/, constants→constants/, utils→lib/.

## [schooltest-web] .claude/rules/nextjs-patterns.md
- Server Components default; `getTranslations` (server) / `useTranslations` (client).
- Next 16: async params/searchParams; `revalidateTag` needs 2nd arg; reactCompiler enabled
  (next.config.ts); middleware file = proxy.ts (none here — next-intl cookie mode).

## [schooltest-web] .claude/rules/state-data.md
- Check shadcn (ui/) before building anything; never edit ui/*.
- Zustand one-store-per-concern; TanStack hooks in queries/; axios only in src/lib/axios/.
- Forms: react-hook-form + zodResolver + same schema client+server.

## [schooltest-web] .claude/rules/tailwind.md
- OKLCH colors ONLY (no hex/HSL/pure #000/#fff). All design tokens → @theme in globals.css.
- 4pt spacing scale; NO arbitrary values (p-[23px] banned — define tokens); max padding p-24;
  gap not margin for siblings; clamp() fluid type via tokens.
- Animate transform/opacity only. Banned: glassmorphism, gradient heading text, neon-on-dark.
- (Deviation logged in DECISIONS.md: font = Google Sans shipped in the authoritative design
  folder, via next/font/local — the design spec wins over the approved-font list.)

## [schooltest-web] .claude/rules/i18n.md
- NEVER hardcode user-facing strings; PascalCase namespaces + camelCase keys
  (Home.heroTitle); ALL locale files identical key shape; ICU plurals/params; rich text via
  t.rich for inline markup; locales: en (default), de; cookie-based (NEXT_LOCALE), no URL
  prefix (routing.ts + request.ts; LocaleSwitcher writes cookie + router.refresh()).

## [schooltest-web] .claude/rules/imports.md
- `@/` alias always; no `../` upward; order: react/external → next-intl → `@/` → relative
  (same module only); never import a module's own barrel internally.

## [schooltest-web] .claude/rules/testing.md
- TDD red→green→refactor; server components via Playwright; every feature ships ≥1 test.

## [schooltest-web] .claude/rules/quality.md
- next/image + next/font always; metadata on every page; semantic HTML, ONE h1 per page;
  keyboard reachable, WCAG AA contrast, visible focus rings; env access only via
  src/lib/env.ts (never raw process.env in app code).
- File limits: ≤200 lines/file, ≤120 lines/component; naming per CLAUDE.md §4
  (PascalCase components, useX hooks, kebab utilities, UPPER_SNAKE constants, is/has/should
  booleans, handle* handlers).

## [schooltest-web] AGENTS.md (repo root of package)
- Agent routing index (some stale entries); module structure + @/ imports + server/client
  boundary + RHF/Zod + query-hook patterns; ≤120-line components; shadcn-first; no hardcoded
  strings.

## Mission-level overrides (this run)
- Commit per wave on `main` (explicitly authorized by mission). Never create/switch branches.
- @axe-core/playwright may be added as devDependency for the a11y e2e (mission §F authorizes
  an accessibility engine; that IS the library confirmation).
- Playwright webServer boots the app for e2e on the allocated port (see STACK.json) — the
  only server-run mechanism (allowed command `pnpm exec playwright test`).
