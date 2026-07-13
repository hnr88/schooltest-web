---
title: Streaming
description: Learn how streaming works in Next.js and how to use it to progressively render UI as data becomes available.
url: "https://nextjs.org/docs/app/guides/streaming"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Guides: /docs/app/guides"
related:
  - app/api-reference/file-conventions/loading
  - app/getting-started/fetching-data
  - app/getting-started/linking-and-navigating
  - app/guides/self-hosting
  - app/guides/rendering-philosophy
---

## What is streaming?

In traditional server-side rendering, the server produces the full HTML document before sending anything. A single slow database query or API call can block the entire page. Streaming changes this by using [chunked transfer encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Transfer-Encoding) to send parts of the response as they become ready. The browser starts rendering HTML while the server is still generating the rest.

This is especially impactful for pages that combine fast static content (headers, navigation, layout) with slower dynamic content (personalized data, analytics, recommendations). The static parts can be prerendered and served from a CDN, painting instantly, while the dynamic parts stream in from the server as they become ready.

React's server renderer produces HTML in chunks aligned with `<Suspense>` boundaries. Next.js integrates this into the App Router so streaming works without additional configuration.

## Example

The companion [streaming demo](https://streaming-demo.labs.vercel.dev/) ([source](https://github.com/vercel-labs/streaming-demo)) lets you see each concept from this guide in action:

* Page-level streaming with `loading.tsx` (skeleton appears instantly, content streams in after ~2s)
* Granular streaming with sibling `<Suspense>` boundaries that resolve independently
* Hydration comparison: a single blocking pass vs split hydration with Suspense boundaries
* Raw HTML streaming in a Route Handler, with early CSS discovery
* A configurable `ReadableStream` API endpoint for experimenting with chunk sizes and browser buffering

## How the App Router delivers a page

When a browser requests a page, two streams work together during the initial page load:

### The HTML stream

React's server renderer produces progressive HTML chunks. The static parts of your page (layouts, navigation, Suspense fallbacks) render first and are sent immediately. When an async [Server Component](/docs/app/glossary#server-component) resolves, React streams its completed HTML along with inline `<script>` tags: one that swaps the fallback DOM node with the new content, and another carrying the [component payload](#the-component-payload) so React can later hydrate it. The browser executes the swap instantly, without waiting for the page's JavaScript bundle to load or hydration to complete. This is what the user *sees*: the page painting progressively, section by section.

### The component payload

The component payload is a serialized representation of the component tree that React uses to [hydrate](/docs/app/glossary#hydration) the page and handle client-side updates. On initial load, it arrives embedded in the HTML stream (as described above). On **client-side navigation**, only the component payload is fetched (with an `rsc: 1` request header) and no HTML is transferred at all. React uses it to update the component tree in place.

### The static shell

Everything that renders before any async work resolves is called the **static shell**: your layouts, navigation, and the fallback UI defined by your `<Suspense>` boundaries. It is sent immediately, giving the user something to see and interact with while dynamic content streams in. With [Cache Components](/docs/app/getting-started/caching), the static shell is prerendered at build time and served instantly from the edge.

Each `<Suspense>` boundary is an independent streaming point. Components inside different boundaries resolve and stream in independently. They don't block each other.

## Page-level streaming with `loading.js`

The simplest way to add streaming is with a `loading.js` file. Place it alongside your `page.js` and Next.js automatically wraps the page content in a `<Suspense>` boundary, using your loading component as the fallback.

```tsx filename="app/dashboard/loading.tsx" switcher
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
  )
}
```

```jsx filename="app/dashboard/loading.js" switcher
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
  )
}
```

Behind the scenes, `loading.js` is nested inside `layout.js` and wraps `page.js` in a `<Suspense>` boundary.

This means:

* The layout renders immediately as part of the static shell.
* The loading skeleton is shown instantly as the Suspense fallback.
* When the page component finishes loading, its HTML replaces the skeleton.

`loading.js` is useful when there's nothing meaningful to show until the page's data resolves. If the page needs to await data before it can render anything, a full-page skeleton is a reasonable fallback.

See the [`loading.js` API reference](/docs/app/api-reference/file-conventions/loading) for more details.

## Granular streaming with `<Suspense>`

`<Suspense>` lets you control exactly which parts of the page stream independently. Instead of a full-page skeleton, you can push fallbacks down into specific sections so the static shell includes more real content.

### Parallel streaming with sibling boundaries

When multiple components perform async work (fetching data, reading from a database), wrap each one in its own `<Suspense>` boundary. Each boundary streams independently as its async work completes, in whatever order that happens, without blocking each other:

```tsx filename="app/dashboard/page.tsx" switcher
import { Suspense } from 'react'
import { Revenue } from './revenue'
import { RecentOrders } from './recent-orders'
import { Recommendations } from './recommendations'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<p>Loading revenue...</p>}>
          <Revenue />
        </Suspense>
        <Suspense fallback={<p>Loading orders...</p>}>
          <RecentOrders />
        </Suspense>
      </div>
      <Suspense fallback={<p>Loading recommendations...</p>}>
        <Recommendations />
      </Suspense>
    </div>
  )
}
```

```jsx filename="app/dashboard/page.js" switcher
import { Suspense } from 'react'
import { Revenue } from './revenue'
import { RecentOrders } from './recent-orders'
import { Recommendations } from './recommendations'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<p>Loading revenue...</p>}>
          <Revenue />
        </Suspense>
        <Suspense fallback={<p>Loading orders...</p>}>
          <RecentOrders />
        </Suspense>
      </div>
      <Suspense fallback={<p>Loading recommendations...</p>}>
        <Recommendations />
      </Suspense>
    </div>
  )
}
```

In this example, if `Revenue` resolves in 200ms, `RecentOrders` in 1s, and `Recommendations` in 3s, the user sees each section appear as soon as its data is ready.

### Nested boundaries for progressive detail

You can nest `<Suspense>` boundaries to create a layered loading experience. For example, a product page might stream the header immediately, the product details next, and the reviews last:

```tsx filename="app/product/[id]/page.tsx" switcher
import { Suspense } from 'react'
import { ProductDetails } from './product-details'
import { Reviews } from './reviews'

export async function generateStaticParams() {
  const products = await getTopProducts()
  return products.map((product) => ({ id: product.id }))
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div>
      <h1>Product</h1>
      <Suspense fallback={<p>Loading product details...</p>}>
        <ProductDetails id={id} />
        <Suspense fallback={<p>Loading reviews...</p>}>
          <Reviews productId={id} />
        </Suspense>
      </Suspense>
    </div>
  )
}
```

```jsx filename="app/product/[id]/page.js" switcher
import { Suspense } from 'react'
import { ProductDetails } from './product-details'
import { Reviews } from './reviews'

export async function generateStaticParams() {
  const products = await getTopProducts()
  return products.map((product) => ({ id: product.id }))
}

export default async function ProductPage({ params }) {
  const { id } = await params

  return (
    <div>
      <h1>Product</h1>
      <Suspense fallback={<p>Loading product details...</p>}>
        <ProductDetails id={id} />
        <Suspense fallback={<p>Loading reviews...</p>}>
          <Reviews productId={id} />
        </Suspense>
      </Suspense>
    </div>
  )
}
```

The outer boundary shows "Loading product details..." until `ProductDetails` resolves. Once it does, the inner boundary becomes visible, showing "Loading reviews..." until `Reviews` resolves. This creates a progressive reveal.

### Push dynamic access down

The key to maximizing what streams instantly is to defer dynamic data access to the component that actually needs it. This applies to `params`, `searchParams`, `cookies()`, `headers()`, and data fetches. If you `await` any of these at the top of a layout or page, everything below that point becomes dynamic and cannot be prerendered as part of the static shell.

Instead, pass the promise down and let the consuming component resolve it inside a `<Suspense>` boundary.

### When to use `loading.js` vs `<Suspense>`

|                | `loading.js`                             | `<Suspense>`                     |
| -------------- | ---------------------------------------- | -------------------------------- |
| **Scope**      | Entire page                              | Any component                    |
| **Setup**      | Drop in a file                           | Wrap components explicitly       |
| **Navigation** | Prefetched as instant fallback           | Not prefetched by default        |
| **Best for**   | Pages where nothing renders without data | Most pages, for granular control |

Prefer explicit `<Suspense>` boundaries close to the dynamic access. When the prerenderer encounters dynamic work, it walks up the tree looking for the nearest Suspense boundary. If none is found, the build fails with a blocking route error. A `loading.js` high in the tree is a valid boundary, so the framework finds it and stops, but now the entire page falls back to a full-page skeleton instead of streaming granularly.

### Error handling mid-stream

If a component throws an error after streaming has started, the nearest [`error.js`](/docs/app/api-reference/file-conventions/error) boundary catches it and renders the error UI in place of the failed component. The rest of the page remains intact, only the section that errored is replaced.

Because the HTTP status code (`200 OK`) has already been sent with the first chunk, it cannot be changed to a `4xx` or `5xx`. The error is handled entirely within the streamed HTML. See [The HTTP contract](#the-http-contract) for more on this constraint.

## Streaming data to the client

You can start a fetch in a Server Component and pass the unresolved promise as a prop to a Client Component. The promise can be passed through as many layers as needed. Only the component that calls React's [`use`](https://react.dev/reference/react/use) API to read the value needs a `<Suspense>` boundary around it.

## Streaming in Route Handlers

The patterns above rely on React and Suspense to stream UI. Outside of React rendering, [Route Handlers](/docs/app/api-reference/file-conventions/route) can stream raw responses using the Web Streams API. This is useful for Server-Sent Events, large file generation, or any response where you want data to arrive progressively:

```ts filename="app/api/stream/route.ts" switcher
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`Chunk ${i + 1}\n`))
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
```

```js filename="app/api/stream/route.js" switcher
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`Chunk ${i + 1}\n`))
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
```

See the [Route Handler API reference](/docs/app/api-reference/file-conventions/route) for more details on building streaming endpoints.

## Streaming and Web Vitals

[Web Vitals](https://web.dev/articles/vitals) are the metrics Google uses to measure user experience. Streaming directly affects several of them.

### TTFB and FCP

Without streaming, the server waits for all data before sending any HTML, so TTFB equals the slowest query. With streaming, the server sends the static shell as soon as it's ready. TTFB drops to the time it takes to render your layouts and fallbacks. The browser paints the static shell immediately, so FCP is decoupled from your data fetching time.

### LCP (Largest Contentful Paint)

If your LCP element (a hero image, a main heading, a product photo) is inside a Suspense boundary, it can't paint until that boundary resolves. To keep LCP fast:

* Keep LCP elements **outside** or **above** Suspense boundaries so they render as part of the static shell.
* Use the [`preload`](/docs/app/api-reference/components/image#preload) prop on `next/image` for LCP images.
* For non-image LCP elements (text, headings), make sure they are not wrapped in a Suspense boundary that depends on slow data.

### CLS (Cumulative Layout Shift)

When a Suspense fallback is replaced by the resolved content, the browser reflows the page. If the fallback and the resolved content are different sizes, the surrounding layout shifts. To minimize CLS:

* Design skeleton fallbacks that **match the dimensions** of the content they represent.
* Use fixed or min-height containers around Suspense boundaries so the space is reserved before content arrives.

### INP (Interaction to Next Paint)

Streaming enables selective hydration: React hydrates components independently as they stream in, and prioritizes hydrating whatever the user is interacting with. Each `<Suspense>` boundary is a hydration unit. Without them, React hydrates the entire page in one blocking pass. With them, hydration is broken into smaller tasks that yield to the browser, keeping the main thread responsive.

### Early resource discovery

The static shell includes `<link>` and `<script>` tags in the very first HTML chunk. The browser discovers and starts fetching CSS, JavaScript, and fonts immediately, while the server is still generating content. Resources are fetched during server think time rather than after it.

## The HTTP contract

Once streaming begins, the HTTP response headers (including the status code) have already been sent to the client. **You cannot change the status code or headers after streaming starts.** Everything in this section flows from this fundamental constraint.

### Status codes

When a `<Suspense>` fallback renders or a component suspends, the server must commit to `200 OK` in order to start sending the HTML stream. If a [`notFound()`](/docs/app/api-reference/functions/not-found) fires mid-stream, Next.js cannot go back and change the status to 404. Instead, it injects `<meta name="robots" content="noindex">` into the streamed HTML so that search engines don't index the page. Similarly, a [`redirect()`](/docs/app/api-reference/functions/redirect) mid-stream becomes a client-side redirect rather than an HTTP redirect header.

### When does streaming start?

The response body begins streaming when a Suspense fallback renders (for example, a `loading.tsx`) or when a component suspends under a `<Suspense>` boundary. To get a real HTTP status code for errors, place `notFound()` **before** any `await` or `<Suspense>` boundary.

### Metadata and bots

[`generateMetadata`](/docs/app/api-reference/functions/generate-metadata) resolves before streaming begins for bots that only scrape static HTML (such as Twitterbot or Slackbot). For full browsers and capable crawlers, metadata can [stream](/docs/app/api-reference/functions/generate-metadata#streaming-metadata) alongside the page content.

Next.js automatically detects user agents to choose the right behavior. You can customize which bots receive blocking metadata with the [`htmlLimitedBots`](/docs/app/api-reference/config/next-config-js/htmlLimitedBots) configuration option.

## What can affect streaming

Any layer between your server and the client that buffers the response can diminish the benefits of streaming.

### Reverse proxies

Nginx and similar reverse proxies buffer responses by default. Disable buffering by setting the `X-Accel-Buffering` header to `no`.

### CDNs

Content Delivery Networks may buffer entire responses before forwarding them to the client. Check your CDN provider's documentation for streaming support.

### Serverless platforms

Not all serverless environments support streaming. AWS Lambda, for example, requires response streaming mode to be explicitly enabled. Vercel supports streaming natively.

### Compression

Gzip and Brotli compression can buffer chunks internally before flushing. This can add latency to the first visible chunk.

### Clients

Buffering also happens at the client. Safari/WebKit buffers streaming responses until 1024 bytes have been received.

### Platform support

| Deployment Option                                                   | Supported         |
| ------------------------------------------------------------------- | ----------------- |
| [Node.js server](/docs/app/getting-started/deploying#nodejs-server) | Yes               |
| [Docker container](/docs/app/getting-started/deploying#docker)      | Yes               |
| [Static export](/docs/app/getting-started/deploying#static-export)  | No                |
| [Adapters](/docs/app/getting-started/deploying#adapters)            | Platform-specific |

See the [Self-Hosting guide](/docs/app/guides/self-hosting#streaming-and-suspense) for detailed configuration instructions.

## Summary

The trigger is **your code**: async work, non-deterministic output, or runtime data. When the framework encounters these, it walks up the tree looking for a `<Suspense>` boundary to use as a fallback. Everything above those boundaries forms the static shell, which is sent immediately. As each boundary resolves, React streams the result into the page.

The key decisions are **what to cache** and **where to place Suspense boundaries**. Cache what you can with [`"use cache"`](/docs/app/api-reference/directives/use-cache) to grow the static shell. Push dynamic access down to the components that need it, and wrap those in `<Suspense>`. Everything else becomes part of the shell.

## Further reading

* [RSC Explorer](https://rscexplorer.dev/) - interactive tool to explore the component payload format
* [Streams API on web.dev](https://web.dev/articles/streams) - introduction to the Web Streams API
* [Chunked transfer encoding (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Transfer-Encoding) - the HTTP/1.1 mechanism that enables streaming responses
* [browser.engineering](https://browser.engineering/) - deep dive into how browsers handle network responses, rendering, and progressive display
