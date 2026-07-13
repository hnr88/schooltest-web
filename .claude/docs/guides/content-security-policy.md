---
title: How to set a Content Security Policy (CSP) for your Next.js application
description: Learn how to set a Content Security Policy (CSP) for your Next.js application.
url: "https://nextjs.org/docs/app/guides/content-security-policy"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Guides: /docs/app/guides"
related:
  - app/api-reference/file-conventions/proxy
  - app/api-reference/functions/headers
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).
[Content Security Policy (CSP)](https://developer.mozilla.org/docs/Web/HTTP/CSP) is important to guard your Next.js application against various security threats such as cross-site scripting (XSS), clickjacking, and other code injection attacks.

By using CSP, developers can specify which origins are permissible for content sources, scripts, stylesheets, images, fonts, objects, media (audio, video), iframes, and more.

<details>
<summary>Examples</summary>

* [Strict CSP](https://github.com/vercel/next.js/tree/canary/examples/with-strict-csp)

</details>

## Nonces

A [nonce](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/nonce) is a unique, random string of characters created for a one-time use. It is used in conjunction with CSP to selectively allow certain inline scripts or styles to execute, bypassing strict CSP directives.

### Why use a nonce?

CSP can block both inline and external scripts to prevent attacks. A nonce lets you safely allow specific scripts to run---only if they include the matching nonce value.

If an attacker wanted to load a script into your page, they'd need to guess the nonce value. That's why the nonce must be unpredictable and unique for every request.

### Adding a nonce with Proxy

[Proxy](/docs/app/api-reference/file-conventions/proxy) enables you to add headers and generate nonces before the page renders.

Every time a page is viewed, a fresh nonce should be generated. This means that you **must use [dynamic rendering](/docs/app/glossary#dynamic-rendering) to add nonces**.

For example:

> **Good to know**: In development, `'unsafe-eval'` is required because React uses `eval` to provide enhanced debugging information, such as reconstructing server-side error stacks in the browser. `unsafe-eval` is not required for production. Neither React nor Next.js use `eval` in production by default.

```ts filename="proxy.ts" switcher
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  return response
}
```

```js filename="proxy.js" switcher
import { NextResponse } from 'next/server'

export function proxy(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  return response
}
```

By default, Proxy runs on all requests. You can filter Proxy to run on specific paths using a [`matcher`](/docs/app/api-reference/file-conventions/proxy#matcher).

We recommend ignoring matching prefetches (from `next/link`) and static assets that don't need the CSP header.

```ts filename="proxy.ts" switcher
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```

```js filename="proxy.js" switcher
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```

### How nonces work in Next.js

To use a nonce, your page must be **dynamically rendered**. This is because Next.js applies nonces during **server-side rendering**, based on the CSP header present in the request. Static pages are generated at build time, when no request or response headers exist---so no nonce can be injected.

Here's how nonce support works in a dynamically rendered page:

1. **Proxy generates a nonce**: Your proxy creates a unique nonce for the request, adds it to your `Content-Security-Policy` header, and also sets it in a custom `x-nonce` header.
2. **Next.js extracts the nonce**: During rendering, Next.js parses the `Content-Security-Policy` header and extracts the nonce using the `'nonce-{value}'` pattern.
3. **Nonce is applied automatically**: Next.js attaches the nonce to:
   * Framework scripts (React, Next.js runtime)
   * Page-specific JavaScript bundles
   * Inline styles and scripts generated by Next.js
   * Any `<Script>` components using the `nonce` prop

Because of this automatic behavior, you don't need to manually add a nonce to each tag.

### Forcing dynamic rendering

If you're using nonces, you may need to explicitly opt pages into dynamic rendering:

```tsx filename="app/page.tsx" switcher
import { connection } from 'next/server'

export default async function Page() {
  // wait for an incoming request to render this page
  await connection()
  // Your page content
}
```

```jsx filename="app/page.jsx" switcher
import { connection } from 'next/server'

export default async function Page() {
  // wait for an incoming request to render this page
  await connection()
  // Your page content
}
```

### Reading the nonce

You can read the nonce from a [Server Component](/docs/app/getting-started/server-and-client-components) using [`headers`](/docs/app/api-reference/functions/headers):

```tsx filename="app/page.tsx" switcher
import { headers } from 'next/headers'
import Script from 'next/script'

export default async function Page() {
  const nonce = (await headers()).get('x-nonce')

  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  )
}
```

```jsx filename="app/page.jsx" switcher
import { headers } from 'next/headers'
import Script from 'next/script'

export default async function Page() {
  const nonce = (await headers()).get('x-nonce')

  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  )
}
```

## Without Nonces

For applications that do not require nonces, you can set the CSP header directly in your [`next.config.js`](/docs/app/api-reference/config/next-config-js) file:

```js filename="next.config.js"
const isDev = process.env.NODE_ENV === 'development'

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ]
  },
}
```

## Subresource Integrity (Experimental)

As an alternative to nonces, Next.js offers experimental support for hash-based CSP using Subresource Integrity (SRI). This approach allows you to maintain static generation while still having a strict CSP.

> **Good to know**: This feature is experimental and available in App Router applications.

### Enabling SRI

Add the experimental SRI configuration to your `next.config.js`:

```js filename="next.config.js"
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    sri: {
      algorithm: 'sha256', // or 'sha384' or 'sha512'
    },
  },
}

module.exports = nextConfig
```

## Version History

| Version    | Changes                                                       |
| ---------- | ------------------------------------------------------------- |
| `v14.0.0`  | Experimental SRI support added for hash-based CSP             |
| `v13.4.20` | Recommended for proper nonce handling and CSP header parsing. |
- [proxy.js](/docs/app/api-reference/file-conventions/proxy)
  - API reference for the proxy.js file.
- [headers](/docs/app/api-reference/functions/headers)
  - API reference for the headers function.

---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)
