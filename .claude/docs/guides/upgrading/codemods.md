---
title: Codemods
description: Use codemods to upgrade your Next.js codebase when new features are released.
url: "https://nextjs.org/docs/app/guides/upgrading/codemods"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Guides: /docs/app/guides"
  - "Upgrading: /docs/app/guides/upgrading"
---

Codemods are transformations that run on your codebase programmatically. This allows a large number of changes to be programmatically applied without having to manually go through every file.

Next.js provides Codemod transformations to help upgrade your Next.js codebase when an API is updated or deprecated.

## Usage

In your terminal, navigate (`cd`) into your project's folder, then run:

```bash filename="Terminal"
npx @next/codemod <transform> <path>
```

Replacing `<transform>` and `<path>` with appropriate values.

* `transform` - name of transform
* `path` - files or directory to transform
* `--dry` Do a dry-run, no code will be edited
* `--print` Prints the changed output for comparison

## Upgrade

Upgrades your Next.js application, automatically running codemods and updating Next.js, React, and React DOM.

```bash filename="Terminal"
npx @next/codemod upgrade [revision]
```

### Options

* `revision` (optional): Specify the upgrade type (`patch`, `minor`, `major`), an NPM dist tag (e.g. `latest`, `canary`, `rc`), or an exact version (e.g. `15.0.0`). Defaults to `minor` for stable versions.
* `--verbose`: Show more detailed output during the upgrade process.

For example:

```bash filename="Terminal"
# Upgrade to the latest patch (e.g. 16.0.7 -> 16.0.8)
npx @next/codemod upgrade patch

# Upgrade to the latest minor (e.g. 15.3.7 -> 15.4.8). This is the default.
npx @next/codemod upgrade minor

# Upgrade to the latest major (e.g. 15.5.7 -> 16.0.7)
npx @next/codemod upgrade major

# Upgrade to a specific version
npx @next/codemod upgrade 16

# Upgrade to the canary release
npx @next/codemod upgrade canary
```

> **Good to know**:
>
> * If the target version is the same as or lower than your current version, the command exits without making changes.
> * During the upgrade, you may be prompted to choose which Next.js codemods to apply and run React 19 codemods if upgrading React.

## Codemods

### 16.0

#### Remove `experimental_ppr` Route Segment Config from App Router pages and layouts

##### `remove-experimental-ppr`

```bash filename="Terminal"
npx @next/codemod@latest remove-experimental-ppr .
```

This codemod removes the `experimental_ppr` Route Segment Config from App Router pages and layouts.

```diff filename="app/page.tsx"
- export const experimental_ppr = true;
```

#### Remove `unstable_` prefix from stabilized API

##### `remove-unstable-prefix`

```bash filename="Terminal"
npx @next/codemod@latest remove-unstable-prefix .
```

This codemod removes the `unstable_` prefix from stabilized API.

For example:

```ts
import { unstable_cacheTag as cacheTag } from 'next/cache'

cacheTag()
```

Transforms into:

```ts
import { cacheTag } from 'next/cache'

cacheTag()
```

#### Migrate from deprecated `middleware` convention to `proxy`

##### `middleware-to-proxy`

```bash filename="Terminal"
npx @next/codemod@latest middleware-to-proxy .
```

This codemod migrates projects from using the deprecated `middleware` convention to using the `proxy` convention. It:

* Renames `middleware.<extension>` to `proxy.<extension>` (e.g. `middleware.ts` to `proxy.ts`)
* Renames named export `middleware` to `proxy`
* Renames Next.js config property `experimental.middlewarePrefetch` to `experimental.proxyPrefetch`
* Renames Next.js config property `experimental.middlewareClientMaxBodySize` to `experimental.proxyClientMaxBodySize`
* Renames Next.js config property `experimental.externalMiddlewareRewritesResolve` to `experimental.externalProxyRewritesResolve`
* Renames Next.js config property `skipMiddlewareUrlNormalize` to `skipProxyUrlNormalize`

For example:

```ts filename="middleware.ts"
import { NextResponse } from 'next/server'

export function middleware() {
  return NextResponse.next()
}
```

Transforms into:

```ts filename="proxy.ts"
import { NextResponse } from 'next/server'

export function proxy() {
  return NextResponse.next()
}
```

#### Migrate from `next lint` to ESLint CLI

