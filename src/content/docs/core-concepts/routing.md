---
title: Routing
description: File-based routing with dynamic segments and route groups
section: Core Concepts
order: 1
---

# Routing

Nix.js Kit uses file-based routing. Files in `src/app/` are mapped to URLs automatically.

## Static routes

| File | URL |
| --- | --- |
| `src/app/page.ts` | `/` |
| `src/app/about/page.ts` | `/about` |
| `src/app/blog/page.ts` | `/blog` |

## Dynamic routes

### `[slug]` — single dynamic segment

```text
src/app/blog/[slug]/page.ts  →  /blog/:slug
```

```ts
// src/app/blog/[slug]/page.ts
// src/app/blog/[slug]/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps, GenerateStaticParams } from "@deijose/nix-js-kit";

export const generateStaticParams: GenerateStaticParams = async () => [
  { slug: "hello-world" },
  { slug: "nix-js-kit" },
];

export default function BlogPost({ params }: PageProps) {
  return html`
    <article>
      <h1>Post: ${params.slug}</h1>
    </article>
  `;
}
```

### `[...slug]` — catch-all route

```text
src/app/docs/[...slug]/page.ts  →  /docs/:slug*
```

Matches one or more segments: `/docs/intro`, `/docs/core/routing`, etc.

```ts
export const generateStaticParams = async () => [
  { slug: ["introduction"] },
  { slug: ["core-concepts", "routing"] },
  { slug: ["reference", "api"] },
];
```

### `[[...slug]]` — optional catch-all route (v2)

Since v2.0.0, you can use an optional catch-all that matches the base path **and** any depth:

```text
src/app/docs/[[...slug]]/page.ts  →  /docs and /docs/:slug*
```

Matches `/docs` (with no slug), `/docs/intro`, `/docs/core/routing`, etc. The param is `undefined` when the base path is matched, and a string array otherwise:

```ts
export const load = async ({ params }) => {
  const segments = params.slug; // undefined | string[]
  if (!segments) return { page: "index" };
  return { page: segments.join("/") };
};
```

## Route groups

Folders wrapped in parentheses are ignored in the URL:

```text
src/app/
├── (marketing)/
│   ├── layout.ts
│   ├── pricing/page.ts     → /pricing
│   └── features/page.ts    → /features
```

Route groups can have their own `layout.ts` that applies to all children without affecting the URL.

## `generateStaticParams`

Dynamic routes are skipped during SSG unless they export `generateStaticParams`. It returns an array of param objects, one per static HTML file to generate:

```ts
export const generateStaticParams: GenerateStaticParams = async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
};
```

For catch-all routes, the param is a string array:

```ts
export const generateStaticParams = async () => [
  { slug: ["docs", "intro"] },
  { slug: ["docs", "advanced", "di"] },
];
```

## Matching helpers

### `matchRoute(pathname, routes)`

```ts
import { matchRoute } from "@deijose/nix-js-kit";

const result = matchRoute("/blog/hello-world", routes);
// { route: PageRoute, params: { slug: "hello-world" } }
```

### `matchApiRoute(pathname, routes)`

```ts
import { matchApiRoute } from "@deijose/nix-js-kit";

const result = matchApiRoute("/api/posts/123", apiRoutes);
// { route: ApiRoute, params: { id: "123" } }
```

## File-to-URL mapping

| File | URL | Notes |
| --- | --- | --- |
| `src/app/page.ts` | `/` | Home page |
| `src/app/about/page.ts` | `/about` | Static page |
| `src/app/blog/[slug]/page.ts` | `/blog/:slug` | Dynamic route |
| `src/app/[...slug]/page.ts` | `/:slug*` | Catch-all route |
| `src/app/(marketing)/about/page.ts` | `/about` | Route group (ignored in URL) |
| `src/app/layout.ts` | all children | Root layout |
| `src/app/blog/layout.ts` | `/blog/*` | Nested layout |
| `src/app/api/posts/route.ts` | `/api/posts` | API endpoint |
