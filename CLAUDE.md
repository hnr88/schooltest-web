# CLAUDE.md — Next.js 16 Project Guide

Single source of truth for any Next.js 16 / React 19 project that follows this template. Drop this file (plus the `.claude/`, `.agents/`, and `.codex/` folders alongside it) into the repo root and Claude / Codex will load it automatically.

Authoritative references (read the matching file before editing in that domain):

| Folder | Purpose |
|---|---|
| `.claude/rules/` | Binding rules. In any conflict, the rule file wins over this guide. |
| `.claude/docs/` | Canonical long-form Next.js 16 reference (mirror of upstream docs). |
| `.claude/agents/` | Specialized subagent definitions — see `AGENTS.md` for the routing table. |
| `.claude/skills/` | Reusable scaffolding recipes (`create-*`) for components, modules, pages, etc. |
| `.claude/commands/` | Slash-commands available in Claude Code. |
| `.agents/skills/` | Mirror of `.claude/skills/` for tools that read from `.agents/`. |
| `.codex/agents/` | Codex (TOML) versions of the same agents in `.claude/agents/`. |

**Binding rule files** in `.claude/rules/` (read the matching one before editing in that domain):

| Topic | Rule file |
|---|---|
| Module structure, folder layout, barrels | `rules/module-pattern.md` |
| Next.js 16 patterns (Server/Client, caching, routing) | `rules/nextjs-patterns.md` |
| State management & data fetching (Zustand, TanStack Query, Axios) | `rules/state-data.md` |
| Tailwind v4 / OKLCH / `@theme` tokens | `rules/tailwind.md` |
| i18n (next-intl) | `rules/i18n.md` |
| Imports & path aliases | `rules/imports.md` |
| Testing (Vitest, Playwright) | `rules/testing.md` |
| Code quality (file size, naming, lint) | `rules/quality.md` |

**Workflow:** (1) identify the topic your task touches; (2) read the matching `.claude/rules/<topic>.md`; (3) consult `.claude/docs/` if the task is non-trivial; (4) only then edit.

---

## 0. ABSOLUTE LAWS

1. **DO EXACTLY WHAT IS ASKED.** Zero extras. Zero refactors. Zero nice-to-haves.
2. **THINK 3x, WRITE 1x.** Triple-check every line.
3. **NEVER BREAK EXISTING LOGIC.** Read surrounding code BEFORE editing.
4. **NEVER TOUCH ANYTHING NOT EXPLICITLY REQUESTED.**
5. **WHEN IN DOUBT, ASK.** Never guess. Never assume.
6. **pnpm ONLY.** npm/yarn/bun = failure. Lockfile: `pnpm-lock.yaml`.
7. **TypeScript ONLY** for new files. No `.js`/`.jsx`.
8. **Server Components by default.** `'use client'` ONLY for state, effects, browser APIs, event handlers.
9. **NEVER `fetch` from client components.** Use typed Axios instances from `src/lib/axios/`.
10. **App Router ONLY.** No `pages/` directory. No `getServerSideProps`/`getStaticProps`.
11. **NEVER edit `src/components/ui/*`.** Wrap shadcn primitives in modules.
12. **NEVER run dev/build/start.** Tell the user. Allowed: `pnpm tsc --noEmit`, `pnpm lint`.
13. **NEVER commit secrets.**
14. **NEVER use `any`.** Use `unknown` and narrow.
15. **NEVER add unsolicited comments or docs in code.**

---

## 1. WORKFLOW — PLAN > ARCHITECT > IMPLEMENT > REVIEW

### Planning
- For non-trivial features, use the **planner agent** first. It interviews you to reach alignment, then produces a scoped task list.
- Delete stale PRDs and plans after shipping. They confuse future sessions.

### Architecture
- Break work into **vertical slices** — each task cuts through all layers needed (schema > API > UI) in one thin pass.
- Use a **DAG** for task dependencies, not sequential phases.
- Design **deep modules** — group functionality behind small interfaces. Avoid hundreds of tiny interdependent files.

### Implementation
- **TDD: red > green > refactor.** Write a failing test first, then implement, then clean up.
- Keep sessions focused. Past ~100k tokens, start fresh rather than continuing.

### Review
- Use the **code-reviewer agent** (Opus, fresh context) after implementation.
- QA the frontend yourself — AI has no visual taste.
- Never self-review in an exhausted context.

---

## 2. STACK

| Layer | REQUIRED | BANNED |
|---|---|---|
| Framework | Next.js 16 (App Router, React 19, Turbopack) | Pages Router |
| Language | TypeScript 5.6+ strict | JavaScript |
| Styling | Tailwind CSS v4 (CSS-first, OKLCH) | CSS Modules, styled-components |
| UI | shadcn/ui (Radix-based) | Custom duplicates of shadcn |
| i18n | next-intl | react-i18next, LinguiJS |
| Client state | Zustand | Redux, MobX, Jotai, Context-as-store |
| Server state | TanStack Query v5 | SWR |
| HTTP | Axios (typed, `src/lib/axios/`) | Raw `fetch` from client |
| Forms | react-hook-form + Zod | Formik, Yup |
| Toasts | sonner | react-toastify |
| Icons | lucide-react or @heroicons/react | react-icons, Font Awesome |
| Carousels | Splide.js | Swiper, Embla |
| Testing | Vitest + RTL (unit), Playwright (E2E) | Jest, Cypress |
| Package mgr | pnpm | npm, yarn, bun |

