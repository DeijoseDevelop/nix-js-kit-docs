---
title: SSR API
description: renderPage, renderPageBody, renderStreamingPage, and renderErrorPage — the programmatic rendering API
section: Server
order: 5
---

# SSR API

Beyond the CLI and the Vite plugin, the kit exposes its rendering pipeline as functions. These power `nix-js-kit start`, the deployment adapters, and the `/__nix-js/render` endpoint — and you can call them yourself for custom servers, edge handlers, or build tooling.

## `renderPage` — render one route to HTML

The core renderer: loads the page module and its data, wraps it in layouts, and returns a full HTML document.

```ts
import { renderPage, scanRoutes } from "@deijose/nix-js-kit";

const routes = await scanRoutes("src/app");

const { html, head, resolvedTitle } = await renderPage({
  route: routes.pages[0],
  params: {},
  searchParams: new URLSearchParams(),
  config: { lang: "en", clientEntry: "/_nix-js/entry-client.js" },
  request: new Request("https://example.com/about"),
});
```

**`RenderPageOptions`:**

| Option | Type | Description |
| --- | --- | --- |
| `route` | `PageRoute` | Route to render (from `scanRoutes`) |
| `params` | `RouteParams` | Values for dynamic segments |
| `searchParams` | `URLSearchParams` | Query string passed to loaders |
| `config` | `{ lang, clientEntry, renderEndpoint? }` | Shell configuration |
| `actions` | `Record<string, string[]>` | Action names per page (from `actionNames`) |
| `importer` | `(path) => Promise<unknown>` | Module loader — Vite plugins pass `ssrLoadModule` here |
| `request` | `Request` | Current request; enables cookies/headers in loaders and the action-error relay |

**Result:** `{ html, revalidate?, clearActionErrorCookie?, head?, resolvedTitle? }`.

## `renderPageBody` — render only the body

Used by the `/__nix-js/render` endpoint for SPA navigation: renders the page and returns just the `#app` inner HTML plus head tags.

```ts
import { renderPageBody, scanRoutes } from "@deijose/nix-js-kit";

const result = await renderPageBody({
  routes: await scanRoutes("src/app"),
  pathname: "/blog/hello-world",
  searchParams: new URLSearchParams(),
  config: { lang: "en", clientEntry: "/_nix-js/entry-client.js" },
});

// { body, title, head?, clearActionErrorCookie?, fullHtml? }
```

Throws `RouteNotFoundError` when `pathname` matches no route — catch it to return a 404.

## `renderStreamingPage` — shell + async content

Renders the `loading.ts` shell and embeds the client script that fetches the real content:

```ts
import { renderStreamingPage, scanRoutes } from "@deijose/nix-js-kit";

const routes = await scanRoutes("src/app");
const route = routes.pages.find((r) => r.path === "/blog/:slug")!;

const { html } = await renderStreamingPage({
  route,
  params: { slug: "hello-world" },
  searchParams: new URLSearchParams(),
  config: { lang: "en", clientEntry: "/_nix-js/entry-client.js" },
});
```

Requires `route.loadingPath` — a `loading.ts` file in the route segment. See [Streaming](/docs/core-concepts/streaming).

## `renderErrorPage` — 404 and 500 pages

Renders the custom error page for a status:

```ts
import { renderErrorPage, scanRoutes } from "@deijose/nix-js-kit";

const routes = await scanRoutes("src/app");
const result = await renderErrorPage({
  routes,
  status: 404,
  config: { lang: "en", clientEntry: "/_nix-js/entry-client.js" },
});

if (result) {
  return new Response(result.html, { status: result.status });
}
```

## `renderToString` — render a template directly

Renders an arbitrary Nix template to HTML in Node (used internally by `renderPage`):

```ts
import { html } from "@deijose/nix-js";
import { renderToString } from "@deijose/nix-js-kit";

const htmlOut = renderToString(() => html`<h1>Hello</h1>`);
```

`renderToString` must receive a **factory function** (not a template literal) so the template evaluates inside the happy-dom environment.

## Custom server example

Combining these pieces with `matchRoute` gives a minimal SSR server:

```ts
import { createServer } from "node:http";
import { scanRoutes, matchRoute, renderPage, renderErrorPage } from "@deijose/nix-js-kit";

const routes = await scanRoutes("src/app");
const config = { lang: "en", clientEntry: "/_nix-js/entry-client.js" };

createServer(async (req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const match = matchRoute(pathname, routes.pages);

  if (!match) {
    const err = await renderErrorPage({ routes, status: 404, config });
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(err?.html ?? "Not found");
    return;
  }

  const { html } = await renderPage({
    route: match.route,
    params: match.params,
    searchParams: match.searchParams,
    config,
  });
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
}).listen(3000);
```

:::note
For production, prefer [`createSsrServer`](/docs/server/ssr-server) or the deployment adapters — they add static file serving, ISR, middleware, actions, and the render endpoint on top of this pipeline.
:::

## Availability

- `renderPage`, `renderPageBody`, `renderStreamingPage`, `renderErrorPage`, `renderToString` — `@deijose/nix-js-kit` (main entry)
- `matchRoute`, `matchApiRoute` — main entry
- The `/__nix-js/render` endpoint and all adapters use these same functions, so behavior is identical everywhere
