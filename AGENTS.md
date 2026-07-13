# Next.js 16 Agent Reference

Specialized agents available for any Next.js 16 / React 19 frontend project that follows this template. Each agent is a focused expert with a narrow scope. Invoke the smallest agent that fits the task.

> Agent definitions live in `.claude/agents/<name>.md` (Claude) and `.codex/agents/<name>.toml` (Codex). Scaffolding recipes live in `.claude/skills/` and `.agents/skills/`. Binding rules live in `.claude/rules/`. See `CLAUDE.md` for the full folder map.

---

## Agent Index

| Agent | Purpose | Location |
|---|---|---|
| **nextjs-master** | Architectural decisions, cross-cutting guidance | `.claude/agents/nextjs-master.md` |
| **app-router-expert** | Routing, layouts, route groups, parallel/intercepting routes | `.claude/agents/app-router-expert.md` |
| **rsc-server-component** | Server Components, async data fetching, server-only code | `.claude/agents/rsc-server-component.md` |
| **client-component-expert** | Client Components, hooks, event handling boundaries | `.claude/agents/client-component-expert.md` |
| **server-actions-expert** | Server Actions, mutations, `useActionState`, Zod validation | `.claude/agents/server-actions-expert.md` |
| **caching-strategist** | `'use cache'`, `cacheLife`, `cacheTag`, `revalidate*` | `.claude/agents/caching-strategist.md` |
| **streaming-ppr-expert** | Suspense, streaming, Partial Prerendering | `.claude/agents/streaming-ppr-expert.md` |
| **metadata-seo-expert** | Metadata API, OpenGraph, sitemap, robots, JSON-LD | `.claude/agents/metadata-seo-expert.md` |
| **proxy-middleware-expert** | `proxy.ts`, auth redirects, locale rewriting | `.claude/agents/proxy-middleware-expert.md` |
| **route-handler-expert** | `route.ts`, webhooks, OAuth callbacks | `.claude/agents/route-handler-expert.md` |
| **module-creator** | Feature module scaffolding with correct structure | `.claude/agents/module-creator.md` |
| **component-architect** | Component hierarchies, composition, props API | `.claude/agents/component-architect.md` |
| **form-master** | react-hook-form + Zod + shadcn Form | `.claude/agents/form-master.md` |
| **zustand-store-expert** | Zustand stores, selectors, persistence | `.claude/agents/zustand-store-expert.md` |
| **tanstack-query-expert** | TanStack Query v5 hooks, cache, mutations | `.claude/agents/tanstack-query-expert.md` |
| **axios-client-expert** | Typed Axios instances, interceptors, multi user-type | `.claude/agents/axios-client-expert.md` |
| **auth-flow-expert** | Login/register/refresh/logout flows | `.claude/agents/auth-flow-expert.md` |
| **i18n-next-intl-expert** | next-intl setup, locale routing, message files | `.claude/agents/i18n-next-intl-expert.md` |
| **tailwind-v4-expert** | Tailwind v4 CSS-first, OKLCH, `@theme` tokens | `.claude/agents/tailwind-v4-expert.md` |
| **shadcn-ui-expert** | shadcn component usage and wrapping | `.claude/agents/shadcn-ui-expert.md` |
| **design-system-curator** | Tokens, fonts, typography, spacing rhythm | `.claude/agents/design-system-curator.md` |
| **performance-auditor** | Core Web Vitals, bundle size, streaming audit | `.claude/agents/performance-auditor.md` |
| **seo-auditor** | Metadata, sitemap, schema, hreflang audit | `.claude/agents/seo-auditor.md` |
| **accessibility-auditor** | WCAG AA checks, keyboard, ARIA, contrast | `.claude/agents/accessibility-auditor.md` |
| **testing-vitest-expert** | Vitest, Testing Library, component tests | `.claude/agents/testing-vitest-expert.md` |
| **testing-playwright-expert** | Playwright E2E flows | `.claude/agents/testing-playwright-expert.md` |
| **logic-extractor** | Move logic from components into hooks/services | `.claude/agents/logic-extractor.md` |
| **error-boundary-expert** | `error.tsx`, `global-error.tsx`, recovery flows | `.claude/agents/error-boundary-expert.md` |
| **loading-skeleton-expert** | `loading.tsx`, Suspense fallbacks, skeletons | `.claude/agents/loading-skeleton-expert.md` |
| **turbopack-config-expert** | Next 16 Turbopack config, loaders, aliases | `.claude/agents/turbopack-config-expert.md` |
| **env-validation-expert** | `@t3-oss/env-nextjs` schema, secret hygiene | `.claude/agents/env-validation-expert.md` |

