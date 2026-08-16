---
title: Metadata API
description: Generate SEO tags with generateMetadata and head merge
section: Client
order: 3
---

# Metadata API

The metadata API lets you control the `<head>` tags for each page — title, description, OpenGraph, Twitter cards, canonical URLs, and more.

## `generateMetadata()`

Export a `generateMetadata` function from `page.ts`:

```ts
// src/app/blog/[slug]/page.ts
import type { PageMetadata } from "@deijose/nix-js-kit";

export const generateMetadata = async ({ params, data }): Promise<PageMetadata> => {
  return {
    title: `${data.title} — My Blog`,
    description: data.description,
    canonical: `https://example.com/blog/${params.slug}`,
    openGraph: {
      type: "article",
      title: data.title,
      description: data.description,
      image: `/og/${params.slug}.jpg`,
      url: `https://example.com/blog/${params.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      image: `/og/${params.slug}.jpg`,
    },
  };
};
```

## `PageMetadata` interface

```ts
interface PageMetadata {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;              // e.g. "index, follow" or "noindex"
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
  other?: Record<string, string>;  // additional meta tags
}
```

### `OpenGraphMetadata`

```ts
interface OpenGraphMetadata {
  type?: string;        // "website", "article", "profile"
  title?: string;       // falls back to page title
  description?: string; // falls back to page description
  url?: string;
  image?: string;
  siteName?: string;
  locale?: string;      // e.g. "en_US"
}
```

### `TwitterMetadata`

```ts
interface TwitterMetadata {
  card?: "summary" | "summary_large_image" | "player" | "app";
  title?: string;
  description?: string;
  image?: string;
}
```

## Metadata sources

Metadata is collected from three sources, merged in this priority:

1. **`generateMetadata()`** export from `page.ts` (highest priority)
2. **`metadata`** field from the page loader (`page.data.ts`)
3. **`metadata`** field from the layout loader (`layout.data.ts`)

```ts
// src/app/page.data.ts
export const load = async () => {
  return {
    title: "Home",
    metadata: {
      title: "My Site — Home",
      description: "Welcome to my site",
    },
  };
};
```

## `MetadataContext`

```ts
interface MetadataContext extends LoadContext {
  data?: unknown;  // loader data, if a loader exists
}
```

## Head tag generation

`buildHeadTags()` generates the HTML for all head tags:

```ts
import { buildHeadTags } from "@deijose/nix-js-kit";

const tags = buildHeadTags({
  title: "About",
  description: "About us",
  openGraph: { type: "website", image: "/og.jpg" },
});
// → '<title>About</title><meta name="description" content="About us">...'
```

## SPA head merge

All generated head tags are marked with `data-nix-js-head`:

```html
<title data-nix-js-head>About</title>
<meta name="description" data-nix-js-head content="About us" />
<meta property="og:title" data-nix-js-head content="About" />
```

On SPA navigation, the client router:

1. Removes all `data-nix-js-head` tags from `<head>`
2. Inserts the new page's head tags
3. Updates `document.title`

This keeps metadata in sync with the current page during SPA navigation.
