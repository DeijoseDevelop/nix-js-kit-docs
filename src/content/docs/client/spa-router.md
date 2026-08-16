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
2. Router fetches `/about` from `/__nix-js/render` (JSON: `{ title, body }`)
3. Router swaps `#app.innerHTML` with the new body
4. Router updates `document.title`
5. Router dispatches `nix-js:rendered` event
6. Islands re-hydrate on the new content

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

The router prefetches pages automatically:

- **Viewport**: `IntersectionObserver` prefetches when a link enters the viewport
- **Hover/focus**: prefetches on mouseenter/focus
- **Cache**: prefetched pages are cached for 30 seconds

Opt out per-link with `data-no-prefetch`:

```html
<a href="/logout" data-no-prefetch>Logout</a>
```

## View Transitions

When the browser supports the View Transitions API, page transitions use `document.startViewTransition()` for smooth cross-fade animations:

```ts
// Automatic — no code needed
```

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

It returns JSON `{ title, body }` when the client sends `Accept: application/json`, or full HTML otherwise.
