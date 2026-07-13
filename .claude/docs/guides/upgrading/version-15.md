---
title: How to upgrade to version 15
description: Upgrade your Next.js Application from Version 14 to 15.
url: "https://nextjs.org/docs/app/guides/upgrading/version-15"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Guides: /docs/app/guides"
  - "Upgrading: /docs/app/guides/upgrading"
---

## Upgrading from 14 to 15

To update to Next.js version 15, you can use the `upgrade` codemod:

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

If you prefer to do it manually, ensure that you're installing the latest Next & React versions:

```bash package="pnpm"
pnpm add next@latest react@latest react-dom@latest eslint-config-next@latest
```

```bash package="npm"
npm install next@latest react@latest react-dom@latest eslint-config-next@latest
```

```bash package="yarn"
yarn add next@latest react@latest react-dom@latest eslint-config-next@latest
```

```bash package="bun"
bun add next@latest react@latest react-dom@latest eslint-config-next@latest
```

> **Good to know:**
>
> * If you see a peer dependencies warning, you may need to update `react` and `react-dom` to the suggested versions, or use the `--force` or `--legacy-peer-deps` flag to ignore the warning. This won't be necessary once both Next.js 15 and React 19 are stable.

## React 19

* The minimum versions of `react` and `react-dom` is now 19.
* `useFormState` has been replaced by `useActionState`. The `useFormState` hook is still available in React 19, but it is deprecated and will be removed in a future release. `useActionState` is recommended and includes additional properties like reading the `pending` state directly. [Learn more](https://react.dev/reference/react/useActionState).
* `useFormStatus` now includes additional keys like `data`, `method`, and `action`. If you are not using React 19, only the `pending` key is available. [Learn more](https://react.dev/reference/react-dom/hooks/useFormStatus).
* Read more in the [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide).

> **Good to know:** If you are using TypeScript, ensure you also upgrade `@types/react` and `@types/react-dom` to their latest versions.

## Async Request APIs (Breaking change)

Previously synchronous Request-time APIs that rely on request information are now **asynchronous**:

* [`cookies`](/docs/app/api-reference/functions/cookies)
* [`headers`](/docs/app/api-reference/functions/headers)
* [`draftMode`](/docs/app/api-reference/functions/draft-mode)
* `params` in [`layout.js`](/docs/app/api-reference/file-conventions/layout), [`page.js`](/docs/app/api-reference/file-conventions/page), [`route.js`](/docs/app/api-reference/file-conventions/route), [`default.js`](/docs/app/api-reference/file-conventions/default), [`opengraph-image`](/docs/app/api-reference/file-conventions/metadata/opengraph-image), [`twitter-image`](/docs/app/api-reference/file-conventions/metadata/opengraph-image), [`icon`](/docs/app/api-reference/file-conventions/metadata/app-icons), and [`apple-icon`](/docs/app/api-reference/file-conventions/metadata/app-icons).
* `searchParams` in [`page.js`](/docs/app/api-reference/file-conventions/page)

To ease the burden of migration, a [codemod is available](/docs/app/guides/upgrading/codemods#150) to automate the process and the APIs can temporarily be accessed synchronously.

### `cookies`

#### Recommended Async Usage

```tsx
import { cookies } from 'next/headers'

// Before
const cookieStore = cookies()
const token = cookieStore.get('token')

// After
const cookieStore = await cookies()
const token = cookieStore.get('token')
```

### `headers`

#### Recommended Async Usage

```tsx
import { headers } from 'next/headers'

// Before
const headersList = headers()
const userAgent = headersList.get('user-agent')

// After
const headersList = await headers()
const userAgent = headersList.get('user-agent')
```

### `draftMode`

#### Recommended Async Usage

```tsx
import { draftMode } from 'next/headers'

// Before
const { isEnabled } = draftMode()

// After
const { isEnabled } = await draftMode()
```

### `params` & `searchParams`

#### Asynchronous Layout

```tsx filename="app/layout.tsx" switcher
// Before
type Params = { slug: string }

export function generateMetadata({ params }: { params: Params }) {
  const { slug } = params
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const { slug } = params
}

// After
type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const { slug } = await params
}
```

#### Synchronous Layout

```tsx filename="app/layout.tsx" switcher
// Before
type Params = { slug: string }

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const { slug } = params
}

// After
import { use } from 'react'

type Params = Promise<{ slug: string }>

export default function Layout(props: {
  children: React.ReactNode
  params: Params
}) {
  const params = use(props.params)
  const slug = params.slug
}
```

#### Route Handlers

```tsx filename="app/api/route.ts" switcher
// Before
type Params = { slug: string }

export async function GET(request: Request, segmentData: { params: Params }) {
  const params = segmentData.params
  const slug = params.slug
}

// After
type Params = Promise<{ slug: string }>

export async function GET(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params
  const slug = params.slug
}
```

## `runtime` configuration (Breaking change)

The `runtime` segment configuration previously supported a value of `experimental-edge` in addition to `edge`. Both configurations refer to the same thing, and to simplify the options, we will now error if `experimental-edge` is used. To fix this, update your `runtime` configuration to `edge`. A [codemod](/docs/app/guides/upgrading/codemods#app-dir-runtime-config-experimental-edge) is available to automatically do this.

## `fetch` requests

[`fetch` requests](/docs/app/api-reference/functions/fetch) are no longer cached by default.

To opt specific `fetch` requests into caching, you can pass the `cache: 'force-cache'` option.

```js filename="app/layout.js"
export default async function RootLayout() {
  const a = await fetch('https://...') // Not Cached
  const b = await fetch('https://...', { cache: 'force-cache' }) // Cached

  // ...
}
```

To opt all `fetch` requests in a layout or page into caching, you can use the `export const fetchCache = 'default-cache'` segment config option. If individual `fetch` requests specify a `cache` option, that will be used instead.

```js filename="app/layout.js"
// Since this is the root layout, all fetch requests in the app
// that don't set their own cache option will be cached.
export const fetchCache = 'default-cache'

export default async function RootLayout() {
  const a = await fetch('https://...') // Cached
  const b = await fetch('https://...', { cache: 'no-store' }) // Not cached

  // ...
}
```

## Route Handlers

`GET` functions in [Route Handlers](/docs/app/api-reference/file-conventions/route) are no longer cached by default. To opt `GET` methods into caching, you can use a route config option such as `export const dynamic = 'force-static'` in your Route Handler file.

```js filename="app/api/route.js"
export const dynamic = 'force-static'

export async function GET() {}
```

## Client Cache

When navigating between pages via `<Link>` or `useRouter`, page segments are no longer reused from the Client Cache. However, they are still reused during browser backward and forward navigation and for shared layouts.

To opt page segments into caching, you can use the [`staleTimes`](/docs/app/api-reference/config/next-config-js/staleTimes) config option:

```js filename="next.config.js"
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
}

module.exports = nextConfig
```

Layouts and loading states are still cached and reused on navigation.

## `next/font`

The `@next/font` package has been removed in favor of the built-in [`next/font`](/docs/app/api-reference/components/font). A [codemod is available](/docs/app/guides/upgrading/codemods#built-in-next-font) to safely and automatically rename your imports.

## bundlePagesRouterDependencies

`experimental.bundlePagesExternals` is now stable and renamed to `bundlePagesRouterDependencies`.

## serverExternalPackages

`experimental.serverComponentsExternalPackages` is now stable and renamed to `serverExternalPackages`.

## Speed Insights

Auto instrumentation for Speed Insights was removed in Next.js 15.

To continue using Speed Insights, follow the [Vercel Speed Insights Quickstart](https://vercel.com/docs/speed-insights/quickstart) guide.

## `NextRequest` Geolocation

The `geo` and `ip` properties on `NextRequest` have been removed as these values are provided by your hosting provider. A [codemod](/docs/app/guides/upgrading/codemods#150) is available to automate this migration.

If you are using Vercel, you can alternatively use the `geolocation` and `ipAddress` functions from [`@vercel/functions`](https://vercel.com/docs/functions/vercel-functions-package) instead:

```ts filename="middleware.ts"
import { geolocation } from '@vercel/functions'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { city } = geolocation(request)

  // ...
}
```

```ts filename="middleware.ts"
import { ipAddress } from '@vercel/functions'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const ip = ipAddress(request)

  // ...
}
```
