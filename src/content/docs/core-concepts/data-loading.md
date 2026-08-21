---
title: Data Loading
description: Loaders, params, request context, and ISR
section: Core Concepts
order: 3
---

# Data Loading

Data loaders run on the server and provide data to your pages. Create a `page.data.ts` file next to `page.ts`.

## Basic loader

```ts
// src/app/page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";

export const load: PageDataLoad = async () => {
  return { title: "Hello World", posts: ["a", "b", "c"] };
};
```

```ts
// src/app/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { load } from "./page.data.ts";

export default function HomePage({ data }: PageProps<typeof load>) {
  return html`
    <h1>${data.title}</h1>
    <ul>${data.posts.map((p) => html`<li>${p}</li>`)}</ul>
  `;
}
```

:::tip
`PageProps<typeof load>` automatically infers the data type from your loader. No manual interface needed.
:::

## Load context

Loaders receive a context with `params`, `searchParams`, and `request`:

```ts
export const load: PageDataLoad = async ({ params, searchParams, request }) => {
  const slug = params.slug;                    // dynamic route param
  const page = searchParams.get("page") ?? "1"; // query string
  const cookie = request?.headers.get("Cookie"); // SSR cookies

  return { slug, page, user: await getUser(cookie) };
};
```

### `LoadContext`

```ts
interface LoadContext {
  params: RouteParams;           // { slug: "hello" } or { slug: ["a","b"] }
  searchParams: URLSearchParams; // ?page=1&tab=info
  request?: Request;             // available in SSR/streaming modes
}
```

:::note
The `request` object is available in SSR (`nix-js-kit start`), streaming, and the Vite dev server. In pure SSG (`nix-js-kit build`), it's `undefined` because there's no HTTP request.
:::

### `RequestContext` (v2)

Since v2.0.0, the unified Web handler exposes a richer `RequestContext` that carries per-request state across middleware, loaders, and actions. It's available from `@deijose/nix-js-kit/runtime`:

```ts
import type { RequestContext } from "@deijose/nix-js-kit/runtime";

// Fields:
//   params      — RouteParams (dynamic segment values)
//   locals      — Record<string, unknown> (per-request mutable state, isolated per request)
//   cookies     — CookieJar (read request cookies: get, getAll, has)
//   signal      — AbortSignal (aborts when the client disconnects)
//   requestId   — string (auto-generated UUID for logging/tracing)
//   platform    — { runtime: "node" | "bun" | "edge", host: string }
//   route       — PageRoute (the matched route)
//   response    — ResponseState (mutable headers + Set-Cookie accumulation)
//   applyToResponse() — merges accumulated headers/cookies/status into a Response
```

Middleware and the unified handler use `RequestContext` internally. Loaders receive a `LoadContext` view (backwards compatible); if you need the full context (e.g. `signal` for abortable fetches), access it via the runtime entry:

```ts
import { streamBoundary } from "@deijose/nix-js-kit";

export const load = async ({ params, request }) => {
  // Use request.signal for abortable data fetching
  const res = await fetch("https://api.example.com/posts", {
    signal: request?.signal ?? undefined,
  });
  return { posts: await res.json() };
};
```

## Dynamic routes with `generateStaticParams`

```ts
// src/app/blog/[slug]/page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";

export const load: PageDataLoad = async ({ params }) => {
  const post = await getPost(params.slug as string);
  return { post };
};
```

```ts
// src/app/blog/[slug]/page.ts
import type { GenerateStaticParams } from "@deijose/nix-js-kit";

export const generateStaticParams: GenerateStaticParams = async () => {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
};
```

## ISR with `revalidate`

Export `revalidate` from `page.data.ts` to enable incremental static regeneration:

```ts
// src/app/blog/[slug]/page.data.ts
export const load = async ({ params }) => {
  return { post: await getPost(params.slug) };
};

export const revalidate = 300; // revalidate every 5 minutes
```

The first request serves the cached HTML. After `revalidate` seconds, the next request regenerates the page and updates the cache.

## Layout data loaders

`layout.data.ts` provides data to layouts:

```ts
// src/app/layout.data.ts
export const load = async () => {
  return { nav: await getNav() };
};
```

The layout receives it via `LayoutProps.data`:

```ts
export default function Layout({ children, data }: LayoutProps<typeof load>) {
  return html`<nav>${data.nav.map(...)}</nav><main>${children}</main>`;
}
```

## Request context for auth

```ts
// src/app/dashboard/page.data.ts
export const load = async ({ request }) => {
  if (!request) return { user: null };

  const session = parseSession(request.headers.get("Cookie"));
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return { user: await getUser(session.userId) };
};
```

:::warning
Cookies are forwarded to loaders in `start`, `preview`, `dev`, and the Vite plugin. Make sure your CSRF and auth middleware run before loaders if you need to block requests early.
:::
