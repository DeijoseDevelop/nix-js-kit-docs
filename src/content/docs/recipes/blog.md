---
title: Blog with Content Collections
description: A complete blog — content collections, dynamic routes, ISR, and JSON-LD
section: Recipes
order: 1
---

# Blog with Content Collections

This recipe builds a complete blog: Markdown posts from the content layer, a listing page, dynamic post pages with ISR, and structured data. Everything is runnable — copy the files into a fresh project.

## 1. Define the collection

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
      tags: z.array(z.string()).default([]),
      published: z.boolean().default(true),
    }),
  }),
};
```

## 2. Write a post

```markdown
---
title: Hello, Nix.js Kit
description: Why I built a blog with zero client JS
date: 2026-08-10
tags: [nix-js, tutorial]
---

# Hello, Nix.js Kit

This post is served as static HTML. The content layer parses the frontmatter,
validates it against the zod schema, and renders the Markdown with `marked`.
```

## 3. Listing page

```ts
// src/app/blog/page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";
import { getCollection } from "@deijose/nix-js-kit/content";

export const load: PageDataLoad = async () => {
  const posts = (await getCollection("blog")).filter((p) => p.data.published);
  return {
    posts: posts.map((p) => ({
      slug: p.slug,
      title: p.data.title,
      description: p.data.description,
      date: p.data.date.toISOString(),
    })),
  };
};
```

```ts
// src/app/blog/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { load } from "./page.data";

export default function BlogIndex({ data }: PageProps<typeof load>) {
  return html`
    <h1>Blog</h1>
    <ul>
      ${data.posts.map((post) => html`
        <li>
          <a href=${`/blog/${post.slug}`}>${post.title}</a>
          <time datetime=${post.date}>${new Date(post.date).toLocaleDateString()}</time>
        </li>
      `)}
    </ul>
  `;
}
```

## 4. Post page (static)

```ts
// src/app/blog/[slug]/page.data.ts
import type { PageDataLoad, GenerateStaticParams } from "@deijose/nix-js-kit";
import { getCollection, renderEntryHTML } from "@deijose/nix-js-kit/content";

export const generateStaticParams = async () => {
  const posts = await getCollection("blog");
  return posts.map((p) => ({ slug: p.slug }));
};

export const load: PageDataLoad = async ({ params }) => {
  const posts = await getCollection("blog");
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    // Throwing a Response from a loader renders it as the HTTP status.
    throw new Response("Post not found", { status: 404 });
  }

  return {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    tags: post.data.tags,
    html: renderEntryHTML(post),
  };
};

// ISR: rebuild this page's HTML at most every 5 minutes
export const revalidate = 300;
```

```ts
// src/app/blog/[slug]/page.ts
import { html, raw } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { load } from "./page.data";

export default function BlogPost({ data }: PageProps<typeof load>) {
  return html`
    <article>
      <h1>${data.title}</h1>
      <p><time datetime=${data.date.toISOString()}>${data.date.toLocaleDateString()}</time></p>
      <ul>${data.tags.map((t) => html`<li class="tag">${t}</li>`)}</ul>
      ${raw(data.html)}
    </article>
  `;
}
```

## 5. Per-page metadata and JSON-LD

`generateMetadata` provides per-page head tags; JSON-LD structured data goes through the loader's `headScripts`:

```ts
// src/app/blog/[slug]/page.ts (add)
import type { GenerateMetadata } from "@deijose/nix-js-kit";

export const generateMetadata: GenerateMetadata = ({ data }) => ({
  title: `${data.title} — My Blog`,
  description: data.description,
  openGraph: { type: "article", title: data.title, description: data.description },
});
```

```ts
// src/app/blog/[slug]/page.data.ts (add to the returned object)
import { jsonLd } from "@deijose/nix-js-kit/seo";

// inside load():
headScripts: [
  jsonLd({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.data.title,
    datePublished: post.data.date.toISOString(),
  }),
],
```

See [Metadata API](/docs/client/metadata) and [SEO & Sitemaps](/docs/client/seo) for details.

## 6. Prev/next and sitemap

For prev/next links, reuse the collection in the loader:

```ts
// inside [slug]/page.data.ts load()
const index = posts.findIndex((p) => p.slug === params.slug);
return {
  ...rest,
  prev: posts[index - 1] ? { slug: posts[index - 1].slug, title: posts[index - 1].data.title } : undefined,
  next: posts[index + 1] ? { slug: posts[index + 1].slug, title: posts[index + 1].data.title } : undefined,
};
```

Generate the sitemap after the build (see [SEO & Sitemaps](/docs/client/seo)):

```ts
// scripts/gen-sitemap.ts
import { generateSitemap } from "@deijose/nix-js-kit/seo";
import { getCollection } from "@deijose/nix-js-kit/content";

const posts = await getCollection("blog");
await generateSitemap({
  siteUrl: "https://example.com",
  outDir: "dist",
  urls: [
    { url: "/", priority: 1 },
    { url: "/blog", priority: 0.8, changefreq: "daily" },
    ...posts.filter((p) => p.data.published).map((p) => ({
      url: `/blog/${p.slug}`,
      lastmod: p.data.date.toISOString().slice(0, 10),
      changefreq: "monthly",
    })),
  ],
});
```

## Result

| File | Behavior |
| --- | --- |
| `/blog` | Static list of published posts |
| `/blog/<slug>` | Static post, rebuilt at most every 5 minutes (ISR) |
| `sitemap.xml` | All post URLs with dates |

To add streaming instead of ISR for the post page, drop `revalidate` and add a `loading.ts` — see [Streaming](/docs/core-concepts/streaming).
