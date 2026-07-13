---
title: generateEtags
description: Next.js will generate etags for every page by default. Learn more about how to disable etag generation here.
url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/generateEtags"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Configuration: /docs/app/api-reference/config"
  - "next.config.js: /docs/app/api-reference/config/next-config-js"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

Next.js will generate [etags](https://en.wikipedia.org/wiki/HTTP_ETag) for every page by default. You may want to disable etag generation for HTML pages depending on your cache strategy.

Open `next.config.js` and disable the `generateEtags` option:

```js filename="next.config.js"
module.exports = {
  generateEtags: false,
}
```
