---
title: SPA Router
description: Client-side navigation with prefetch, View Transitions, and scroll restoration
section: Client
order: 2
---

# SPA Router

The built-in client router intercepts internal link clicks, fetches page bodies, and swaps `#app` without full page reloads.

## Setup

```ts
// src/entry-client.ts
import { startClientRouter } from "@deijose/nix-js-kit/router";

startClientRouter();
```

The router is bundled into the generated client entry automatically when you use `nix-js-kit build` with `islandsDir` configured.

## How it works

1. User clicks an internal link (`<a href="/about">`)
2. Router fetches the page body and head tags
3. Router swaps `#app.innerHTML` with the new body
4. Router updates `document.title` and merges head tags
5. Router dispatches `nix-js:rendered` event
6. Islands re-hydrate on the new content

The router supports two transport modes:

- **Render endpoint** (`/__nix-js/render`) — returns compact JSON `{ title, body }`. Used by `dev`, `start`, `preview`, and every deployment adapter.
- **HTML fallback** — fetches the full page HTML and extracts `#app` + head tags. Used automatically on fully static deployments (Vercel static, GitHub Pages, Netlify static) where no endpoint exists.

Static builds emit `<meta name="nix-js:render-endpoint" content="off">` in the `<head>` so the router skips the endpoint entirely and goes straight to the HTML fallback — zero wasted requests. If you're serving a build that still contains the marker, it comes from an SSG build: the marker is stripped by `dev` so live editing keeps the fast JSON endpoint.

## Programmatic navigation

```ts
import { navigateTo } from "@deijose/nix-js-kit/router";

// Push a new URL
navigateTo("/blog/hello-world");

// With query string
navigateTo("/blog", "?page=2");

// Replace instead of push
navigateTo("/login", "", false);
```

## Prefetch

Prefetch is **interaction-only by default** (same approach as Astro): pages are prefetched when a link is hovered or focused, never on page load. This keeps the initial load free of a burst of fetches that would compete with fonts and images for bandwidth.

- **Hover/focus**: the router prefetches the target when a link receives `pointerenter` or `focus`
- **Cache**: prefetched pages are cached for 30 seconds
- **Endpoint probe**: on servers without the static marker, endpoint detection uses a single shared probe — concurrent prefetches generate at most one request to `/__nix-js/render`

Opt in to viewport prefetching per link with `data-prefetch="viewport"`:

```html
<a href="/docs/core-concepts/routing" data-prefetch="viewport">Routing</a>
```

Opt out per-link with `data-no-prefetch`:

```html
<a href="/logout" data-no-prefetch>Logout</a>
```

## Link attributes

The router honors these `data-` attributes on `<a>` elements:

| Attribute | Effect |
| --- | --- |
| `data-no-router` | Skip the router entirely; the browser performs a normal full-page navigation |
| `data-no-prefetch` | Never prefetch this link |
| `data-prefetch="viewport"` | Prefetch when the link enters the viewport (opt-in) |
| `data-scroll-preserve="key"` | Save and restore this element's scroll position across navigations |

```html
<a href="/docs/reference/api-reference" data-prefetch="viewport" data-scroll-preserve="table">API reference</a>
```

## View Transitions

When the browser supports the View Transitions API, page transitions use `document.startViewTransition()` for smooth cross-fade animations. No configuration is required — the router detects the API and applies it automatically.

The router automatically respects `prefers-reduced-motion: reduce` and falls back to instant swaps.

## Head merge

Head tags marked with `data-nix-js-head` are swapped on every navigation:

```html
<!-- In the document shell -->
<title data-nix-js-head>About</title>
<meta name="description" data-nix-js-head content="About us" />
```

The router removes old `data-nix-js-head` tags and inserts the new ones from the fetched page.

## Scroll restoration

On `popstate` (back/forward navigation), the router restores the scroll position for that path. This makes SPA navigation feel native.

## Modifier keys

The router ignores clicks with modifier keys (Ctrl/Cmd/Shift/Alt/Meta), letting users open links in new tabs naturally.

## `nix-js:rendered` event

After each SPA navigation, the router dispatches a `nix-js:rendered` CustomEvent on `document`. The hydration system listens for this event to mount islands over the swapped page body.

```ts
document.addEventListener("nix-js:rendered", () => {
  // Re-initialize third-party widgets, analytics, etc.
});
```

## `/__nix-js/render` endpoint

The render endpoint is available in every server mode:

- `nix-js-kit dev` (Vite plugin)
- `nix-js-kit start` (SSR server)
- `nix-js-kit preview`
- All deployment adapters

It returns JSON `{ title, body }` when the client sends `Accept: application/json`, or full HTML otherwise. On fully static deployments there is no endpoint — the router detects this (via the static build marker or a single probe request) and falls back to HTML-based navigation with identical behavior.
