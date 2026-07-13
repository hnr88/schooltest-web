---
title: runtime
description: API reference for the runtime route segment config option.
url: "https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/runtime"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "File-system conventions: /docs/app/api-reference/file-conventions"
  - "Route Segment Config: /docs/app/api-reference/file-conventions/route-segment-config"
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).
The `runtime` option allows you to select the JavaScript runtime used for rendering your route.

```tsx filename="layout.tsx | page.tsx | route.ts" switcher
export const runtime = 'nodejs'
// 'nodejs' | 'edge'
```

```js filename="layout.js | page.js | route.js" switcher
export const runtime = 'nodejs'
// 'nodejs' | 'edge'
```

* **`'nodejs'`** (default)
* **`'edge'`**

> **Good to know**:
>
> * Using `runtime: 'edge'` is **not supported** for Cache Components.
> * This option cannot be used in [Proxy](/docs/app/api-reference/file-conventions/proxy).
---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)
