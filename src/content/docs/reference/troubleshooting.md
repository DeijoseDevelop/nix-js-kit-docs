---
title: Troubleshooting
description: Common errors and how to fix them — build, SSR, hydration, and deployments
section: Reference
order: 4
---

# Troubleshooting

## Build

### "Missing value for dynamic segment"

`generateStaticParams` did not return a value for every dynamic segment of the route.

```text
src/app/blog/[category]/[slug]/page.ts  requires { category, slug }
```

Fix the params object:

```ts
export const generateStaticParams = async () => [
  { category: "guides", slug: "hello" },
];
```

### Dynamic routes are reported as `skipped`

Routes without `generateStaticParams` are not built statically. Either add the export, or rely on SSR (dev/start/adapters render them on demand):

```ts
export const generateStaticParams = async () => {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
};
```

### `Schema validation failed for "<file>"`

A content collection entry does not match its zod schema. The message lists each failing `path: message`:

```text
[nix-js-kit] Schema validation failed for "src/content/blog/hello.md":
- title: Required
- date: Expected date, received string
```

Fix the frontmatter or the schema. With `bun run dev`, content changes trigger a cache clear automatically.

### "marked is not installed" / "zod not found" / sharp warnings

These are **optional peer dependencies**:

| Tool | Needed for | Install |
| --- | --- | --- |
| `marked` | `renderMarkdown` / content rendering | `bun add marked` |
| `zod` | collection schema validation | `bun add zod` |
| `sharp` | build-time image processing | `bun add sharp` |

Without `zod`, validation is skipped silently; without `sharp`, `image()` srcsets point at unprocessed files and the build logs one warning.

## SSR server

### 404 page shows as plain text

`renderErrorPage` returned `undefined` — there is no `404.page.ts` in `src/app`, or the error page itself failed to render. Check the server log for `[render] error 404 page failed`.

### Headers set in middleware never reach the page

`ctx.next({ headers })` headers are passed to **loaders** (`request.headers`), not to the outgoing response. To modify the response, return a `Response` from the middleware (which short-circuits the request).

### ISR cache is never served

ISR requires a cache directory and a TTL:

```bash
nix-js-kit start --cache-dir .nix-js/cache --default-revalidate 300
```

Or per page, export `revalidate` from `page.data.ts`:

```ts
export const revalidate = 60; // seconds
```

## Client / hydration

### "Hydration marker mismatch: Template has no hydration descriptor"

The SSR output is missing hydration markers (`<!--nix-N-->`, `data-nix-e-*`). This happens when:

- You're using an old version of `@deijose/nix-js` (pre-3.0) that doesn't emit markers.
- A custom renderer bypasses `renderToString` from the kit.

Fix: ensure `@deijose/nix-js@^3` and use the kit's `renderToString` which passes `markers: "hydration"` by default.

### "e._render is not a function" (island hydration)

The island registry passed a lazy loader function directly to `hydrateTemplate` instead of awaiting it. This was fixed in v2.0.1 — the registry now uses the discriminated `{ load }` form via `lazyIsland()`. If you have a custom entry, use `lazyIsland()`:

```ts
import { lazyIsland } from "@deijose/nix-js-kit/island";
const Counter = lazyIsland(() => import("./Counter").then((m) => m.default));
hydrateIslands({ Counter });
```

### Island returns null and breaks other islands

Since v2.0.1, islands returning `null`, `false`, or `undefined` are treated as empty islands and hydration continues for siblings. If you're on an older version, upgrade. The error is now reported per-island without crashing global hydration.

### Island never hydrates

- The island name passed to `island("Name", ...)` must match the filename (e.g. `src/islands/Counter.ts` → `"Counter"`)
- The generated entry must include it — regenerate with `nix-js-kit build` or the Vite plugin
- The island is outside the DOM after client-side navigation — islands re-hydrate on `nix-js:rendered`; check the console for `No island registered for "..."`