Adding a new library: must be popular, maintained, **confirmed with user first**. Install with `pnpm add`.

---

## 3. FOLDER LAYOUT

```
public/                          static assets
src/app/                         App Router ONLY
  [locale]/                      locale-prefixed routes
  api/                           route handlers (route.ts)
  globals.css                    Tailwind v4, @theme tokens
  layout.tsx                     root layout (NO providers)
src/modules/[name]/              ALL custom code lives here
  components/ hooks/ stores/ queries/ actions/ schemas/ lib/ types/ constants/ index.ts
src/components/ui/               shadcn primitives (READ ONLY)
src/lib/                         axios/, utils.ts (cn()), env.ts
src/i18n/                        messages/, request.ts, routing.ts
src/proxy.ts                     Next 16 middleware
tests/                           unit/, e2e/
```

---

## 4. NAMING

| Kind | Convention | Example |
|---|---|---|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | `useX` camelCase | `useUserData.ts` |
| Stores | `use-x-store` kebab | `use-cart-store.ts` |
| Queries | `use-x.query` | `use-products.query.ts` |
| Mutations | `use-x.mutation` | `use-create-product.mutation.ts` |
| Actions | `x.action` kebab | `create-product.action.ts` |
| Schemas | `x.schema` kebab | `product.schema.ts` |
| Types | `x.types` kebab | `product.types.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Utilities | kebab-case | `format-date.ts` |
| Booleans | `is/has/should` | `isLoading`, `hasError` |
| Handlers | `handle*` | `handleSubmit` |

**File limits:** 200 lines max. Components: 120 lines max.
**Imports:** Always `@/` aliased. Cross-module: barrel `index.ts` only.

---

## 5. FATAL PITFALLS

1. Importing Server Component into Client → pass as `children`.
2. `'use client'` not on first line → silent breakage.
3. `cookies()`/`headers()`/`searchParams`/`params` are `async` in Next 16 → `await` them. Sync access is fully removed.
4. `useRouter` from `next/router` → use `next/navigation` or `next-intl/navigation`.
5. `getServerSideProps`/`getStaticProps` → FORBIDDEN (Pages Router).
6. Mutation without revalidation → stale UI. Use `updateTag` (Server Actions, immediate) or `revalidateTag('tag', 'max')` (stale-while-revalidate).
7. `revalidateTag` without 2nd argument → deprecated. Always pass a cacheLife profile: `revalidateTag('tag', 'max')`.
8. Functions as props Server → Client → NOT serializable.
9. Zustand/Context in Server Component → impossible.
10. `useEffect` to fetch → use TanStack Query or Server Component.
11. Hardcoded user-facing strings → use `t()` from next-intl.
12. Pure `#000`/`#fff` → use OKLCH tints.
13. `<a>` for internal nav → use `<Link>` from `next-intl/navigation`.
14. `window` at module top level → wrap in `typeof window !== 'undefined'`.
15. Types in component files → move to `types/`.
16. Business logic in components → extract to `hooks/` or `lib/`.
17. Raw `useQuery`/`useMutation` in components → extract to `queries/`.
18. Parallel route slots without `default.tsx` → build fails. Always create one.
19. `experimental.ppr` / `experimental_ppr` → removed. Use `cacheComponents: true` instead.
20. `error.tsx` using `reset()` → use `unstable_retry()` instead (re-fetches Server Components).
21. Non-deterministic ops (`Math.random()`, `Date.now()`) in cached components → call `connection()` from `next/server` first.

---

## 6. COMMANDS

**NEVER RUN:** `pnpm dev`, `pnpm build`, `pnpm start`, destructive git commands.
**ALLOWED:** `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test --run`, `pnpm exec playwright test`, `git status/log/diff`, file reads/greps.

---

## 7. GIT

Never revert, reset --hard, push --force, rebase, or amend commits not authored this session. Never commit unless asked.

---

## 8. EXECUTION

Execute ONLY what is requested. No hallucinated APIs. No invented patterns. No unsolicited improvements. Ask if ambiguous. Run `pnpm tsc --noEmit && pnpm lint` before reporting completion.

---

## 9. DOCUMENTATION REFERENCE

Full Next.js 16.2.4 docs are in `.claude/docs/`. Consult before implementing unfamiliar patterns.

| Topic | Path |
|---|---|
| Getting Started (18 pages) | `.claude/docs/getting-started/` |
| Guides (60 pages) | `.claude/docs/guides/` |
| API: Directives | `.claude/docs/api-reference/directives/` |
| API: Components | `.claude/docs/api-reference/components/` |
| API: File Conventions | `.claude/docs/api-reference/file-conventions/` |
| API: Functions | `.claude/docs/api-reference/functions/` |
| API: Config | `.claude/docs/api-reference/config/` |
| API: CLI | `.claude/docs/api-reference/cli/` |
| API: Adapters | `.claude/docs/api-reference/adapters/` |
| Architecture | `.claude/docs/architecture/` |

Key files to check first:
- Caching: `getting-started/caching.md`, `getting-started/revalidating.md`
- Components: `getting-started/server-and-client-components.md`
- Errors: `getting-started/error-handling.md`
- Proxy: `getting-started/proxy.md`, `api-reference/file-conventions/proxy.md`
- Upgrade notes: `guides/upgrading/version-16.md`

---

*Last updated: 2026-05-04 — Next.js 16.2.4, React 19.2, Tailwind v4, next-intl, Turbopack.*
