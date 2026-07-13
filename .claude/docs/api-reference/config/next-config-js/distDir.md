---
title: distDir
description: Set a custom build directory to use instead of the default .next directory.
url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/distDir"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Configuration: /docs/app/api-reference/config"
  - "next.config.js: /docs/app/api-reference/config/next-config-js"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

You can specify a name to use for a custom build directory to use instead of `.next`.

Open `next.config.js` and add the `distDir` config:

```js filename="next.config.js"
module.exports = {
  distDir: 'build',
}
```

Now if you run `next build` Next.js will use `build` instead of the default `.next` folder.

> `distDir` **should not** leave your project directory. For example, `../build` is an **invalid** directory.
