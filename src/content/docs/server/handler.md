---
title: Unified Web Handler
description: createWebHandler and RequestContext — the single entry point shared by dev, preview, start, and all adapters
section: Server
order: 6
---

# Unified Web Handler

Since v2.0.2, every runtime path — `dev`, `preview`, `start`, and all four adapters (Node, Bun, Vercel, Netlify) — funnels through a single function: `createWebHandler()`. This eliminates duplicated request-handling logic and guarantees identical behavior across runtimes.

## `createWebHandler()`

```ts
import { createWebHandler } from "@deijose/nix-js-kit/runtime";

const handler = createWebHandler(routes, actions, {
  staticRoot: "./dist",
  lang: "en",
  clientEntry: "/_nix-js/entry-client.js",
  renderEndpoint: true,
  securityHeaders: true,
  cacheDir: "./.nix-js/cache",
  defaultRevalidate: 60,
});

// handler is a pure Web function: Request → Response
const response = await handler(request);
```

### Responsibilities (in order)

1. **Server actions** — `POST /__nix-js/actions` (CSRF-verified, body-limited).
2. **SPA render endpoint** — `GET /__nix-js/render?page=<path>` (returns body + head for SPA navigation).
3. **API routes** — `route.ts` files.
4. **Static files** — served from `staticRoot` with ETag, Range, HEAD, and immutable caching for hashed assets.
5. **Dynamic SSR** — unmatched paths are rendered on demand.
6. **Error pages** — custom `404.page.ts` and `500.page.ts`.

### `WebHandlerOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `staticRoot` | `string` | — | Absolute path to the build output directory |
| `noCache` | `boolean` | `false` | Bypass ISR cache (dev mode) |
| `cacheDir` | `string` | — | ISR cache directory |
| `defaultRevalidate` | `number` | `60` | Default ISR TTL in seconds |
| `importer` | `(path) => Promise<unknown>` | — | Module loader for adapter-bundled entries |
| `lang` | `string` | `"es"` | HTML lang attribute |
| `clientEntry` | `string` | — | Client entry path |
| `renderEndpoint` | `boolean` | `true` | Whether the render endpoint exists |
| `securityHeaders` | `SecurityHeadersConfig \| false` | `true` | Security headers config; `false` disables |

:::note
The handler is **pure** — it does not import Node HTTP types. It works in Bun, Deno, Cloudflare Workers, Vercel Edge, and any Web-standard runtime.
:::

## `RequestContext`

`RequestContext` carries per-request state across middleware, loaders, and actions. It's the single context type used by the unified handler.

```ts
import type { RequestContext } from "@deijose/nix-js-kit/runtime";
```

### Fields

| Field | Type | Description |
| --- | --- | --- |
| `params` | `RouteParams` | Dynamic segment values (`{ slug: "hello" }`) |
| `locals` | `Record<string, unknown>` | Per-request mutable state, isolated per request |
| `cookies` | `CookieJar` | Read request cookies (`get`, `getAll`, `has`) |
| `signal` | `AbortSignal` | Aborts when the client disconnects |
| `requestId` | `string` | Auto-generated UUID for logging/tracing |
| `platform` | `{ runtime, host }` | Detected runtime (`node`, `bun`, `edge`) |
| `route` | `PageRoute` | The matched route |
| `response` | `ResponseState` | Mutable response state (headers + Set-Cookie) |

### `CookieJar` (read)

```ts
interface CookieJar {
  get(name: string): string | undefined;
  getAll(): Record<string, string>;
  has(name: string): boolean;
}
```

### `ResponseCookieJar` (write)

```ts
interface ResponseCookieJar {
  set(name: string, value: string, options?: CookieOptions): void;
  clear(name: string, options?: CookieOptions): void;
  getAll(): string[];
}
```

### `CookieOptions`

| Option | Type | Description |
| --- | --- | --- |
| `httpOnly` | `boolean` | HttpOnly flag |
| `secure` | `boolean` | Secure flag |
| `sameSite` | `"strict" \| "lax" \| "none"` | SameSite policy |
| `maxAge` | `number` | Max age in seconds |
| `expires` | `Date` | Expiration date |
| `path` | `string` | Cookie path |
| `domain` | `string` | Cookie domain |

### `applyToResponse()`

Merges accumulated headers, Set-Cookie values, and status into the final `Response`:

```ts
const ctx = new RequestContext(request, { /* options */ });
ctx.response.headers.set("X-Custom", "value");
ctx.response.cookies.set("session", "abc123", { httpOnly: true });

// Later, when building the response:
const response = ctx.applyToResponse(new Response(html, { headers: { "Content-Type": "text/html" } }));
// response now includes X-Custom and Set-Cookie: session=abc123; HttpOnly
```

## Using the handler in a custom server

```ts
import { createServer } from "node:http";
import { scanRoutes, scanActions, createWebHandler, incomingMessageToRequest } from "@deijose/nix-js-kit/runtime";

const routes = await scanRoutes("src/app");
const actions = await scanActions("src/app");
const handler = createWebHandler(routes, actions, {
  staticRoot: "./dist",
  lang: "en",
  clientEntry: "/_nix-js/entry-client.js",
});

createServer(async (req, res) => {
  const request = incomingMessageToRequest(req);
  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}).listen(3000);
```

## Why a unified handler?

Before v2.0.2, the CLI (`dev`/`preview`), `start`, and each adapter had their own request-handling logic. This meant:

- Bugs fixed in one path weren't fixed in others.
- Behavior could differ between `dev` and production.
- Security headers, error sanitization, and cache policy had to be reimplemented per runtime.

The unified handler solves all three: **one function, one behavior, every runtime**.

## Subpath export

```ts
import {
  createWebHandler,
  RequestContext,
  serveStaticFile,
  resolveStaticFile,
  incomingMessageToRequest,
  guessContentType,
  htmlResponse,
  jsonResponse,
  textResponse,
  notFound,
  methodNotAllowed,
  serverError,
} from "@deijose/nix-js-kit/runtime";
```
