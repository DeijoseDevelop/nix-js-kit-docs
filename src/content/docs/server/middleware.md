---
title: Middleware
description: Run logic before every request with src/middleware.ts
section: Server
order: 1
---

# Middleware

Middleware lets you run logic **before** every request is routed. Use cases include authentication, redirects, header injection, A/B testing, and locale detection.

## Convention

Create a `src/middleware.ts` file (or `middleware.ts` at the project root):

```ts
import type { Middleware } from "@deijose/nix-js-kit";

const middleware: Middleware = (request) => {
  const url = new URL(request.url);

  // Redirect unauthenticated users to login
  if (!request.headers.get("Cookie")?.includes("session=")) {
    return Response.redirect(new URL("/login", request.url), 307);
  }

  // Return nothing (or undefined) to continue to the route handler
};

export default middleware;
```

## Matcher configuration

By default, middleware runs on every request. Use `config.matcher` to limit which paths it applies to:

```ts
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/:path*"],
};
```

### Matcher patterns

| Pattern | Matches | Example |
| --- | --- | --- |
| `/about` | Exact path | `/about` |
| `/blog/:slug` | Single dynamic segment | `/blog/hello-world` |
| `/dashboard/:path*` | Catch-all (one or more segments) | `/dashboard/settings/profile` |
| `/api/:path*` | Catch-all for API routes | `/api/posts/123` |
| `/*` | Every path | All routes |

:::note
Catch-all matchers (`:path*`) also match the base path. For example, `/dashboard/:path*` matches both `/dashboard` and `/dashboard/settings`.
:::

## Use cases

### Authentication

```ts
import type { Middleware } from "@deijose/nix-js-kit";

const middleware: Middleware = (request) => {
  const session = request.headers.get("Cookie")?.match(/session=([^;]+)/);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", new URL(request.url).pathname);
    return Response.redirect(loginUrl, 307);
  }
};

export default middleware;

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/settings/:path*"],
};
```

### Locale detection

```ts
import type { Middleware } from "@deijose/nix-js-kit";

const middleware: Middleware = (request) => {
  const acceptLang = request.headers.get("Accept-Language") ?? "en";
  const locale = acceptLang.startsWith("es") ? "es" : "en";

  // Add a header for downstream loaders
  const headers = new Headers(request.headers);
  headers.set("x-locale", locale);

  return new Request(request, { headers });
};

export default middleware;
```

### Custom headers

```ts
import type { Middleware } from "@deijose/nix-js-kit";

const middleware: Middleware = () => {
  // Return a Response with custom headers, then let the request continue
  // by not returning anything — headers are set via the response below
};

export default middleware;

export const config = {
  matcher: ["/*"],
};
```

## How it works

Middleware runs in this order:

1. Request arrives at the server
2. `matchesMiddleware(request.path)` checks if the path matches `config.matcher`
3. If it matches, `runMiddleware(middleware, request)` is called
4. If the middleware returns a `Response`, the request is short-circuited
5. If it returns `undefined` (or nothing), the request continues to routing

:::tip
Middleware runs in both the SSR server (`nix-js-kit start`) and the Vite dev server. It also runs in all deployment adapters (Vercel, Netlify, Bun, Node).
:::

## API reference

### `Middleware`

```ts
type Middleware = (request: Request) => Response | Request | undefined | void;
```

- Return a `Response` to short-circuit (redirect, 401, etc.)
- Return a modified `Request` to modify the downstream request
- Return `undefined` or nothing to continue

### `MiddlewareConfig`

```ts
interface MiddlewareConfig {
  matcher?: string[];
}
```

### `loadMiddleware(root)`

Loads `src/middleware.ts` (or `middleware.ts`) from the project root. Returns `null` if no middleware file exists.

### `matchesMiddleware(path, config)`

Returns `true` if the given path matches any of the `config.matcher` patterns.

### `runMiddleware(middleware, request)`

Executes the middleware function and returns its result.

## Integration

Middleware is automatically integrated into:

- `nix-js-kit dev` — Vite dev server
- `nix-js-kit start` — SSR server
- `nix-js-kit preview` — preview server
- All deployment adapters (Vercel, Netlify, Bun, Node)

No additional configuration is needed — just create `src/middleware.ts` and it runs automatically.
