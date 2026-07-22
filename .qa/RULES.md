# RULES.md — binding project rules, tagged by package

Mission `st-portal-redesign` (2026-07-22). Read the matching section before every change.
Rules below are a digest; on any conflict the package's own `CLAUDE.md` / `.claude/rules/*`
file is authoritative and wins over this file and over the mission prompt.

Sources loaded and summarised here:

| Package | Source of rules |
|---|---|
| schooltest-web | `schooltest-web/CLAUDE.md` + `.claude/rules/{module-pattern,nextjs-patterns,state-data,tailwind,i18n,imports,testing,quality}.md` + `.claude/docs/` (Next.js 16.2.4 mirror) |
| schooltest-api | `schooltest-api/CLAUDE.md` + `.claude/rules/` |
| schooltest-app | `schooltest-app/CLAUDE.md` + `.claude/rules/` — OUT OF SCOPE this mission, listed so it is never cross-applied |
| workspace | root `AGENTS-COORDINATION.md`, root `.qa/DECISIONS.md`, root `.qa/RULES.md`, root `docs/` (product) |

---

## [schooltest-web] Next.js 16.2.10 parent portal — THE package for this mission

### The 15 absolute laws (CLAUDE.md §0)
1. Do exactly what is asked. Zero extras, zero refactors, zero nice-to-haves.
2. Think 3x, write 1x.
3. Never break existing logic — read surrounding code BEFORE editing.
4. Never touch anything not explicitly requested.
5. When in doubt, ask — in this unattended run that becomes: mark BLOCKED with the precise gap.
6. **pnpm ONLY.** npm/yarn/bun = failure.
7. **TypeScript ONLY** for new files. No `.js`/`.jsx`.
8. **Server Components by default.** `'use client'` only for state, effects, browser APIs, handlers.
9. **Never `fetch` from client components.** Use the typed Axios instance in `src/lib/axios/`.
10. **App Router ONLY.** No `pages/`, no `getServerSideProps`/`getStaticProps`.
11. **Never edit `src/components/ui/*`.** Wrap the shadcn primitives in modules instead.
12. **Never run dev/build/start.** Allowed: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test --run`,
    `pnpm exec playwright test`, `git status/log/diff`, reads/greps.
13. Never commit secrets.
14. **Never use `any`.** Use `unknown` and narrow.
15. **Never add unsolicited comments or docs in code.**

### Structure (`rules/module-pattern.md`, `rules/imports.md`)
- All custom code lives in `src/modules/<name>/` with the fixed folder law:

  | Code type | MUST live in |
  |---|---|
  | `type` / `interface` | `types/x.types.ts` |
  | Zod `z.object(...)` | `schemas/x.schema.ts` |
  | `useQuery` / `useMutation` | `queries/use-x.query.ts` / `use-x.mutation.ts` |
  | custom `useX` hooks | `hooks/useX.ts` |
  | `'use server'` functions | `actions/x.action.ts` |
  | `create<Store>()` | `stores/use-x-store.ts` |
  | constants / config objects | `constants/x.constants.ts` |
  | pure utilities | `lib/x.ts` |

  Only exception: an inline props type for a single-use component.
- Cross-module imports go through the barrel `index.ts` ONLY. Never reach into another
  module's internals. Never import from your OWN module's barrel — import the source file.
- `@/` alias always. Never `../` to go up a directory.
- Import order: React/external → next-intl → `@/` internal → same-directory relative.
- **Components are dumb.** No business logic, no API calls, no validation logic, no >3
  `useState`, no non-hook helper functions. Remove the JSX `return`; if >15 lines of logic
  remain, the component does too much.
- File limits: **200 lines max per file, 120 max per component.** Split and re-export past that.

### Rendering (`rules/nextjs-patterns.md`)
- `'use client'` must be the literal first line when present; push it to leaves.
- `params` / `searchParams` / `cookies()` / `headers()` are **async** in Next 16 — `await` them.
- Server Component cannot be imported into a Client Component — pass it as `children`.
- `useRouter` from `next/navigation` or `next-intl/navigation`, never `next/router`.
- Mutations: `updateTag('tag')` (Server Actions, read-your-own-writes) or
  `revalidateTag('tag', 'max')` — the second argument is mandatory.
- `error.tsx` must be `'use client'` and recover with `unstable_retry()`, not `reset()`.
- Parallel route slots require an explicit `default.tsx` or the build fails.
- Non-deterministic calls (`Math.random()`, `Date.now()`) inside cached components need
  `connection()` from `next/server` first.
- `proxy.ts` is the Next 16 middleware file — never the sole auth boundary.

### Styling (`rules/tailwind.md`)
- **OKLCH colours ONLY.** Never raw hex/HSL, never `#000`/`#fff` — always tint.
- 4pt spacing scale: `p-1 p-2 p-3 p-4 p-6 p-8 p-12 p-16 p-24`. Max `p-24` for page containers.
- **No arbitrary values.** No `p-[23px]`, `w-[347px]`, `text-[17px]`. Use utilities or `@theme` tokens.
- Text sizes from `text-xs`…`text-9xl` or `--font-size-*` tokens; `clamp()` for fluid type.
- `gap-*` for sibling spacing, never margin.
- **Animate `transform` and `opacity` ONLY** — never width/height/padding/margin.
- Exponential easings only: ease-out-quart, ease-out-quint, ease-out-expo.
- Banned patterns: glassmorphism, gradient text on headings, neon-on-dark.
- Banned fonts: Inter, Roboto, Arial, Open Sans, Lato, Montserrat.
  → Mission note **D-DESIGN-4**: the design specifies **Google Sans**, which is not on that
  ban list; it is self-hosted via `next/font/local` from `dashbaord-design/fonts/`.

