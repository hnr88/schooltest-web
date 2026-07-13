---
title: Designing view transitions
description: Learn how to use view transitions to communicate meaning during navigation, loading, and content changes in a Next.js app.
url: "https://nextjs.org/docs/app/guides/view-transitions"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Guides: /docs/app/guides"
---

In web apps, route changes replace the entire page at once. One set of elements disappears, another appears, with no visual connection between them. A user selects a photo thumbnail to view it in detail on another page. They are the same image, but nothing on screen communicates that.

Apps that need these transitions typically rely on complex animation libraries that manage mount/unmount lifecycles, track element positions across routes, and coordinate timing manually, to animate how elements enter, exit, and move between states.

React's `<ViewTransition>` component integrates with the browser's [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) to handle this declaratively. You name the elements that should persist, and the browser animates between their old and new positions.

This guide walks through four patterns that cover the most common cases: morphing shared elements, animating loading states, adding directional navigation, and crossfading content within the same route.

## Example

As an example, we'll build a photography gallery called *Frames*.

We'll start by morphing a thumbnail into a hero image (shared elements), then animate the loading skeleton into real content (Suspense reveals), add directional slides for forward and back navigation (route transitions), and finish with crossfades for switching between photographer tabs (same-route transitions).

You can find the resources used in this example here:

* [Demo](https://react-view-transitions-demo.labs.vercel.dev)
* [Code](https://github.com/vercel-labs/react-view-transitions-demo)

Before starting, enable view transitions in your Next.js config:

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
}

export default nextConfig
```

> **Note:** The View Transitions API is supported in all major browsers, though some animations may behave differently in Safari. Without browser support, your application works normally, the transitions simply do not animate.

Then import the `ViewTransition` component from React:

```tsx
import { ViewTransition } from 'react'
```

`<ViewTransition>` animations are activated by [Transitions](https://react.dev/reference/react/useTransition), [`<Suspense>`](https://react.dev/reference/react/Suspense), and [`useDeferredValue`](https://react.dev/reference/react/useDeferredValue). Regular `setState` calls do not trigger them. In Next.js, route navigations are transitions, so `<ViewTransition>` animations activate automatically during navigation.

### Step 1: Morph a thumbnail into a hero image

The gallery displays photos in a grid. Clicking a photo opens a detail page with a larger version of the same image. Without transitions, the thumbnail disappears and the hero appears. Nothing connects them visually. The user has to scan the detail page to confirm they clicked the right photo.

In motion design, when an object persists across a cut, it communicates continuity. The viewer understands they are looking at the same thing, not a replacement. This is the most important transition pattern: **shared element morphing**.

Wrap both the grid thumbnail and the detail hero in `<ViewTransition>` with the same `name`:

```tsx filename="components/photo-grid.tsx"
import { ViewTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'

function PhotoGrid({ photos }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {photos.map((photo) => (
        <Link key={photo.id} href={`/photo/${photo.id}`}>
          <ViewTransition name={`photo-${photo.id}`}>
            <Image src={photo.src} alt={photo.title} />
          </ViewTransition>
        </Link>
      ))}
    </div>
  )
}
```

```tsx filename="app/photo/[id]/photo-content.tsx"
import { ViewTransition } from 'react'
import Image from 'next/image'

async function PhotoContent({ id }) {
  const photo = await getPhoto(id)

  return (
    <ViewTransition name={`photo-${photo.id}`}>
      <Image src={photo.src} alt={photo.title} fill />
    </ViewTransition>
  )
}
```

The `name` prop creates identity. React finds elements with the same name on the old and new pages, then animates between their size and position automatically. No additional props are needed for the morph to work.

#### Customizing the morph animation

To control the morph CSS, add `share="morph"`. This assigns the `morph` class to the view transition, which you can target with CSS pseudo-elements:

```tsx
<ViewTransition name={`photo-${photo.id}`} share="morph">
  <Image src={photo.src} alt={photo.title} />
</ViewTransition>
```

```css filename="app/globals.css"
::view-transition-group(.morph) {
  animation-duration: 400ms;
}
::view-transition-image-pair(.morph) {
  animation-name: via-blur;
}
@keyframes via-blur {
  30% {
    filter: blur(3px);
  }
}
```

### Step 2: Animate loading states with Suspense reveals

The photo detail page loads its content asynchronously. While data is in flight, a Suspense boundary shows a skeleton. When the data resolves, the skeleton is replaced by the real content.

Wrap the Suspense fallback in a `ViewTransition` with an exit animation, and the content in a `ViewTransition` with an enter animation:

```tsx filename="app/photo/[id]/page.tsx"
import { Suspense, ViewTransition } from 'react'

export default async function PhotoPage({ params }) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <ViewTransition exit="slide-down">
          <PhotoContentSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="slide-up" default="none">
        <PhotoContent id={id} />
      </ViewTransition>
    </Suspense>
  )
}
```

The CSS animations use asymmetric timing:

```css filename="app/globals.css"
:root {
  --duration-exit: 150ms;
  --duration-enter: 210ms;
}

