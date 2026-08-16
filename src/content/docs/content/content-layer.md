---
title: Content Layer
description: Typed Markdown collections with YAML frontmatter
section: Content
order: 1
---

# Content Layer

The content layer brings typed Markdown collections to Nix.js Kit — similar to Astro Content Collections.

## Setup

Install the optional peer dependencies:

```bash
bun add marked zod
```

## Define collections

Create `src/content/config.ts`:

```ts
import { defineCollection } from "@deijose/nix-js-kit/content";
import { z } from "zod";

export const collections = {
  blog: defineCollection({
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
    }),
  }),
};
```

## Create content

Add Markdown files to `src/content/<collection>/`:

```text
src/content/
├── config.ts
└── blog/
    ├── hello-world.md
    └── second-post.md
```

```markdown
<!-- src/content/blog/hello-world.md -->
---
title: Hello World
description: My first blog post
date: 2025-01-15
tags: ["intro", "nix-js"]
---

# Hello World

This is my first blog post written in Markdown.
```

## Query collections

### `getCollection(name)`

```ts
import { getCollection } from "@deijose/nix-js-kit/content";

const posts = await getCollection("blog");
// Returns all entries, sorted by date descending (if date exists)
```

### `getEntry(collection, slug)`

```ts
import { getEntry } from "@deijose/nix-js-kit/content";

const post = await getEntry("blog", "hello-world");
if (!post) throw new Response("Not Found", { status: 404 });
```

### `getEntries(collection, slugs)`

```ts
import { getEntries } from "@deijose/nix-js-kit/content";

const featured = await getEntries("blog", ["hello-world", "second-post"]);
```

## Render Markdown

### `renderEntryHTML(entry)`

```ts
import { getEntry, renderEntryHTML } from "@deijose/nix-js-kit/content";

const post = await getEntry("blog", "hello-world");
const html = await renderEntryHTML(post);
```

### `renderMarkdown(source)`

```ts
import { renderMarkdown } from "@deijose/nix-js-kit/content";

const html = await renderMarkdown("# Hello\n\nThis is **bold**.");
```

### `raw(html)`

Inject trusted HTML without escaping:

```ts
import { raw } from "@deijose/nix-js-kit/content";

export default function BlogPost({ data }) {
  return html`
    <article>
      <h1>${data.post.data.title}</h1>
      ${raw(data.post.html)}
    </article>
  `;
}
```

:::warning
`raw()` injects HTML directly without sanitization. Only use it with trusted content (your own Markdown). If you render user-generated content, sanitize it first.
:::

## Full example

```ts
// src/content/config.ts
import { defineCollection } from "@deijose/nix-js-kit/content";
import { z } from "zod";

export const collections = {
  blog: defineCollection({
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
    }),
  }),
};
```

```ts
// src/app/blog/[slug]/page.data.ts
import { getEntry, renderEntryHTML } from "@deijose/nix-js-kit/content";

export const load = async ({ params }) => {
  const post = await getEntry("blog", params.slug as string);
  if (!post) throw new Response("Not Found", { status: 404 });
  const html = await renderEntryHTML(post);
  return { post, html };
};
```

```ts
// src/app/blog/[slug]/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { raw } from "@deijose/nix-js-kit/content";
import { load } from "./page.data.ts";

export default function BlogPost({ data }: PageProps<typeof load>) {
  return html`
    <article>
      <h1>${data.post.data.title}</h1>
      <time>${data.post.data.date.toISOString().split("T")[0]}</time>
      ${raw(data.html)}
    </article>
  `;
}
```

## Frontmatter parser

The built-in YAML parser supports:

- Scalar key/value pairs (strings, numbers, booleans, null)
- ISO 8601 dates (`2025-01-15`)
- Inline arrays (`tags: ["a", "b"]`)
- Block arrays:
  ```yaml
  tags:
    - foo
    - bar
  ```
- Quoted strings (single and double)

:::note
The parser does NOT support nested mappings or complex YAML. For most frontmatter use cases, this is sufficient. If you need full YAML, install the `yaml` package and parse manually.
:::

## HMR

In the Vite dev server, `.md` file changes clear the content cache automatically. No server restart needed — just save the file and refresh.

## Subpath export

```ts
import {
  defineCollection,
  getCollection,
  getEntry,
  renderEntryHTML,
  raw,
} from "@deijose/nix-js-kit/content";
```
