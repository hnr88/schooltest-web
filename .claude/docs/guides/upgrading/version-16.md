---
title: How to upgrade to version 16
description: Upgrade your Next.js Application from Version 15 to 16.
url: "https://nextjs.org/docs/app/guides/upgrading/version-16"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Guides: /docs/app/guides"
  - "Upgrading: /docs/app/guides/upgrading"
---

## Upgrading from 15 to 16

### Using AI Agents with Next.js DevTools MCP

If you're using an AI coding assistant that supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), you can use the **Next.js DevTools MCP** to automate the upgrade process and migration tasks.

#### Setup

Add the following configuration to your MCP client:

```json filename=".mcp.json"
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

For more information, visit the [`next-devtools-mcp`](https://github.com/vercel/next-devtools-mcp) documentation to configure with your MCP client.

### Using the Codemod

To update to Next.js version 16, you can use the `upgrade` [codemod](/docs/app/guides/upgrading/codemods#160):

```bash package="pnpm"
pnpm dlx @next/codemod@canary upgrade latest
```

```bash package="npm"
npx @next/codemod@canary upgrade latest
```

```bash package="yarn"
yarn dlx @next/codemod@canary upgrade latest
```

```bash package="bun"
bunx @next/codemod@canary upgrade latest
```

The [codemod](/docs/app/guides/upgrading/codemods#160) is able to:

* Update `next.config.js` to use the new `turbopack` configuration
* Migrate from `next lint` to the ESLint CLI
* Migrate from deprecated `middleware` convention to `proxy`
* Remove `unstable_` prefix from stabilized APIs
* Remove `experimental_ppr` Route Segment Config from pages and layouts

If you prefer to do it manually, install the latest Next.js and React versions:

```bash package="pnpm"
pnpm add next@latest react@latest react-dom@latest
```

```bash package="npm"
npm install next@latest react@latest react-dom@latest
```

```bash package="yarn"
yarn add next@latest react@latest react-dom@latest
```

```bash package="bun"
bun add next@latest react@latest react-dom@latest
```

If you are using TypeScript, ensure you also upgrade `@types/react` and `@types/react-dom` to their latest versions.

## Node.js runtime and browser support

| Requirement   | Change / Details                                                   |
| ------------- | ------------------------------------------------------------------ |
| Node.js 20.9+ | Minimum version now `20.9.0` (LTS); Node.js 18 no longer supported |
| TypeScript 5+ | Minimum version now `5.1.0`                                        |
| Browsers      | Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+                 |

## Turbopack by default

Starting with **Next.js 16**, Turbopack is stable and used by default with `next dev` and `next build`.

Previously you had to enable Turbopack using `--turbopack`, or `--turbo`.

This is no longer necessary. You can update your `package.json` scripts:

```json filename="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

If your project has a custom `webpack` configuration and you run `next build` (which now uses Turbopack by default), the build will **fail** to prevent misconfiguration issues.

You have a few different ways to address this:

* **Use Turbopack anyway:** Run with `next build --turbopack` to build using Turbopack and ignore your `webpack` config.
* **Switch to Turbopack fully:** Migrate your `webpack` config to Turbopack-compatible options.
* **Keep using Webpack:** Use the `--webpack` flag to opt out of Turbopack and build with Webpack.

### Opting out of Turbopack

If you need to continue using Webpack, you can opt out with the `--webpack` flag:

```json filename="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build --webpack",
    "start": "next start"
  }
}
```

### Turbopack configuration location

The `experimental.turbopack` configuration is out of experimental. You can use it as a top-level `turbopack` option:

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // options
  },
}

export default nextConfig
```

### Turbopack File System Caching (beta)

Turbopack now supports filesystem caching in development:

```ts filename="next.config.ts" switcher
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}

