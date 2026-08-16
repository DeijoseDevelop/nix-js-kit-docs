---
title: Streaming
description: Progressive rendering with loading.ts — paint the shell first, stream the content
section: Core Concepts
order: 9
---

# Streaming

Streaming lets the server send the page shell immediately and deliver the real content right after — without waiting for slow data sources (databases, remote APIs, LLMs) to finish before the first byte.

## The pattern

1. The server renders the **loading shell** from `loading.ts` and sends it immediately
2. The client sees paintable UI in one round trip
3. The shell loads a module script that fetches `/__nix-js/render?page=<current-path>`
4. When the data is ready, `#app` is replaced with the real page and `nix-js:rendered` fires (islands re-hydrate)

This is enabled automatically whenever a route has a `loading.ts` file.

## Creating a loading state

```ts
// src/app/blog/[slug]/loading.ts
import { html } from "@deijose/nix-js";

export default function BlogPostLoading() {
  return html`
    <div class="skeleton" aria-busy="true">
      <div class="skeleton-title"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
  `;
}
```

The loading component renders inside a `#nix-js-loading` placeholder that the shell swaps out. While the real content is being fetched, the shell title is `Loading...`.

## Full example

```text
src/app/blog/[slug]/
├── page.ts
├── page.data.ts
└── loading.ts
```

```ts
// src/app/blog/[slug]/page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";

export const load: PageDataLoad = async ({ params }) => {
  // Simulates a slow database query (e.g. 500ms)
  const post = await fetchPost(params.slug);
  return { post };
};

async function fetchPost(slug: string | string[]) {
  await new Promise((r) => setTimeout(r, 500));
  return { title: `Post ${slug}`, content: "..." };
}
```

```ts
// src/app/blog/[slug]/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { load } from "./page.data";

export default function BlogPost({ data }: PageProps<typeof load>) {
  return html`
    <article>
      <h1>${data.post.title}</h1>
      <p>${data.post.content}</p>
    </article>
  `;
}
```

With the `loading.ts` file in place, the shell paints instantly and the article appears as soon as `fetchPost` resolves — the user sees a skeleton instead of a blank page or a spinner on a frozen request.

## Configuration

| Option | Where | Effect |
| --- | --- | --- |
| `loading.ts` presence | Route segment | Enables streaming for that route |
| `streaming: false` | `createSsrServer` options | Disables streaming globally (plain render) |
| `--cache-dir` / `--default-revalidate` | `nix-js-kit start` | ISR caching also applies to the `/__nix-js/render` endpoint |

:::note
Streaming is **shell + client fetch** — the shell is sent immediately, and the content arrives through the render endpoint. True out-of-order server-side flushing (writing chunks as each async boundary resolves) is on the roadmap; `streamBoundary` below exists as the primitive for it.
:::

## `streamBoundary` — async content placeholder

`streamBoundary` is an experimental primitive for content that arrives after mount:

```ts
import { html, streamBoundary } from "@deijose/nix-js-kit";

export default function Widget() {
  const posts = fetchRecentPosts();

  return html`
    ${streamBoundary({
      fallback: html`<div class="skeleton">Loading posts...</div>`,
      promise: posts,
      children: (posts) => html`
        <ul>${posts.map((p) => html`<li>${p.title}</li>`)}</ul>
      `,
    })}
  `;
}
```

On the client it mounts the fallback immediately and swaps in `children(value)` when the promise resolves. For SSR/SSG it renders only the fallback.

## Programmatic streaming

The `renderStreamingPage` function drives the shell-and-fetch flow programmatically — see [SSR API](/docs/server/ssr-api) for the signature.

## When to use streaming

- **Slow data sources** — databases, third-party APIs, AI completions
- **Per-route shells** — the loading UI differs per route
- **SSR deployments** — only meaningful when rendering happens on request (`start`, adapters, Vercel/Netlify functions)

For fully static sites, `loading.ts` has no effect — `generateStaticParams` + SSG already produces the finished HTML.