### Clicking a link does a full page reload

The router only intercepts links matching `isInternalLink`: same hostname, empty `target`, no `download`, no `data-no-router`. Check for any of these, or a modifier key (Ctrl/Cmd/Shift/Alt).

### Lots of `__nix-js/render` 404s in the console

You are serving an old static build. Rebuild with `nix-js-kit build` — static output now emits `<meta name="nix-js:render-endpoint" content="off">`, so the router never probes the endpoint.

### Island chunks 404 under `/assets/...`

Vite generated chunk URLs like `/assets/Counter.js` instead of `/_nix-js/assets/Counter.js`. This was fixed in v2.0.1 — the client bundle now uses `base: "/_nix-js/"`. If you see this, upgrade to `@deijose/nix-js-kit@^2.0.1`.

### `[object Object]` in rendered HTML

The SSR array renderer produced `String(array)` instead of joining rendered items. This was a minifier name collision in the core build, fixed in `@deijose/nix-js@3.0.1`. Upgrade both packages:

```json
{
  "dependencies": {
    "@deijose/nix-js": "^3.0.1",
    "@deijose/nix-js-kit": "^2.0.1"
  }
}
```

### Styles flash on first navigation

Ensure styles are loaded from `<head>` (via `headLinks` in a loader) instead of inside the page body. Body styles are hoisted by the router, but head styles persist natively.

## Deployments

### Vercel: "Build error: `_setSSR` not found"

The `@deijose/nix-js` version resolved to one that removed `_setSSR`. Upgrade the kit and pin the runtime:

```json
{
  "dependencies": {
    "@deijose/nix-js": "3.0.3",
    "@deijose/nix-js-kit": "2.0.4"
  }
}
```

### Adapter says "Run nix-js-kit build first"

Adapters consume the SSG output. Chain the build and adapter in your CI:

```bash
nix-js-kit build && nix-js-kit adapter vercel
```

### Static host returns 404 for deep links

Hosts like GitHub Pages need a catch-all fallback to `404.html`. For Vercel static, ensure `vercel.json` rewrites unknown paths to `/404.html` (or use the full Vercel adapter, which handles routing via Build Output API v3).

### `nix-js-kit adapter` says "ISR requires a persistent filesystem"

The target host declares `filesystem: "ephemeral"` (serverless) or `"readonly"` (edge), but your app uses ISR (`export const revalidate = ...`). Either:

1. Remove ISR for routes that will run on serverless/edge, or
2. Use the Node or Bun adapter (which has `filesystem: "persistent"`), or
3. Use a persistent cache backend (planned for a future release).

See [Adapter Capabilities](/docs/deploy/capabilities).

### `nix-js-kit adapter` says "image transforms require imageRuntime=true"

The target host doesn't support runtime image transforms. Either:

1. Keep image processing at build time only (the default — `image()` variants are generated during `nix-js-kit build`), or
2. Use the Node/Bun adapter which has `imageRuntime: true`.

## Forms and actions

### Action returns 403 "Cross-origin request blocked"

The `Origin` header does not match the `Host`. Happens when an external site posts to your form or when the origin header is missing behind a proxy. Check `actionSecurity.allowedOrigins`, or confirm the deployed origin matches your configured one.

### Form error values never appear in the page

Action failures are relayed through an HttpOnly cookie (15s TTL) and exposed as `props.form`:

```ts
export default function Page({ form }: PageProps) {
  const err = form?.__nix_js_action_error === true ? form.data : undefined;
  return html`${err ? html`<p class="error">${err.message}</p>` : null}`;
}
```

If the page was prerendered (SSG), there is no request to read the cookie from — use server rendering for pages with forms.

## Environment

### `.env` values are `undefined` in loaders

Loaders run in the build process or SSR server, which reads `.env` files from the project root. Confirm the variable exists in `.env.local`, and that you are not relying on values only present in the platform dashboard during local builds.