export default nextConfig
```

## Async Request APIs (Breaking change)

Version 15 introduced Async Request APIs as a breaking change, with **temporary** synchronous compatibility.

Starting with **Next.js 16**, synchronous access is fully removed. These APIs can only be accessed asynchronously:

* [`cookies`](/docs/app/api-reference/functions/cookies)
* [`headers`](/docs/app/api-reference/functions/headers)
* [`draftMode`](/docs/app/api-reference/functions/draft-mode)
* `params` in [`layout.js`](/docs/app/api-reference/file-conventions/layout), [`page.js`](/docs/app/api-reference/file-conventions/page), [`route.js`](/docs/app/api-reference/file-conventions/route), [`default.js`](/docs/app/api-reference/file-conventions/default), [`opengraph-image`](/docs/app/api-reference/file-conventions/metadata/opengraph-image#opengraph-image), [`twitter-image`](/docs/app/api-reference/file-conventions/metadata/opengraph-image#twitter-image), [`icon`](/docs/app/api-reference/file-conventions/metadata/app-icons#icon), and [`apple-icon`](/docs/app/api-reference/file-conventions/metadata/app-icons#apple-icon).
* `searchParams` in [`page.js`](/docs/app/api-reference/file-conventions/page)

Use the [codemod](/docs/app/guides/upgrading/codemods#migrate-to-async-dynamic-apis) to migrate to async Request-time APIs.

### Migrating types for async Request-time APIs

To help migrate to async `params` and `searchParams`, you can run [`npx next typegen`](/docs/app/api-reference/cli/next#next-typegen-options) to automatically generate globally available type helpers:

* [`PageProps`](/docs/app/api-reference/file-conventions/page#page-props-helper)
* [`LayoutProps`](/docs/app/api-reference/file-conventions/layout#layout-props-helper)
* [`RouteContext`](/docs/app/api-reference/file-conventions/route#route-context-helper)

```tsx filename="/app/blog/[slug]/page.tsx"
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
  return <h1>Blog Post: {slug}</h1>
}
```

## Async parameters for icon, and open-graph Image (Breaking change)

The props passed to the image generating functions in `opengraph-image`, `twitter-image`, `icon`, and `apple-icon`, are now Promises.

Starting with **Next.js 16**, the image generating function now receives `params` and `id` as promises. The `generateImageMetadata` function continues to receive synchronous `params`.

```js filename="app/shop/[slug]/opengraph-image.js"
export async function generateImageMetadata({ params }) {
  const { slug } = params
  return [{ id: '1' }, { id: '2' }]
}

// Next.js 16 - asynchronous params and id access
export default async function Image({ params, id }) {
  const { slug } = await params // params now async
  const imageId = await id // id is now Promise<string> when using generateImageMetadata
  // ...
}
```

## Async `id` parameter for `sitemap` (Breaking change)

Starting with **Next.js 16**, the `sitemap` generating function now receives `id` as a promise.

```js filename="app/product/sitemap.js"
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]
}

// Next.js 16 - asynchronous id access
export default async function sitemap({ id }) {
  const resolvedId = await id // id is now Promise<string>
  const start = Number(resolvedId) * 50000
  // ...
}
```

## React 19.2

The App Router in **Next.js 16** uses the latest React Canary release, which includes the newly released React 19.2 features:

* **[View Transitions](https://react.dev/reference/react/ViewTransition)**: Animate elements that update inside a Transition or navigation
* **[`useEffectEvent`](https://react.dev/reference/react/useEffectEvent)**: Extract non-reactive logic from Effects into reusable Effect Event functions
* **[Activity](https://react.dev/reference/react/Activity)**: Render "background activity" by hiding UI with `display: none` while maintaining state and cleaning up Effects

Learn more in the [React 19.2 announcement](https://react.dev/blog/2025/10/01/react-19-2).

## React Compiler Support

Built-in support for the React Compiler is now stable in **Next.js 16** following the React Compiler's 1.0 release.

The `reactCompiler` configuration option has been promoted from `experimental` to stable:

```ts filename="next.config.ts" switcher
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
}

export default nextConfig
```

Install the latest version of the React Compiler plugin:

```bash package="pnpm"
pnpm add -D babel-plugin-react-compiler
```

## Caching APIs

### revalidateTag

[`revalidateTag`](/docs/app/api-reference/functions/revalidateTag) now requires a second argument specifying a [`cacheLife`](/docs/app/api-reference/functions/cacheLife#reference) profile. The single-argument form is deprecated.

```ts
// Before
revalidateTag('posts')

// After
revalidateTag('posts', 'max')
```

### updateTag

[`updateTag`](/docs/app/api-reference/functions/updateTag) is a new Server Actions-only API that provides **read-your-writes** semantics, where a user makes a change and the UI immediately shows the change, rather than stale data.

```ts filename="app/actions.ts" switcher
'use server'

import { updateTag } from 'next/cache'

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile)

  // Expire cache and refresh immediately - user sees their changes right away
  updateTag(`user-${userId}`)
}
```

### refresh

[`refresh`](/docs/app/api-reference/functions/refresh) allows you to refresh the client router from within a Server Action.

```ts filename="app/actions.ts" switcher
'use server'

import { refresh } from 'next/cache'

export async function markNotificationAsRead(notificationId: string) {
  await db.notifications.markAsRead(notificationId)
  refresh()
}
```

### cacheLife and cacheTag

[`cacheLife`](/docs/app/api-reference/functions/cacheLife) and [`cacheTag`](/docs/app/api-reference/functions/cacheTag) are now stable. The `unstable_` prefix is no longer needed.

```ts
import { cacheLife, cacheTag } from 'next/cache'
```

## Enhanced Routing and Navigation

**Next.js 16** includes a complete overhaul of the routing and navigation system:

* **Layout deduplication**: When prefetching multiple URLs with a shared layout, the layout is downloaded once.
* **Incremental prefetching**: Next.js only prefetches parts not already in cache, rather than entire pages.

These changes require **no code modifications** and are designed to improve performance across all apps.

## Partial Prerendering (PPR)

**Next.js 16** removes the experimental PPR flag and configuration options, including the route level segment `experimental_ppr`.

Starting with **Next.js 16**, you can opt into PPR using the [`cacheComponents`](/docs/app/api-reference/config/next-config-js/cacheComponents) configuration:

```js filename="next.config.js"
/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
}

