---
title: Configuration
description: "Configure `adapterPath` or `NEXT_ADAPTER_PATH` to use a custom deployment adapter."
url: "https://nextjs.org/docs/app/api-reference/adapters/configuration"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "API Reference: /docs/app/api-reference"
  - "Adapters: /docs/app/api-reference/adapters"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

To use an adapter, specify the path to your adapter module in `adapterPath`:

```js filename="next.config.js"
/** @type {import('next').NextConfig} */
const nextConfig = {
  adapterPath: require.resolve('./my-adapter.js'),
}

module.exports = nextConfig
```

Alternatively `NEXT_ADAPTER_PATH` can be set to enable zero-config usage in deployment platforms.