---

## When to Use Which Agent

### nextjs-master
**Use when:**
- Making architectural decisions that span multiple concerns
- Deciding between Server Components, Server Actions, and Route Handlers
- Setting up a new project from scratch
- Unsure which specialized agent to invoke

**Do NOT use for:**
- Small, focused tasks (use the specialized agent instead)

---

### app-router-expert
**Use when:**
- Designing folder/route structure in `src/app/`
- Adding route groups `(group)`, parallel routes `@slot`, intercepting routes `(.)`
- Setting up dynamic segments and `generateStaticParams`
- Debugging routing conflicts
- Migrating from Pages Router

---

### rsc-server-component
**Use when:**
- Writing an `async` Server Component that fetches data
- Deciding what logic belongs on the server
- Adding `import 'server-only'` boundaries
- Passing Server Components as `children` into Client Components
- Streaming server data via Suspense

---

### client-component-expert
**Use when:**
- Creating an interactive component needing state, refs, or events
- Deciding where to add the `'use client'` boundary
- Ensuring client components stay small and leaf-level
- Debugging hydration mismatches

---

### server-actions-expert
**Use when:**
- Writing a mutation that runs on the server
- Using `useActionState` for pending/error states
- Validating input with Zod inside a `'use server'` function
- Calling `revalidateTag` / `revalidatePath` after mutations
- Implementing progressive enhancement with `<form action={action}>`

---

### caching-strategist
**Use when:**
- Adding `'use cache'` to a function or component
- Choosing a `cacheLife` profile (`seconds`, `minutes`, `hours`, `days`, `weeks`, `max`)
- Tagging data with `cacheTag` for invalidation
- Debugging stale data or cache misses
- Migrating from `unstable_cache`

---

### streaming-ppr-expert
**Use when:**
- Wrapping slow data fetches in `<Suspense>`
- Enabling Partial Prerendering (`experimental_ppr = true`)
- Designing parallel data fetching patterns
- Deciding between static, dynamic, and hybrid rendering

---

### metadata-seo-expert
**Use when:**
- Adding `metadata` or `generateMetadata` to a page
- Creating `app/opengraph-image.tsx` with `ImageResponse`
- Writing `app/sitemap.ts` / `app/robots.ts`
- Adding JSON-LD structured data
- Setting canonical URLs and hreflang alternates

---

### proxy-middleware-expert
**Use when:**
- Creating or editing `src/proxy.ts` (Next 16)
- Adding auth redirects at the edge
- Composing next-intl middleware with custom logic
- Configuring `matcher` patterns
- Migrating from `middleware.ts` to `proxy.ts`

---

### route-handler-expert
**Use when:**
- Creating `app/api/[name]/route.ts` for webhooks, OAuth callbacks, RSS/XML, file uploads
- Handling multipart form data on the server
- Setting custom response headers or streaming
- **Not** for internal app data mutations (use Server Actions).

---

### module-creator
**Use when:**
- Scaffolding a new feature module under `src/modules/`
- Setting up the folder structure (components/hooks/stores/queries/actions/schemas/lib/types/constants)
- Creating the `index.ts` barrel file
- Migrating loose files into a module

---

### component-architect
**Use when:**
- Splitting a large component into smaller ones
- Designing a component's props API
- Choosing between composition and configuration
- Deciding what goes in `src/components` vs `src/modules/*/components`

---

### form-master
**Use when:**
- Creating any form
- Writing the Zod schema
- Wiring `useForm` + `zodResolver` + shadcn `Form`
- Handling async submit with TanStack Query mutation or Server Action
- Implementing multi-step forms

---

### zustand-store-expert
**Use when:**
- Creating a new global store under `src/modules/[name]/stores/`
- Adding `persist` middleware with `partialize`
- Writing typed selectors to avoid re-renders
- Splitting a mega-store into focused stores

---

### tanstack-query-expert
**Use when:**
- Writing a `useQuery` or `useMutation` hook
- Designing query keys and invalidation strategies
- Configuring `staleTime`, `gcTime`, retry logic
- Implementing optimistic updates
- Setting up infinite queries and pagination

---

### axios-client-expert
**Use when:**
- Creating typed Axios instances in `src/lib/axios/`
- Writing request/response interceptors
- Handling 401 refresh/logout flows
- Supporting multi user-type auth (admin/customer/vendor)

---

### auth-flow-expert
**Use when:**
- Implementing login, register, logout, refresh token flows
- Storing tokens safely (httpOnly cookies, not localStorage)
- Protecting routes at the `proxy.ts` layer AND re-checking in actions
- Integrating Auth.js v5 (NextAuth) OR a custom Axios-based flow