module.exports = nextConfig
```

PPR in **Next.js 16** works differently than in **Next.js 15** canaries. If you are using PPR today, stay in the current Next.js 15 canary you are using. See [Migrating to Cache Components](/docs/app/guides/migrating-to-cache-components) for migration patterns.

## `middleware` to `proxy`

The `middleware` filename is deprecated, and has been renamed to `proxy` to clarify network boundary and routing focus.

```bash filename="Terminal"
# Rename your middleware file
mv middleware.ts proxy.ts
```

The named export `middleware` is also deprecated. Rename your function to `proxy`:

```ts filename="proxy.ts" switcher
export function proxy(request: Request) {}
```

Configuration flags that contained the `middleware` name are also renamed. For example, `skipMiddlewareUrlNormalize` is now `skipProxyUrlNormalize`:

```ts filename="next.config.ts" switcher
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  skipProxyUrlNormalize: true,
}

export default nextConfig
```

## `next/image` changes

### Local Images with Query Strings (Breaking change)

Local image sources with query strings now require `images.localPatterns.search` configuration.

### `minimumCacheTTL` Default (Breaking change)

The default value for `images.minimumCacheTTL` has changed from `60 seconds` to `4 hours` (14400 seconds).

### `imageSizes` Default (Breaking change)

The value `16` has been removed from the default `images.imageSizes` array.

### `qualities` Default (Breaking change)

The default value for `images.qualities` has changed from allowing all qualities to only `[75]`.

### Local IP Restriction (Breaking change)

A new security restriction blocks local IP optimization by default. Set `images.dangerouslyAllowLocalIP` to `true` only for private networks.

### Maximum Redirects (Breaking change)

The default for `images.maximumRedirects` has changed from unlimited to 3 redirects maximum.

### `next/legacy/image` Component (deprecated)

The `next/legacy/image` component is deprecated. Use `next/image` instead.

### `images.domains` Configuration (deprecated)

The `images.domains` config is deprecated. Use `images.remotePatterns` instead for improved security.

## Concurrent `dev` and `build`

`next dev` and `next build` now use separate output directories, enabling concurrent execution. The `next dev` command outputs to `.next/dev`.

## Parallel Routes `default.js` requirement

All parallel route slots now require explicit `default.js` files. Builds will fail without them.

```tsx filename="app/@modal/default.tsx"
import { notFound } from 'next/navigation'

export default function Default() {
  notFound()
}
```

## ESLint Flat Config

`@next/eslint-plugin-next` now defaults to ESLint Flat Config format, aligning with ESLint v10 which will drop legacy config support.

## Scroll Behavior Override

In **Next.js 16**, Next.js will **no longer override** your `scroll-behavior` setting during navigation.

If you want Next.js to perform this override (the previous default behavior), add the `data-scroll-behavior="smooth"` attribute to your `<html>` element:

```tsx filename="app/layout.tsx"
export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
```

## Performance Improvements

**Next.js 16** removes the `size` and `First Load JS` metrics from the `next build` output. The most effective way to measure actual route performance is through tools such as Chrome Lighthouse or Vercel Analytics.

## Build Adapters API (alpha)

The first alpha version of the Build Adapters API is now available.

```js filename="next.config.js"
const nextConfig = {
  experimental: {
    adapterPath: require.resolve('./my-adapter.js'),
  },
}

module.exports = nextConfig
```

`adapterPath` was promoted to a stable, top-level option in 16.2.0.

## Modern Sass API

`sass-loader` has been bumped to v16, which supports modern Sass syntax and new features.

## Removals

These features were previously deprecated and are now removed:

### AMP Support

All AMP APIs and configurations have been removed.

### `next lint` Command

The `next lint` command has been removed. Use Biome or ESLint directly. `next build` no longer runs linting.

A codemod is available to automate migration:

```bash package="pnpm"
pnpm dlx @next/codemod@canary next-lint-to-eslint-cli .
```

### Runtime Configuration

`serverRuntimeConfig` and `publicRuntimeConfig` have been removed. Use environment variables instead.

For server-only values, access environment variables directly in Server Components. For client-accessible values, use the `NEXT_PUBLIC_` prefix.

### `devIndicators` Options

The following options have been removed from `devIndicators`: `appIsrStatus`, `buildActivity`, `buildActivityPosition`.

### `experimental.dynamicIO`

The `experimental.dynamicIO` flag has been renamed to `cacheComponents`.

### `unstable_rootParams`

The `unstable_rootParams` function has been removed. We are working on an alternative API that we will ship in an upcoming minor release.
