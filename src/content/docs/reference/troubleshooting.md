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

### Island never hydrates

- The island name passed to `island("Name", ...)` must match the filename (e.g. `src/islands/Counter.ts` → `"Counter"`)
- The generated entry must include it — regenerate with `nix-js-kit build` or the Vite plugin
- The island is outside the DOM after client-side navigation — islands re-hydrate on `nix-js:rendered`; check the console for `No island registered for "..."`

### Clicking a link does a full page reload

The router only intercepts links matching `isInternalLink`: same hostname, empty `target`, no `download`, no `data-no-router`. Check for any of these, or a modifier key (Ctrl/Cmd/Shift/Alt).

### Lots of `__nix-js/render` 404s in the console

You are serving an old static build. Rebuild with `nix-js-kit build` — static output now emits `<meta name="nix-js:render-endpoint" content="off">`, so the router never probes the endpoint.

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
