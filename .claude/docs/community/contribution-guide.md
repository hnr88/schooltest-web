---
title: Docs Contribution Guide
description: Learn how to contribute to Next.js Documentation
url: "https://nextjs.org/docs/community/contribution-guide"
docs_index: /docs/llms.txt
version: 16.2.4
lastUpdated: 2026-04-10
prerequisites:
  - "Community: /docs/community"
---

> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

Welcome to the Next.js Docs Contribution Guide! We're excited to have you here.

This page provides instructions on how to edit the Next.js documentation. Our goal is to ensure that everyone in the community feels empowered to contribute and improve our docs.

## Why Contribute?

Open-source work is never done, and neither is documentation. Contributing to docs is a good way for beginners to get involved in open-source and for experienced developers to clarify more complex topics while sharing their knowledge with the community.

By contributing to the Next.js docs, you're helping us build a more robust learning resource for all developers. Whether you've found a typo, a confusing section, or you've realized that a particular topic is missing, your contributions are welcomed and appreciated.

## How to Contribute

The docs content can be found on the [Next.js repo](https://github.com/vercel/next.js/tree/canary/docs). To contribute, you can edit the files directly on GitHub or clone the repo and edit the files locally.

### GitHub Workflow

If you're new to GitHub, we recommend reading the [GitHub Open Source Guide](https://opensource.guide/how-to-contribute/#opening-a-pull-request) to learn how to fork a repository, create a branch, and submit a pull request.

> **Good to know**: The underlying docs code lives in a private codebase that is synced to the Next.js public repo. This means that you can't preview the docs locally. However, you'll see your changes on [nextjs.org](https://nextjs.org/docs) after merging a pull request.

### Writing MDX

The docs are written in [MDX](https://mdxjs.com/), a markdown format that supports JSX syntax. This allows us to embed React components in the docs. See the [GitHub Markdown Guide](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) for a quick overview of markdown syntax.

### VSCode

#### Previewing Changes Locally

VSCode has a built-in markdown previewer that you can use to see your edits locally. To enable the previewer for MDX files, you'll need to add a configuration option to your user settings.

Open the command palette (`Cmd + Shift + P` on Mac or `Ctrl + Shift + P` on Windows) and search from `Preferences: Open User Settings (JSON)`.

Then, add the following line to your `settings.json` file:

```json filename="settings.json"
{
  "files.associations": {
    "*.mdx": "markdown"
  }
}
```

Next, open the command palette again, and search for `Markdown: Preview File` or `Markdown: Open Preview to the Side`. This will open a preview window where you can see your formatted changes.

#### Extensions

We also recommend the following extensions for VSCode users:

* [MDX](https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx): Intellisense and syntax highlighting for MDX.
* [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode): Format MDX files on save.

### Review Process

Once you've submitted your contribution, the Next.js or Developer Experience teams will review your changes, provide feedback, and merge the pull request when it's ready.

Please let us know if you have any questions or need further assistance in your PR's comments. Thank you for contributing to the Next.js docs and being a part of our community!

> **Tip:** Run `pnpm prettier-fix` to run Prettier before submitting your PR.

## File Structure

The docs use **file-system routing**. Each folder and files inside [`/docs`](https://github.com/vercel/next.js/tree/canary/docs) represent a route segment. These segments are used to generate the URL paths, navigation, and breadcrumbs.

The file structure reflects the navigation that you see on the site, and by default, navigation items are sorted alphabetically. However, we can change the order of the items by prepending a two-digit number (`00-`) to the folder or file name.

For example, in the [functions API Reference](/docs/app/api-reference/functions), the pages are sorted alphabetically because it makes it easier for developers to find a specific function:

```txt
04-functions
├── after.mdx
├── cacheLife.mdx
├── cacheTag.mdx
└── ...
```

But, in the [app router section](/docs/app), the files are prefixed with a two-digit number, sorted in the order developers should learn these concepts:

```txt
01-getting-started
├── 01-installation.mdx
├── 02-project-structure.mdx
├── 03-layouts-and-pages.mdx
└── ...
```

To quickly find a page, you can use `Cmd + P` (Mac) or `Ctrl + P` (Windows) to open the search bar on VSCode. Then, type the slug of the page you're looking for. E.g. `installation`

> **Why not use a manifest?**
>
> We considered using a manifest file (another popular way to generate the docs navigation), but we found that a manifest would quickly get out of sync with the files. File-system routing forces us to think about the structure of the docs and feels more native to Next.js.

## Metadata

Each page has a metadata block at the top of the file separated by three dashes.

### Required Fields

The following fields are **required**:

| Field         | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `title`       | The page's `<h1>` title, used for SEO and OG Images.                         |
| `description` | The page's description, used in the `<meta name="description">` tag for SEO. |

```yaml filename="required-fields.mdx"
---
title: Page Title
description: Page Description
---
```

It's good practice to limit the page title to 2-3 words (e.g. Optimizing Images) and the description to 1-2 sentences (e.g. Learn how to optimize images in Next.js).

### Optional Fields

The following fields are **optional**:

| Field       | Description                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nav_title` | Overrides the page's title in the navigation. This is useful when the page's title is too long to fit. If not provided, the `title` field is used. |
| `source`    | Pulls content into a shared page. See [Shared Pages](#shared-pages).                                                                               |
| `related`   | A list of related pages at the bottom of the document. These will automatically be turned into cards. See [Related Links](#related-links).         |
| `version`   | A stage of development. e.g. `experimental`,`legacy`,`unstable`,`RC`                                                                               |

```yaml filename="optional-fields.mdx"
---
nav_title: Nav Item Title
source: app/building-your-application/optimizing/images
related:
  description: See the image component API reference.
  links:
    - app/api-reference/components/image
version: experimental
---
```

## `App` and `Pages` Docs

Since most of the features in the **App Router** and **Pages Router** are completely different, their docs for each are kept in separate sections (`02-app` and `03-pages`). However, there are a few features that are shared between them.

### Shared Pages

To avoid content duplication and risk the content becoming out of sync, we use the `source` field to pull content from one page into another. For example, the `<Link>` component behaves *mostly* the same in **App** and **Pages**. Instead of duplicating the content, we can pull the content from `app/.../link.mdx` into `pages/.../link.mdx`.

### Shared Content

In shared pages, sometimes there might be content that is **App Router** or **Pages Router** specific. For example, the `<Link>` component has a `shallow` prop that is only available in **Pages** but not in **App**.

To make sure the content only shows in the correct router, we can wrap content blocks in an `<AppOnly>` or `<PagesOnly>` components.

## Code Blocks

Code blocks should contain a minimum working example that can be copied and pasted. This means that the code should be able to run without any additional configuration.

For example, if you're showing how to use the `<Link>` component, you should include the `import` statement and the `<Link>` component itself.

```tsx filename="app/page.tsx"
import Link from 'next/link'

export default function Page() {
  return <Link href="/about">About</Link>
}
```

Always run examples locally before committing them. This will ensure that the code is up-to-date and working.

### Language and Filename

Code blocks should have a header that includes the language and the `filename`.

For CLI commands, use the `package` prop to show the command for each package manager.

### TS and JS Switcher

Add a language switcher to toggle between TypeScript and JavaScript. Code blocks should be TypeScript first with a JavaScript version to accommodate users.

Currently, we write TS and JS examples one after the other, and link them with `switcher` prop.

### Line Highlighting

Code lines can be highlighted. This is useful when you want to draw attention to a specific part of the code. You can highlight lines by passing a number to the `highlight` prop.

**Single Line:** `highlight={1}`

**Multiple Lines:** `highlight={1,3}`

**Range of Lines:** `highlight={1-5}`

## Notes

For information that is important but not critical, use notes. Notes are a good way to add information without distracting the user from the main content.

> **Good to know**: This is a single line note.

> **Good to know**:
>
> * We also use this format for multi-line notes.
> * There are sometimes multiple items worth knowing or keeping in mind.

## Related Links

Related Links guide the user's learning journey by adding links to logical next steps.

* Links will be displayed in cards under the main content of the page.
* Links will be automatically generated for pages that have child pages.

Create related links using the `related` field in the page's metadata.

### Nested Fields

| Field         | Required? | Description                                                                                                                                               |
| ------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | Optional  | The title of the card list. Defaults to **Next Steps**.                                                                                                   |
| `description` | Optional  | The description of the card list.                                                                                                                         |
| `links`       | Required  | A list of links to other doc pages. Each list item should be a relative URL path (without a leading slash) e.g. `app/api-reference/file-conventions/page` |

## Diagrams

Diagrams are a great way to explain complex concepts. We use [Figma](https://www.figma.com/) to create diagrams, following Vercel's design guide.

## Custom Components and HTML

These are the React Components available for the docs: `<Image />` (next/image), `<PagesOnly />`, `<AppOnly />`, `<Cross />`, and `<Check />`. We do not allow raw HTML in the docs besides the `<details>` tag.

If you have ideas for new components, please open a [GitHub issue](https://github.com/vercel/next.js/issues/new/choose).

## Style Guide

This section contains guidelines for writing docs for those who are new to technical writing.

### Page Templates

While we don't have a strict template for pages, there are page sections you'll see repeated across the docs:

* **Overview:** The first paragraph of a page should tell the user what the feature is and what it's used for. Followed by a minimum working example or its API reference.
* **Convention:** If the feature has a convention, it should be explained here.
* **Examples**: Show how the feature can be used with different use cases.
* **API Tables**: API Pages should have an overview table at the of the page with jump-to-section links (when possible).
* **Next Steps (Related Links)**: Add links to related pages to guide the user's learning journey.

Feel free to add these sections as needed.

### Page Types

Docs pages are also split into two categories: Conceptual and Reference.

* **Conceptual** pages are used to explain a concept or feature. They are usually longer and contain more information than reference pages. In the Next.js docs, conceptual pages are found in the **Building Your Application** section.
* **Reference** pages are used to explain a specific API. They are usually shorter and more focused. In the Next.js docs, reference pages are found in the **API Reference** section.

### Voice

Here are some guidelines to maintain a consistent style and voice across the docs:

* Write clear, concise sentences. Avoid tangents.
* Be mindful with the word *this*. It can be ambiguous and confusing, don't be afraid to repeat the subject of the sentence if unclear.
* Use an active voice instead of passive. An active sentence is easier to read.
* Avoid using words like *easy*, *quick*, *simple*, *just*, etc. This is subjective and can be discouraging to users.
* Avoid negative words like *don't*, *can't*, *won't*, etc. This can be discouraging to readers.
* Write in second person (you/your). This is more personal and engaging.
* Use gender-neutral language. Use *developers*, *users*, or *readers*, when referring to the audience.
* If adding code examples, ensure they are properly formatted and working.

While these guidelines are not exhaustive, they should help you get started. If you'd like to dive deeper into technical writing, check out the [Google Technical Writing Course](https://developers.google.com/tech-writing/overview).

---

Thank you for contributing to the docs and being part of the Next.js community!
