---
title: Public Assets
description: The public/ directory — static files, favicons, fonts, and site-wide assets
section: Assets
order: 2
---

# Public Assets

Files in `public/` are copied verbatim into the build output and served at the site root. Use it for anything served as-is: favicons, fonts, manifests, social images, downloads, and other static files.

## How it works

```text
public/
├── favicon.ico
├── manifest.json
├── fonts/
│   └── inter-var.woff2
├── images/
│   └── og-image.png
└── robots.txt
```

`nix-js-kit build` copies every file into `dist/` unchanged — no hashing, no processing. Refer to them with root-absolute paths:

```ts
import { html } from "@deijose/nix-js";

html`<img src="/images/og-image.png" alt="Social preview" />`;
```

The same is true for the dev server (`nix-js-kit dev`), preview, and every adapter: `public/` is served from `/`.

:::note
Keep images that need optimization out of `public/` — use the [image() helper](/docs/assets/images) for automatic resizing and WebP/AVIF conversion at build time.
:::

## Favicons and manifest

Wire site-wide head links from a loader via `headLinks`:

```ts
// src/app/layout.data.ts
export const load = async () => ({
  headLinks: [
    '<link rel="icon" type="image/x-icon" href="/favicon.ico" />',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
    '<link rel="manifest" href="/manifest.json" />',
    '<meta name="theme-color" content="#3432c8" />',
  ],
});
```

These live in the real `<head>` and persist across SPA navigations (the router keeps icon, manifest, and theme-color links from the fetched page).

## Self-hosted fonts

Fonts in `public/fonts/` can be referenced from CSS with `@font-face` — no external CDN, no preconnect, no render-blocking cross-origin request:

```css
/* src/styles/fonts.css */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/inter-var.woff2") format("woff2");
}
```

`font-display: swap` prevents invisible-text (FOIT) while the file loads. See [Styling](/docs/assets/styling) for how to load CSS into the document.

## Sharing files with source code

If a script needs to reference a `public/` file (e.g. a build script reading an image), resolve it relative to the project root:

```ts
// scripts/anything.ts
import { join } from "node:path";
const logo = join(process.cwd(), "public", "nix-js-logo.png");
```

## Common use cases

| Asset | Path convention |
| --- | --- |
| Favicons | `public/favicon.ico`, `public/apple-touch-icon.png` |
| Web app manifest | `public/manifest.json` |
| Social preview image | `public/og-image.png` |
| Fonts | `public/fonts/*.woff2` |
| Downloads (PDF, zip) | `public/downloads/*` |
| Static JSON used by client code | `public/data/*.json` |

## Availability

- `publicDir` is a `BuildConfig` option and is also required for build-time image processing (sharp writes variants into the same directory tree in `dist/`)
- The `public/` directory convention applies to `nix-js-kit dev`, `preview`, `start`, and all four deployment adapters