##### `next-lint-to-eslint-cli`

```bash filename="Terminal"
npx @next/codemod@canary next-lint-to-eslint-cli .
```

This codemod migrates projects from using `next lint` to using the ESLint CLI with your local ESLint config. It:

* Creates an `eslint.config.mjs` file with Next.js recommended configurations
* Updates `package.json` scripts to use `eslint .` instead of `next lint`
* Adds necessary ESLint dependencies to `package.json`
* Preserves existing ESLint configurations when found

### 15.0

#### Transform App Router Route Segment Config `runtime` value from `experimental-edge` to `edge`

##### `app-dir-runtime-config-experimental-edge`

```bash filename="Terminal"
npx @next/codemod@latest app-dir-runtime-config-experimental-edge .
```

This codemod transforms Route Segment Config `runtime` value `experimental-edge` to `edge`.

#### Migrate to async Dynamic APIs

##### `next-async-request-api`

```bash filename="Terminal"
npx @next/codemod@latest next-async-request-api .
```

This codemod will transform dynamic APIs (`cookies()`, `headers()` and `draftMode()` from `next/headers`) that are now asynchronous to be properly awaited or wrapped with `React.use()` if applicable.

#### Replace `geo` and `ip` properties of `NextRequest` with `@vercel/functions`

##### `next-request-geo-ip`

```bash filename="Terminal"
npx @next/codemod@latest next-request-geo-ip .
```

This codemod installs `@vercel/functions` and transforms `geo` and `ip` properties of `NextRequest` with corresponding `@vercel/functions` features.

### 14.0

#### Migrate `ImageResponse` imports

##### `next-og-import`

```bash filename="Terminal"
npx @next/codemod@latest next-og-import .
```

This codemod moves transforms imports from `next/server` to `next/og` for usage of Dynamic OG Image Generation.

#### Use `viewport` export

##### `metadata-to-viewport-export`

```bash filename="Terminal"
npx @next/codemod@latest metadata-to-viewport-export .
```

This codemod migrates certain viewport metadata to `viewport` export.

### 13.2

#### Use Built-in Font

##### `built-in-next-font`

```bash filename="Terminal"
npx @next/codemod@latest built-in-next-font .
```

This codemod uninstalls the `@next/font` package and transforms `@next/font` imports into the built-in `next/font`.

### 13.0

#### Rename Next Image Imports

##### `next-image-to-legacy-image`

```bash filename="Terminal"
npx @next/codemod@latest next-image-to-legacy-image .
```

Safely renames `next/image` imports in existing Next.js 10, 11, or 12 applications to `next/legacy/image` in Next.js 13. Also renames `next/future/image` to `next/image`.

#### Migrate to the New Image Component

##### `next-image-experimental`

```bash filename="Terminal"
npx @next/codemod@latest next-image-experimental .
```

Dangerously migrates from `next/legacy/image` to the new `next/image` by adding inline styles and removing unused props.

#### Remove `<a>` Tags From Link Components

##### `new-link`

```bash filename="Terminal"
npx @next/codemod@latest new-link .
```

Remove `<a>` tags inside Link Components.

### 11

#### Migrate from CRA

##### `cra-to-next`

```bash filename="Terminal"
npx @next/codemod cra-to-next
```

Migrates a Create React App project to Next.js.

### 10

#### Add React imports

##### `add-missing-react-import`

```bash filename="Terminal"
npx @next/codemod add-missing-react-import
```

Transforms files that do not import `React` to include the import in order for the new React JSX transform to work.

### 9

#### Transform Anonymous Components into Named Components

##### `name-default-component`

```bash filename="Terminal"
npx @next/codemod name-default-component
```

Transforms anonymous components into named components to make sure they work with Fast Refresh.

### 8

#### Transform AMP HOC into page config

##### `withamp-to-config`

```bash filename="Terminal"
npx @next/codemod withamp-to-config
```

Transforms the `withAmp` HOC into Next.js 9 page configuration.

> **Note**: Built-in AMP support and this codemod have been removed in Next.js 16.

### 6

#### Use `withRouter`

##### `url-to-withrouter`

```bash filename="Terminal"
npx @next/codemod url-to-withrouter
```

Transforms the deprecated automatically injected `url` property on top level pages to using `withRouter` and the `router` property it injects.
