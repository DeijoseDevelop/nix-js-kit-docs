---
title: Styling
description: Global CSS, headLinks, inline styles, and the no-FOUC pattern
section: Assets
order: 3
---

# Styling

Nix.js Kit is unopinionated about CSS. Pages and islands render plain HTML, so any approach works: a single global stylesheet, CSS variables, CSS modules, or utility-first frameworks compiled with Vite. This page covers the patterns that work well with the framework's architecture.

## Global CSS

The simplest approach: one global stylesheet loaded in the document shell.

The shell's `<head>` is assembled from the `headLinks` array returned by any loader. Add your stylesheet there:

```ts
// src/app/layout.data.ts
export const load = async () => ({
  headLinks: [
    '<link rel="stylesheet" href="/styles.css" />',
  ],
});
```

Serve `styles.css` from `public/` (see [Public Assets](/docs/assets/public-assets)) — it is copied verbatim into `dist/`.

## Inlining CSS for zero render-blocking requests

Every `<link rel="stylesheet">` is a render-blocking request. For documentation-style sites with a small stylesheet, inlining the CSS into a `<style>` tag removes that request entirely:

```ts
// src/app/layout.data.ts
import { readFile } from "node:fs/promises";

export const load = async () => {
  const css = await readFile("src/styles/index.css", "utf8");
  return {
    headLinks: [
      // Escape any `</style>` sequence that could break out of the tag
      `<style>${css.replace(/<\/style>/gi, "<\\/style>")}</style>`,
    ],
  };
};
```

The documentation site itself uses exactly this pattern — all five CSS files are concatenated into a single inline `<style>`, and no stylesheet request is made.

:::note
The tradeoff is duplicated bytes: the full CSS ships inside every HTML page. For large stylesheets, prefer an external file with `font-display`-friendly loading.
:::

## Global resets and variables

Design tokens and resets belong in the global stylesheet, not inside components:

```css
/* src/styles/tokens.css */
:root {
  --brand: #3432c8;
  --bg: #0a0a12;
  --text: #e4e4f0;
  --sp-4: 16px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

Components then reference the variables:

```ts
html`<button style="background:var(--brand);padding:var(--sp-4)">Save</button>`
```

## Self-hosted fonts

Add `@font-face` rules to the global stylesheet and reference files from `public/fonts/` — no external CDN, no preconnect, no render-blocking cross-origin CSS:

```css
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/inter-var.woff2") format("woff2");
}
```

## FOUC prevention across SPA navigation

The SPA router hoists `<link rel="stylesheet">` and `<style>` tags from the incoming page body into `<head>` before injecting the body (`hoistStyles`), so styles persist between navigations without flashing. If your CSS lives in `<head>` via `headLinks`, no hoisting is needed — it survives every navigation automatically.

## Styling islands

Islands render into the same document, so global CSS applies to them without extra setup. For island-local styles, use a class prefix and keep the rules in the global stylesheet:

```ts
// src/islands/Counter.ts
function Counter() {
  return html`<button class="counter-btn">Click me</button>`;
}
```

```css
.counter-btn {
  background: var(--brand);
  color: #fff;
  border-radius: 6px;
  padding: 8px 16px;
}
```

## Server-side scoped styles

If you need page-specific styles, return them from the page's loader via `headScripts` or `headLinks` — they are rendered into the real `<head>` before the body and merged correctly during SPA navigation:

```ts
export const load = async () => ({
  headLinks: [`<style>.pricing-hero { background: #111 }</style>`],
});
```

## Dark mode

A common pattern: store the theme in `localStorage` and apply it with a synchronous head script so the correct theme is set before first paint:

```ts
// In layout.data.ts
const headScripts = [
  "(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})();",
];
```

Then style both themes with attribute selectors:

```css
:root { --bg: #0a0a12; --text: #e4e4f0; }
:root[data-theme="light"] { --bg: #ffffff; --text: #1a1a2e; }
```
