---
title: allowedDevOrigins
description: "Use `allowedDevOrigins` to configure additional origins that can request the dev server."
url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Configuration: /docs/app/api-reference/config"
  - "next.config.js: /docs/app/api-reference/config/next-config-js"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

Next.js blocks cross-origin requests to dev-only assets and endpoints during development by default to prevent unauthorized access.

To configure a Next.js application to allow requests from origins other than the hostname the server was initialized with (`localhost` by default), use the `allowedDevOrigins` config option.

`allowedDevOrigins` lets you set additional origins that can request the dev server in development mode. For example, to use `local-origin.dev` instead of only `localhost`, open `next.config.js` and add the `allowedDevOrigins` config:

```js filename="next.config.js"
module.exports = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
}
```
