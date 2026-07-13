---
title: public Folder
description: Next.js allows you to serve static files, like images, in the public directory. You can learn how it works here.
url: "https://nextjs.org/docs/app/api-reference/file-conventions/public-folder"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "API Reference: /docs/app/api-reference"
  - "File-system conventions: /docs/app/api-reference/file-conventions"
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).
Next.js can serve static files, like images, under a folder called `public` in the root directory. Files inside `public` can then be referenced by your code starting from the base URL (`/`).

For example, the file `public/avatars/me.png` can be viewed by visiting the `/avatars/me.png` path. The code to display that image might look like:

```jsx filename="avatar.js"
import Image from 'next/image'

export function Avatar({ id, alt }) {
  return <Image src={`/avatars/${id}.png`} alt={alt} width="64" height="64" />
}

export function AvatarOfMe() {
  return <Avatar id="me" alt="A portrait of me" />
}
```

## Caching

Next.js cannot safely cache assets in the `public` folder because they may change. The default caching headers applied are:

```jsx
Cache-Control: public, max-age=0
```

## Robots, Favicons, and others

For static metadata files, such as `robots.txt`, `favicon.ico`, etc, you should use [special metadata files](/docs/app/api-reference/file-conventions/metadata) inside the `app` folder.
---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)