### Data (`rules/state-data.md`)
- shadcn first — check `src/components/ui` before building custom; wrap, never duplicate, never edit.
  Install with `pnpm dlx shadcn@latest add <component>`.
- Zustand: one store per concern, typed state interface, **always use selectors**
  (`useX((s) => s.field)`), `persist` + `partialize` only for what must survive reload,
  never imported in a Server Component.
- TanStack Query: array query keys starting with the resource name; one hook per query in
  `queries/`; always invalidate or `setQueryData` after a successful mutation.
- Axios: all instances in `src/lib/axios/`; never `import axios` in a component.
- Forms: `useForm` + `zodResolver` always, schema in `schemas/`, shadcn `Form*` components,
  always `defaultValues`, the same Zod schema validates client and server.

### i18n (`rules/i18n.md`)
- **Never hardcode a user-facing string** — everything through `t()`.
- Server Components: `getTranslations` from `next-intl/server`. Client: `useTranslations`.
- Keys: PascalCase namespace, camelCase key (`Home.welcomeMessage`).
- **All six locale catalogs must have identical key shape** — en, zh, ko, ms, vi, th.
  Baseline at intake: 1151 keys each. ICU plurals for counts.
- Locale-aware `<Link>`/routing from `next-intl/navigation`; never a bare `<a>` for internal nav.

### Quality / a11y / SEO (`rules/quality.md`)
- `next/image` for every image with `width`/`height` or `fill`; `priority` for LCP.
- `next/font` for every font (self-hosted, no CLS).
- Stream slow data with `<Suspense>`; parallelize with `Promise.all`.
- `useMemo`/`useCallback` only when profiling proves need — React Compiler is on.
- Every page exports `metadata` or `generateMetadata`; title ≤60, description ≤160 chars.
- One `<h1>` per page; semantic landmarks; ordered headings.
- WCAG AA: 4.5:1 body / 3:1 large text; keyboard reachable; visible focus rings; labelled
  inputs; alt on every image; modals trap focus and close on Escape; **never `<div onClick>`**.
- Env access only through `@t3-oss/env-nextjs` in `src/lib/env.ts` — never bare `process.env`.

### Testing (`rules/testing.md`)
- TDD: red → green → refactor. Never write the test after the implementation.
- Server Components cannot render in JSDOM — prove them via Playwright.
- Every new feature ships with at least one test.
- **Mission standard (D-VERIFY-1): proof is a real Playwright run against the running app.**
  Unit tests do not count as proof of a feature.

---

## [schooltest-api] Strapi 5.50.1 backend — touched only where a metric needs a new aggregate

- pnpm only; TypeScript only; `pnpm tsc --noEmit` must pass. **Never start/stop the server**
  (it runs on :5500 under the root watchdog).
- **`strapi.documents()` only** — never the Entity Service. **`documentId`, never numeric `id`.**
- **Explicit `populate`** — never `'*'`.
- Typed errors from `@strapi/utils` only; never a bare throw that leaks as a 500.
- Content-types are hand-authored `schema.json` files. **Never the admin Content-Type Builder.**
  Run `pnpm strapi ts:generate-types` after any schema change.
- Custom routes live in `01-custom-<name>.ts` (loads before the core router). Never write
  `auth: true` in route config — omitting it means required; only `false` or `{ scope }` are valid.
- Overridden core actions MUST run `validateQuery`/`sanitizeQuery`/`sanitizeOutput`/`transformResponse`.
- Thin controllers; logic in services (`factories.createCoreService`).
- Roles, permissions and seed users are defined in code under `src/bootstrap/` — **never the admin UI**.
- Document middleware must `return next()` on every path.
- `SEED=false` in `schooltest-api/.env` is deliberate (root `.qa` **D-INT-11**) — Strapi re-runs
  `bootstrap()` on every source edit and a blueprint/bank mismatch crash-loops the API. Seeding is
  a controlled action: set true, restart, verify, set back.

---

## [schooltest-app] Electron student client — OUT OF SCOPE

Listed only so its rules are never cross-applied to the web package. This mission does not touch
`schooltest-app/**`.

---

## [workspace] Coordination

- Root `AGENTS-COORDINATION.md` is **append-only**, one heading per agent. Announce before
  resuming `schooltest-web/**` work and announce any new env key.
- Root `.qa/` belongs to mission `st-mvp-d` (Agent D). This mission owns `schooltest-web/.qa/`
  only and does not write root state.
- Root `.qa/CONTRACTS.md` is append-only; earlier agents' `C-*` entries remain binding.
- An **external auto-commit daemon** sweeps all three repos periodically (root `.qa` **OP-12**).
  Your working tree can be committed mid-edit with a generated message. Do not rewrite history
  to tidy it — land the next coherent commit on top.
- Never branch, never revert, never force-push, never amend a commit not authored this session.

---

## Command policy (both packages)

| Allowed | Forbidden |
|---|---|
| `pnpm tsc --noEmit`, `pnpm lint`, `pnpm exec playwright test` | `pnpm dev`, `pnpm build`, `pnpm start` |
| `git status`, `git log`, `git diff`, `git add`, `git commit` | `git revert`, `git reset --hard`, `git push --force`, `git rebase`, `git checkout -b` |
| `psql` reads against 127.0.0.1:5540 | dropping/truncating any table |
| `pnpm strapi ts:generate-types` (api) | the Strapi admin Content-Type Builder |
