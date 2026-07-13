---
title: unauthorized.js
description: API reference for the unauthorized.js special file.
url: "https://nextjs.org/docs/app/api-reference/file-conventions/unauthorized"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "API Reference: /docs/app/api-reference"
  - "File-system conventions: /docs/app/api-reference/file-conventions"
related:
  - app/api-reference/functions/unauthorized
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

> This feature is currently experimental and subject to change, it's not recommended for production. Try it out and share your feedback on [GitHub](https://github.com/vercel/next.js/issues).

The **unauthorized** file is used to render UI when the [`unauthorized`](/docs/app/api-reference/functions/unauthorized) function is invoked during authentication. Along with allowing you to customize the UI, Next.js will return a `401` status code.

```tsx filename="app/unauthorized.tsx" switcher
import Login from '@/app/components/Login'

export default function Unauthorized() {
  return (
    <main>
      <h1>401 - Unauthorized</h1>
      <p>Please log in to access this page.</p>
      <Login />
    </main>
  )
}
```

```jsx filename="app/unauthorized.js" switcher
import Login from '@/app/components/Login'

export default function Unauthorized() {
  return (
    <main>
      <h1>401 - Unauthorized</h1>
      <p>Please log in to access this page.</p>
      <Login />
    </main>
  )
}
```

## Reference

### Props

`unauthorized.js` components do not accept any props.

## Examples

### Displaying login UI to unauthenticated users

You can use [`unauthorized`](/docs/app/api-reference/functions/unauthorized) function to render the `unauthorized.js` file with a login UI.

```tsx filename="app/dashboard/page.tsx" switcher
import { verifySession } from '@/app/lib/dal'
import { unauthorized } from 'next/navigation'

export default async function DashboardPage() {
  const session = await verifySession()

  if (!session) {
    unauthorized()
  }

  return <div>Dashboard</div>
}
```

```jsx filename="app/dashboard/page.js" switcher
import { verifySession } from '@/app/lib/dal'
import { unauthorized } from 'next/navigation'

export default async function DashboardPage() {
  const session = await verifySession()

  if (!session) {
    unauthorized()
  }

  return <div>Dashboard</div>
}
```

```tsx filename="app/unauthorized.tsx" switcher
import Login from '@/app/components/Login'

export default function UnauthorizedPage() {
  return (
    <main>
      <h1>401 - Unauthorized</h1>
      <p>Please log in to access this page.</p>
      <Login />
    </main>
  )
}
```

```jsx filename="app/unauthorized.js" switcher
import Login from '@/app/components/Login'

export default function UnauthorizedPage() {
  return (
    <main>
      <h1>401 - Unauthorized</h1>
      <p>Please log in to access this page.</p>
      <Login />
    </main>
  )
}
```

## Version History

| Version   | Changes                       |
| --------- | ----------------------------- |
| `v15.1.0` | `unauthorized.js` introduced. |
- [unauthorized](/docs/app/api-reference/functions/unauthorized)
  - API Reference for the unauthorized function.

---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)
