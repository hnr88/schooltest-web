---
paths:
  - "src/app/**"
  - "src/modules/**/actions/**"
  - "src/modules/**/components/**"
---

Docs: `.claude/docs/getting-started/server-and-client-components.md`, `.claude/docs/getting-started/caching.md`, `.claude/docs/getting-started/revalidating.md`, `.claude/docs/getting-started/error-handling.md`

## Server Components (default)

Default for every file in `src/app/`. Ship zero JS to the client.
1. CAN be `async` and `await` data directly.
2. CANNOT use `useState`, `useEffect`, `useRef`, browser APIs, event handlers.
3. CANNOT import Zustand stores or client-only modules.
4. Use `getTranslations` from `next-intl/server` for i18n.
5. Use `import 'server-only'` to prevent accidental client import of server modules.

## Client Components

Add `'use client'` ONLY when needed: state hooks, effects, event handlers, browser APIs, Zustand, TanStack Query, client-only libs.
1. `'use client'` MUST be the very first line. No exceptions.
2. Push it as far down the tree as possible. Wrap leaves, not pages.
3. Server Component CAN render Client Component with serializable props.
4. Client Component CANNOT import Server Component — receive as `children`.
5. Never add `'use client'` "just in case".
6. Use `useTranslations` from `next-intl` for i18n.
7. Use `import 'client-only'` to mark modules with browser-only code.

## Server Functions & Actions

Server Functions are async functions marked `'use server'`. Server Actions are the subset used for mutations.
1. Place in `src/modules/[name]/actions/x.action.ts`.
2. Validate ALL input with Zod on the server. Never trust the client.
3. Return serializable values only.
4. After mutations, use `updateTag('tag')` for read-your-own-writes, or `revalidateTag('tag', 'max')` for stale-while-revalidate.
5. Use `refresh()` from `next/cache` to refresh the client router without tag revalidation.
6. Pair with `useActionState` (React 19) for pending/error UI.
7. NOT a security boundary — re-check auth inside EVERY action.
8. Server Functions are callable via direct POST — always verify auth/authorization.

## Route Handlers

Use `route.ts` ONLY for public HTTP endpoints (webhooks, OAuth, file uploads). Prefer Server Actions for own-UI mutations.
With `cacheComponents: true`, GET Route Handlers follow the same prerendering model as pages.

## Streaming & PPR (Partial Prerendering)

PPR is the default rendering model when `cacheComponents: true` is set.
1. Wrap slow fetches in `<Suspense fallback={<Skeleton />}>`.
2. Parallelize with `Promise.all` or multiple `<Suspense>` side by side.
3. Components accessing runtime APIs (`cookies`, `headers`, `searchParams`) MUST be wrapped in `<Suspense>`.
4. For non-deterministic operations (`Math.random()`, `Date.now()`), call `connection()` from `next/server` first and wrap in `<Suspense>`.
5. Static content + `use cache` content = static shell. Dynamic content streams at request time.

## Parallel & Intercepting Routes

1. Parallel routes: `@slot` folders for simultaneous page rendering.
2. **All parallel route slots REQUIRE explicit `default.tsx` files.** Builds fail without them.
3. Intercepting routes: `(.)folder`, `(..)folder`, `(...)folder`.
4. Use ONLY when they genuinely simplify UX. Never speculatively.

## Error/Loading Boundaries

1. `loading.tsx` — lightweight skeletons, NOT spinners.
2. `error.tsx` — MUST be `'use client'`, use `unstable_retry()` to recover (re-fetches and re-renders including Server Components).
3. `not-found.tsx` — triggered by `notFound()`.
4. `global-error.tsx` — root-level only, MUST define its own `<html>` and `<body>`.
5. Component-level errors: use `unstable_catchError` from `next/error` to create inline error boundaries anywhere in the tree.

## Caching (Next.js 16) — Cache Components Model

Enable with `cacheComponents: true` in `next.config.ts`. NOTHING is cached unless you opt in.
1. `'use cache'` directive at top of function/component body to cache its return value.
2. `cacheLife('seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max')` for TTL.
3. `cacheTag('name')` for on-demand invalidation.
4. Arguments and closed-over values become part of the cache key automatically.
5. React `cache()` for request-level deduplication within a single render.
6. Never cache user-specific data unless tagged per-user.
7. Always tag cached data. `cacheLife('max')` ONLY for truly immutable data.
8. Short-lived caches (`seconds` profile, `revalidate: 0`, expire < 5min) are excluded from prerenders — they become dynamic holes.

### Revalidation APIs

| API | Where | Behavior | Use when |
|---|---|---|---|
| `updateTag('tag')` | Server Actions only | Immediately expires cache | Read-your-own-writes (user sees change instantly) |
| `revalidateTag('tag', 'max')` | Server Actions + Route Handlers | Stale-while-revalidate | Background refresh (slight delay OK) |
| `revalidatePath('/path')` | Server Actions + Route Handlers | Invalidates all cache for a path | Don't know which tags to invalidate |
| `refresh()` | Server Actions only | Refreshes client router | No tagged data to revalidate |

**`revalidateTag` now requires a second argument** (cacheLife profile). Use `'max'` for the longest stale window.

## proxy.ts (Middleware)

1. File MUST be named `proxy.ts` (Next 16). Export a named `proxy` function or default export.
2. Config flag: `skipProxyUrlNormalize` (replaces `skipMiddlewareUrlNormalize`).
3. Never use as sole auth boundary. Re-check in actions/handlers.
4. Keep logic minimal — runs on EVERY matched request.
5. `fetch` with cache options has no effect in proxy.

## Turbopack

1. Default for `next dev` and `next build`. No flags needed.
2. Config: top-level `turbopack` option in `next.config.ts` (no longer under `experimental`).
3. Filesystem caching in dev: `experimental.turbopackFileSystemCacheForDev: true`.
4. Never add Webpack-specific config. If Webpack is needed, use `--webpack` flag.

## React 19.2 Features

1. `reactCompiler: true` in `next.config.ts` (stable, no longer experimental). Requires `babel-plugin-react-compiler`.
2. View Transitions: `<ViewTransition>` for animating elements during navigations.
3. `useEffectEvent`: extract non-reactive logic from Effects.
4. `<Activity>`: render background UI with `display: none` while preserving state.
