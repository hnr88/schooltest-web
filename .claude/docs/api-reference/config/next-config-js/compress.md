---
title: compress
description: Next.js provides gzip compression to compress rendered content and static files, it only works with the server target. Learn more about it here.
url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/compress"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Configuration: /docs/app/api-reference/config"
  - "next.config.js: /docs/app/api-reference/config/next-config-js"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

By default, Next.js uses `gzip` to compress rendered content and static files when using `next start` or a custom server. This is an optimization for applications that do not have compression configured. If compression is *already* configured in your application via a custom server, Next.js will not add compression.

You can check if compression is enabled and which algorithm is used by looking at the [`Accept-Encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding) (browser accepted options) and [`Content-Encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding) (currently used) headers in the response.

## Disabling compression

To disable **compression**, set the `compress` config option to `false`:

```js filename="next.config.js"
module.exports = {
  compress: false,
}
```

We **do not recommend disabling compression** unless you have compression configured on your server, as compression reduces bandwidth usage and improves the performance of your application. For example, you're using [nginx](https://nginx.org/) and want to switch to `brotli`, set the `compress` option to `false` to allow nginx to handle compression.
