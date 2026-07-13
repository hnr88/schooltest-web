---
title: dynamicParams
description: API reference for the dynamicParams route segment config option.
url: "https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/dynamicParams"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "File-system conventions: /docs/app/api-reference/file-conventions"
  - "Route Segment Config: /docs/app/api-reference/file-conventions/route-segment-config"
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).
The `dynamicParams` option allows you to control what happens when a dynamic segment is visited that was not generated with [generateStaticParams](/docs/app/api-reference/functions/generate-static-params).

```tsx filename="layout.tsx | page.tsx" switcher
export const dynamicParams = true // true | false
```

```js filename="layout.js | page.js | route.js" switcher
export const dynamicParams = true // true | false
```

* **`true`** (default): Dynamic route segments not included in `generateStaticParams` are generated at request time.
* **`false`**: Dynamic route segments not included in `generateStaticParams` will return a 404.

> **Good to know**:
>
> * This option replaces the `fallback: true | false | blocking` option of `getStaticPaths` in the `pages` directory.
> * `dynamicParams` is not available when [Cache Components](/docs/app/api-reference/config/next-config-js/cacheComponents) is enabled.
---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)
