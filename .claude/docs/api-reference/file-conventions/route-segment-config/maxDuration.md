---
title: maxDuration
description: API reference for the maxDuration route segment config option.
url: "https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/maxDuration"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "File-system conventions: /docs/app/api-reference/file-conventions"
  - "Route Segment Config: /docs/app/api-reference/file-conventions/route-segment-config"
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).
The `maxDuration` option allows you to set the maximum execution time (in seconds) for server-side logic in a route segment. Deployment platforms can use `maxDuration` from the Next.js build output to add specific execution limits.

```tsx filename="layout.tsx | page.tsx | route.ts" switcher
export const maxDuration = 5
```

```js filename="layout.js | page.js | route.js" switcher
export const maxDuration = 5
```

## Server Actions

If using [Server Actions](/docs/app/getting-started/mutating-data), set the `maxDuration` at the page level to change the default timeout of all Server Actions used on the page.

## Version History

| Version    | Changes                   |
| ---------- | ------------------------- |
| `v13.4.10` | `maxDuration` introduced. |
---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)
