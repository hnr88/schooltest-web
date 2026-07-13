---
title: Route Groups
description: Route Groups can be used to partition your Next.js application into different sections.
url: "https://nextjs.org/docs/app/api-reference/file-conventions/route-groups"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "API Reference: /docs/app/api-reference"
  - "File-system conventions: /docs/app/api-reference/file-conventions"
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).
Route Groups are a folder convention that let you organize routes by category or team.

## Convention

A route group can be created by wrapping a folder's name in parenthesis: `(folderName)`.

This convention indicates the folder is for organizational purposes and should **not be included** in the route's URL path.

![An example folder structure using route groups](https://h8DxKfmAPhn8O0p3.public.blob.vercel-storage.com/docs/light/project-organization-route-groups.png)

## Use cases

* Organizing routes by team, concern, or feature.
* Defining multiple [root layouts](/docs/app/api-reference/file-conventions/layout#root-layout).
* Opting specific route segments into sharing a layout, while keeping others out.

## Caveats

* **Full page load**: If you navigate between routes that use different root layouts, it'll trigger a full page reload. For example, navigating from `/cart` that uses `app/(shop)/layout.js` to `/blog` that uses `app/(marketing)/layout.js`. This **only** applies to multiple root layouts.
* **Conflicting paths**: Routes in different groups should not resolve to the same URL path. For example, `(marketing)/about/page.js` and `(shop)/about/page.js` would both resolve to `/about` and cause an error.
* **Top-level root layout**: If you use multiple root layouts without a top-level `layout.js` file, make sure your home route (/) is defined within one of the route groups, e.g. app/(marketing)/page.js.
---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)