::view-transition-old(.slide-down) {
  animation:
    var(--duration-exit) ease-out both fade reverse,
    var(--duration-exit) ease-out both slide-y reverse;
}
::view-transition-new(.slide-up) {
  animation:
    var(--duration-enter) ease-in var(--duration-exit) both fade,
    400ms ease-in both slide-y;
}

@keyframes fade {
  from {
    filter: blur(3px);
    opacity: 0;
  }
  to {
    filter: blur(0);
    opacity: 1;
  }
}
@keyframes slide-y {
  from {
    transform: translateY(10px);
  }
  to {
    transform: translateY(0);
  }
}
```

### Step 3: Add directional motion for navigation

Use the `transitionTypes` prop on `<Link>` to tag forward navigations:

```tsx filename="components/photo-grid.tsx"
<Link href={`/photo/${photo.id}`} transitionTypes={['nav-forward']}>
  {/* photo thumbnail */}
</Link>
```

For links that return the user to a previous page, use `nav-back`:

```tsx filename="app/photo/[id]/page.tsx"
<Link href="/" transitionTypes={['nav-back']}>
  ← Gallery
</Link>
```

Then wrap page content in a `ViewTransition` that maps transition types to directional animations:

```tsx filename="app/photo/[id]/page.tsx"
<ViewTransition
  enter={{
    'nav-forward': 'nav-forward',
    'nav-back': 'nav-back',
    default: 'none',
  }}
  exit={{
    'nav-forward': 'nav-forward',
    'nav-back': 'nav-back',
    default: 'none',
  }}
  default="none"
>
  {/* page content */}
</ViewTransition>
```

The CSS for directional slides:

```css filename="app/globals.css"
::view-transition-old(.nav-forward) {
  --slide-offset: -60px;
  animation:
    150ms ease-in both fade reverse,
    400ms ease-in-out both slide reverse;
}
::view-transition-new(.nav-forward) {
  --slide-offset: 60px;
  animation:
    210ms ease-out 150ms both fade,
    400ms ease-in-out both slide;
}

::view-transition-old(.nav-back) {
  --slide-offset: 60px;
  animation:
    150ms ease-in both fade reverse,
    400ms ease-in-out both slide reverse;
}
::view-transition-new(.nav-back) {
  --slide-offset: -60px;
  animation:
    210ms ease-out 150ms both fade,
    400ms ease-in-out both slide;
}

@keyframes slide {
  from {
    translate: var(--slide-offset);
  }
  to {
    translate: 0;
  }
}
```

#### Anchoring the header

During directional slides, the header should not move. Assign the header a `viewTransitionName` and suppress its animation in CSS:

```tsx filename="components/header.tsx"
<header style={{ viewTransitionName: 'site-header' }}>
  {/* navigation links */}
</header>
```

```css filename="app/globals.css"
::view-transition-group(site-header) {
  animation: none;
  z-index: 100;
}
::view-transition-old(site-header) {
  display: none;
}
::view-transition-new(site-header) {
  animation: none;
}
```

#### Respecting reduced motion

```css filename="app/globals.css"
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

### Step 4: Crossfade content within the same route

Use a `ViewTransition` with `key` set to the current slug. When the key changes, React triggers a transition between the old and new content:

```tsx filename="app/collection/[slug]/page.tsx"
import { Suspense, ViewTransition } from 'react'

export default async function CollectionPage({ params }) {
  const { slug } = await params

  return (
    <Suspense fallback={<CollectionGridSkeleton />}>
      <ViewTransition
        key={slug}
        name="collection-content"
        share="auto"
        enter="auto"
        default="none"
      >
        <CollectionGrid slug={slug} />
      </ViewTransition>
    </Suspense>
  )
}
```

The `share="auto"` and `enter="auto"` props tell React to use its default crossfade animation. The `name` prop gives the container an identity so React knows what to animate. The `key={slug}` change is what triggers the transition.

## Next steps

You now know how to use view transitions to communicate meaning during navigation. Shared elements communicate continuity across routes. Suspense reveals animate loading handoffs. Directional slides encode navigation history. Crossfades signal content changes within the same location.

Each pattern answers a different question for the user:

| Pattern                | What it communicates            |
| ---------------------- | ------------------------------- |
| Shared element (morph) | "Same thing, going deeper"      |
| Suspense reveal        | "Data loaded"                   |
| Directional slide      | "Going forward / coming back"   |
| Same-route crossfade   | "Same place, different content" |

For API details and more patterns:

* [View transition configuration](/docs/app/api-reference/config/next-config-js/viewTransition)
* [Link `transitionTypes` prop](/docs/app/api-reference/components/link#transitiontypes)
* [`useRouter`](/docs/app/api-reference/functions/use-router) -- also supports `transitionTypes` in `push()` and `replace()`
* [React `ViewTransition` component](https://react.dev/reference/react/ViewTransition)
* [Complete CSS from this guide](https://github.com/vercel-labs/react-view-transitions-demo/blob/main/src/app/globals.css) -- all keyframes and view transition rules in one file