---

### i18n-next-intl-expert
**Use when:**
- Setting up `src/i18n/routing.ts` and `src/i18n/request.ts`
- Adding a new locale
- Adding or renaming translation keys
- Using ICU plurals/selects
- Working with locale-aware navigation (`next-intl/navigation`)

---

### tailwind-v4-expert
**Use when:**
- Configuring Tailwind v4 CSS-first in `globals.css`
- Adding `@theme` tokens (colors, fonts, spacing, radii)
- Defining OKLCH color scales
- Setting up dark mode tokens
- Migrating from v3 config to v4 CSS-first

---

### shadcn-ui-expert
**Use when:**
- Installing a new shadcn component (`pnpm dlx shadcn@latest add X`)
- Wrapping a shadcn primitive for module-specific behavior
- Composing multiple shadcn primitives (e.g., Dialog + Form + Select)

---

### design-system-curator
**Use when:**
- Picking fonts (from the approved list)
- Building a color palette with OKLCH
- Defining spacing rhythm (4pt scale)
- Auditing for banned patterns (Inter, pure black/white, HSL, gradient headings)

---

### performance-auditor
**Use when:**
- Investigating slow page loads or bad Core Web Vitals
- Analyzing bundle size with `@next/bundle-analyzer`
- Finding components that should stream via Suspense
- Spotting unnecessary `'use client'` boundaries
- Migrating from `<img>` to `next/image`

---

### seo-auditor
**Use when:**
- Reviewing metadata coverage across all pages
- Checking sitemap completeness and canonical URLs
- Validating JSON-LD structured data
- Verifying hreflang alternates

---

### accessibility-auditor
**Use when:**
- Running a WCAG AA pass on a page or component
- Checking keyboard navigation and focus order
- Auditing color contrast
- Validating ARIA usage and semantic HTML

---

### testing-vitest-expert
**Use when:**
- Writing unit/component tests with Vitest + Testing Library
- Setting up `vitest.config.ts` with the `@` alias
- Mocking Axios instances, stores, or query hooks
- Testing custom hooks with `renderHook`

---

### testing-playwright-expert
**Use when:**
- Writing E2E tests for user flows
- Setting up `playwright.config.ts`
- Handling authentication state reuse
- Debugging flaky tests with traces

---

### logic-extractor
**Use when:**
- A component has grown past 120 lines
- Business logic is tangled with JSX
- Multiple components need the same logic
- Extracting into custom hooks or pure utility functions

---

### error-boundary-expert
**Use when:**
- Creating `error.tsx` for a route segment
- Creating `global-error.tsx` at the root
- Adding recovery affordances (`reset()` buttons)
- Logging errors to an observability platform

---

### loading-skeleton-expert
**Use when:**
- Creating `loading.tsx` for a segment
- Designing skeleton screens that match the final layout
- Deciding between `loading.tsx` and inline `<Suspense>`

---

### turbopack-config-expert
**Use when:**
- Configuring Turbopack in `next.config.ts`
- Adding path aliases or resolver rules
- Investigating a build-time error unique to Turbopack
- Confirming a Webpack loader has a Turbopack equivalent

---

### env-validation-expert
**Use when:**
- Creating or extending `src/lib/env.ts` with `@t3-oss/env-nextjs`
- Auditing the codebase for raw `process.env.*` access
- Splitting server-only vs `NEXT_PUBLIC_*` variables

---

## Agent Invocation Rules

1. **One agent at a time.** Don't stack multiple specialized agents on one task.
2. **Smallest scope wins.** Prefer `form-master` over `nextjs-master` for a form.
3. **Server vs Client first.** Decide the boundary before picking an agent.
4. **No agent = no action.** If no agent fits, fall back to the CLAUDE.md rules and ask the user.
5. **Agents follow the CLAUDE.md rules.** An agent cannot override any rule in `CLAUDE.md`.

---

## Key Patterns (Quick Reference)

### Module Structure (MANDATORY)

```
src/modules/[module-name]/
├── components/         # PascalCase.tsx
├── hooks/              # useX.ts
├── stores/             # use-x-store.ts
├── queries/            # use-x.query.ts / use-x.mutation.ts
├── actions/            # x.action.ts ('use server')
├── schemas/            # x.schema.ts (Zod)
├── lib/                # pure utils
├── types/              # x.types.ts
├── constants/          # x.constants.ts
└── index.ts            # public barrel
```

