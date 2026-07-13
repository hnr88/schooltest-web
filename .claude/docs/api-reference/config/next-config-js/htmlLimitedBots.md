---
title: htmlLimitedBots
description: Specify a list of user agents that should receive blocking metadata.
url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Configuration: /docs/app/api-reference/config"
  - "next.config.js: /docs/app/api-reference/config/next-config-js"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

The `htmlLimitedBots` config allows you to specify a list of user agents that should receive blocking metadata instead of [streaming metadata](/docs/app/api-reference/functions/generate-metadata#streaming-metadata).

```ts filename="next.config.ts" switcher
import type { NextConfig } from 'next'

const config: NextConfig = {
  htmlLimitedBots: /MySpecialBot|MyAnotherSpecialBot|SimpleCrawler/,
}

export default config
```

```js filename="next.config.js" switcher
module.exports = {
  htmlLimitedBots: /MySpecialBot|MyAnotherSpecialBot|SimpleCrawler/,
}
```

## Default list

Next.js includes a default list of HTML limited bots, including:

* Google crawlers (e.g. Mediapartners-Google, AdsBot-Google, Google-PageRenderer)
* Bingbot
* Twitterbot
* Slackbot

See the full list [here](https://github.com/vercel/next.js/blob/canary/packages/next/src/shared/lib/router/utils/html-bots.ts).

Specifying a `htmlLimitedBots` config will override the Next.js' default list. However, this is advanced behavior, and the default should be sufficient for most cases.

```ts filename="next.config.ts" switcher
const config: NextConfig = {
  htmlLimitedBots: /MySpecialBot|MyAnotherSpecialBot|SimpleCrawler/,
}

export default config
```

```js filename="next.config.js" switcher
module.exports = {
  htmlLimitedBots: /MySpecialBot|MyAnotherSpecialBot|SimpleCrawler/,
}
```

## Disabling

To fully disable streaming metadata:

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

const config: NextConfig = {
  htmlLimitedBots: /.*/,
}

export default config
```

```js filename="next.config.js" switcher
module.exports = {
  htmlLimitedBots: /.*/,
}
```

## Version History

| Version | Changes                              |
| ------- | ------------------------------------ |
| 15.2.0  | `htmlLimitedBots` option introduced. |
