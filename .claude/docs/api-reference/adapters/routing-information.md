---
title: Routing Information
description: "Reference for routing phases and route fields exposed in `onBuildComplete`."
url: "https://nextjs.org/docs/app/api-reference/adapters/routing-information"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "API Reference: /docs/app/api-reference"
  - "Adapters: /docs/app/api-reference/adapters"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

The `routing` object in `onBuildComplete` provides complete routing information with processed patterns ready for deployment:

## `routing.beforeMiddleware`

Routes applied before middleware execution. These include generated header and redirect behavior.

## `routing.beforeFiles`

Rewrite routes checked before filesystem route matching.

## `routing.afterFiles`

Rewrite routes checked after filesystem route matching.

## `routing.dynamicRoutes`

Dynamic matchers generated from route segments such as `[slug]` and catch-all routes.

## `routing.onMatch`

Routes that apply after a successful match, such as immutable cache headers for hashed static assets.

## `routing.fallback`

Final rewrite routes checked when earlier phases did not produce a match.

## Common Route Fields

Each route entry can include:

* `source`: Original route pattern (optional for generated internal rules)
* `sourceRegex`: Compiled regex for matching requests
* `destination`: Internal destination or redirect destination
* `headers`: Headers to apply
* `has`: Positive matching conditions
* `missing`: Negative matching conditions
* `status`: Redirect status code
* `priority`: Internal route priority flag