### Import Pattern (MANDATORY)
```ts
// Always @/ aliases; never ../../
import { ProductList } from '@/modules/products';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

### Server vs Client Boundary
```tsx
// Server Component (default) — fetches data
export default async function Page() {
  const products = await getProducts();
  return <ProductGrid products={products} />; // can render client children
}

// Client Component — interactive leaf
'use client';
export function AddToCart({ id }: { id: string }) {
  const { mutate } = useAddToCart();
  return <button onClick={() => mutate(id)}>Add</button>;
}
```

### Form (MANDATORY)
```tsx
'use client';
const schema = z.object({ email: z.string().email() });
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
```

### API Call (MANDATORY)
```ts
// Never raw fetch; always through a query hook that uses privateApi
import { useProducts } from '@/modules/products';
const { data, isLoading } = useProducts();
```

### Server Action (MANDATORY shape)
```ts
'use server';
export async function createThing(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, errors: parsed.error.flatten().fieldErrors };
  await db.things.create({ data: parsed.data });
  revalidateTag('things');
  return { ok: true as const };
}
```

### Caching (MANDATORY shape)
```ts
'use cache';
export async function getThings() {
  cacheLife('hours');
  cacheTag('things');
  return await db.things.findMany();
}
```

---

## Quick Diagnostics

```bash
# Module structure
ls -la src/modules/

# Find client components
grep -rn "^'use client'" src/modules/ src/app/

# Find server actions
grep -rn "^'use server'" src/modules/

# Find cached functions
grep -rn "^'use cache'" src/modules/ src/app/

# Find forms
grep -rn "useForm" src/modules/

# Find raw fetch usage (should be zero in client code)
grep -rn "fetch(" src/modules/

# Find raw process.env usage (should only be in src/lib/env.ts)
grep -rn "process.env" src/ --include="*.ts" --include="*.tsx"

# Typecheck
pnpm tsc --noEmit

# Lint
pnpm lint
```

---

## Best Practices (Consolidated)

1. **Server by default** — only `'use client'` when necessary.
2. **Modules for all code** — nothing outside `src/modules/` (except `app/`, `components/ui`, `lib`).
3. **shadcn first** — never reinvent primitives; wrap them.
4. **Axios for HTTP** — typed instances under `src/lib/axios/`.
5. **RHF + Zod for forms** — no manual form state.
6. **TanStack Query for server state** — no manual `useEffect` fetches.
7. **Zustand for client state** — one store per concern.
8. **Extract logic** — components render, hooks manage.
9. **Small components** — max 120 lines.
10. **Error handling** — every route segment has `error.tsx` and `loading.tsx` where it matters.
11. **Validate input twice** — client (RHF+Zod) AND server (same Zod schema in Server Action).
12. **Cache explicitly** — `'use cache'` + `cacheTag` + `revalidateTag`.
13. **Metadata everywhere** — every page exports `metadata` or `generateMetadata`.
14. **i18n everything** — no hardcoded user-facing strings.
15. **a11y always** — keyboard, focus, contrast, semantics.

---

## Agent Model Reference

| Agent | Model | Color |
|---|---|---|
| nextjs-master | opus | blue |
| app-router-expert | sonnet | indigo |
| rsc-server-component | sonnet | violet |
| client-component-expert | sonnet | purple |
| server-actions-expert | sonnet | fuchsia |
| caching-strategist | sonnet | rose |
| streaming-ppr-expert | sonnet | orange |
| metadata-seo-expert | sonnet | amber |
| proxy-middleware-expert | sonnet | red |
| route-handler-expert | sonnet | lime |
| module-creator | sonnet | green |
| component-architect | sonnet | emerald |
| form-master | sonnet | yellow |
| zustand-store-expert | sonnet | teal |
| tanstack-query-expert | sonnet | cyan |
| axios-client-expert | sonnet | sky |
| auth-flow-expert | sonnet | red |
| i18n-next-intl-expert | sonnet | blue |
| tailwind-v4-expert | sonnet | pink |
| shadcn-ui-expert | sonnet | slate |
| design-system-curator | sonnet | stone |
| performance-auditor | opus | orange |
| seo-auditor | sonnet | amber |
| accessibility-auditor | sonnet | green |
| testing-vitest-expert | sonnet | cyan |
| testing-playwright-expert | sonnet | violet |
| logic-extractor | sonnet | cyan |
| error-boundary-expert | sonnet | pink |
| loading-skeleton-expert | sonnet | gray |
| turbopack-config-expert | sonnet | zinc |
| env-validation-expert | sonnet | neutral |

---

*Last Updated: 2026-04-07 — targets Next.js 16.x, React 19, Tailwind v4, next-intl, Turbopack.*
