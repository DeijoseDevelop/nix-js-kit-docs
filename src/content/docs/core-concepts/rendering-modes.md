---
title: Rendering Modes
description: SSG, SSR, ISR, and streaming
section: Core Concepts
order: 4
---

# Rendering Modes

Nix.js Kit supports four rendering modes. You can mix them in the same app — each route can use a different mode.

## SSG (Static Site Generation)

**When:** Build time

```bash
nix-js-kit build
```

The kit scans `src/app/`, runs loaders, composes layout chains, and writes static HTML to `dist/`.

- Fastest possible delivery (CDN-cached)
- No server needed
- Loaders run once at build time
- `request` is `undefined` in loaders

:::tip
SSG is the default and recommended mode for most pages. Use SSR or ISR only for pages that need fresh data.
:::

## SSR (Server-Side Rendering)

**When:** On every request

```bash
nix-js-kit start
```

The SSR server matches the request URL against scanned routes, runs loaders with `params`, `searchParams`, and `request`, then renders the page.

- Fresh data on every request
- Access to `request` (cookies, headers) in loaders
- Slower than SSG (no CDN cache by default)
- Combine with ISR for caching

```bash
nix-js-kit build          # build the client bundle
nix-js-kit start          # SSR server on http://127.0.0.1:3000
```

## ISR (Incremental Static Regeneration)

**When:** Build time + background revalidation

```bash
nix-js-kit start --cache-dir .nix-js/cache --default-revalidate 60
```

ISR combines SSG speed with SSR freshness:

1. First request renders the page and caches the HTML
2. Subsequent requests serve the cached HTML (fast)
3. After `revalidate` seconds, the next request regenerates the page
4. The new HTML replaces the cache

Per-page TTL via `revalidate` export:

```ts
// src/app/blog/[slug]/page.data.ts
export const revalidate = 300; // 5 minutes
```

## Streaming

**When:** On request (SSR with progressive rendering)

Create a `loading.ts` file in a route to enable streaming:

```ts
// src/app/blog/[slug]/loading.ts
import { html } from "@deijose/nix-js";

export default function BlogLoading() {
  return html`<div class="skeleton">Loading post...</div>`;
}
```

The server renders the loading shell immediately and the client fetches the real content from `/__nix-js/render`.

- Fast initial paint (loading shell)
- Real content loads asynchronously
- Works with the SPA router
- ISR caches the `/__nix-js/render` endpoint too

:::note
Streaming is enabled by default when a `loading.ts` file exists. You can disable it with `streaming: false` in `createSsrServer`.
:::

## When to use each

| Mode | Best for | Freshness | Speed |
| --- | --- | --- | --- |
| SSG | Blogs, docs, marketing | Build time | Fastest |
| SSR | Dashboards, personalized | Per request | Medium |
| ISR | News, catalogs | TTL-based | Fast (cached) |
| Streaming | Heavy pages, slow APIs | Per request | Fast initial paint |

## Mixing modes

You can mix modes in the same app:

- `/` (home) → SSG
- `/blog/[slug]` → ISR with `revalidate: 300`
- `/dashboard` → SSR (needs cookies)
- `/blog/[slug]` with `loading.ts` → Streaming + ISR

The kit automatically detects which mode to use based on:
- Whether `nix-js-kit build` or `nix-js-kit start` is running
- Whether `revalidate` is exported
- Whether `loading.ts` exists
- Whether `generateStaticParams` is exported for dynamic routes

## Cache adapters (v2.1.0+)

ISR uses a cache adapter to store rendered HTML. The kit ships with three adapters:

### Filesystem (default)

Used by `nix-js-kit start` when `--cache-dir` is set:

```bash
nix-js-kit start --cache-dir .nix-js/cache --default-revalidate 60
```

### Redis / Upstash

For multi-instance deployments (multiple server processes or edge nodes sharing the same cache):

```ts
import { createRedisCacheAdapter } from "@deijose/nix-js-kit/cache";
import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

export const cacheAdapter = createRedisCacheAdapter(client, {
  keyPrefix: "nix-js:",     // optional key namespace
  tagPrefix: "nix-js-tag:", // tag set namespace for invalidation
});
```

Works with Upstash Redis REST by passing a compatible client.

### Cloudflare KV

For Cloudflare Workers/Pages deployments:

```ts
import { createCloudflareKVCacheAdapter } from "@deijose/nix-js-kit/cache";

export const cacheAdapter = createCloudflareKVCacheAdapter({
  namespace: env.NIX_JS_CACHE, // KV binding
  keyPrefix: "nix-js:",
});
```

### Tag-based invalidation

All adapters support tag-based cache invalidation:

```ts
import { invalidateTags } from "@deijose/nix-js-kit/cache";

// Invalidate all cache entries tagged "posts"
await invalidateTags(["posts"]);
```

Tag storage:
- **Filesystem:** JSON index file in the cache directory
- **Redis:** Redis sets mapping tag → keys
- **Cloudflare KV:** JSON index in a KV key

:::tip
Use tags when a content change should invalidate multiple routes at once. For example, tag all blog post pages with `posts` and call `invalidateTags(["posts"])` after publishing a new post.
:::
