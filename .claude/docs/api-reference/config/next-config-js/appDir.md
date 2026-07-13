---
title: appDir
description: Enable the App Router to use layouts, streaming, and more.
url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/appDir"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Configuration: /docs/app/api-reference/config"
  - "next.config.js: /docs/app/api-reference/config/next-config-js"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

> This is a legacy API and no longer recommended. It's still supported for backward compatibility.

> **Good to know**: This option is **no longer** needed as of Next.js 13.4. The App Router is now stable.

The App Router ([`app` directory](/docs/app)) enables support for [layouts](/docs/app/api-reference/file-conventions/layout), [Server Components](/docs/app/getting-started/server-and-client-components), [streaming](/docs/app/api-reference/file-conventions/loading), and [colocated data fetching](/docs/app/getting-started/fetching-data).

Using the `app` directory will automatically enable [React Strict Mode](https://react.dev/reference/react/StrictMode). Learn how to [incrementally adopt `app`](/docs/app/guides/migrating/app-router-migration#migrating-from-pages-to-app).
