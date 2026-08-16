---
title: Vite Plugin
description: Official Vite plugin for nix-js-kit
section: Tooling
order: 2
---

# Vite Plugin

The official Vite plugin gives you a Vite-native dev server with SSR rendering and automatic island entry generation.

## Setup

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { nixJsKit } from "@deijose/nix-js-kit/vite";

export default defineConfig({
  plugins: [
    nixJsKit({
      appDir: "src/app",
      islandsDir: "src/islands",
      contentDir: "src/content",
      generatedEntry: ".nix-js/entry-client.ts",
      clientEntry: "/_nix-js/entry-client.js",
      lang: "en",
    }),
  ],
});
```

Then run:

```bash
npx vite
```

## Options

### `NixJsKitViteOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `appDir` | `string` | `"src/app"` | Pages directory |
| `islandsDir` | `string` | `"src/islands"` | Islands directory |
| `contentDir` | `string` | `"src/content"` | Content directory |
| `generatedEntry` | `string` | `".nix-js/entry-client.ts"` | Generated client entry path |
| `clientEntry` | `string` | `"/_nix-js/entry-client.js"` | Public client entry path |
| `lang` | `string` | `"es"` | HTML lang attribute |
| `hydrateImport` | `string` | `"@deijose/nix-js-kit/island"` | Import for hydrateIslands |
| `routerImport` | `string` | `"@deijose/nix-js-kit/router"` | Import for startClientRouter |
| `actionSecurity` | `ActionSecurityOptions` | `{ enabled: true }` | CSRF configuration |

## What the plugin does

### Dev mode

- Scans `src/app/` for routes, layouts, actions, and error pages
- Generates `.nix-js/entry-client.ts` from scanned islands
- Renders every page via SSR on the Vite dev server
- Serves the `/__nix-js/render` endpoint (HTML or JSON) for SPA navigation
- Serves the `/__nix-js/actions` endpoint for server actions
- Wires up the content layer root (`setContentRoot`)
- Loads `src/middleware.ts` if it exists
- Provides HMR for routes, actions, loaders, islands, and `.md` content files

### Build mode

In production builds, the plugin works alongside `nix-js-kit build` to generate static HTML and the client bundle.

## Attribute interpolation

The plugin includes an interpolation transform that rewrites partial attribute interpolations:

```ts
// You write:
html`<a href="/blog/${slug}">Read</a>`

// The plugin transforms it to:
html`<a href=${() => `/blog/${slug}`}>Read</a>`
```

This works in both `src/app/` and `src/islands/` files, so you can write natural `href` attributes without manual workarounds.

## Client bundle

If you have a `vite.client.config.ts` file, the client hydration bundle is built automatically during `nix-js-kit build` and `nix-js-kit dev`. You can also pass an explicit config with `--client-config <path>`.

## Content layer HMR

When a `.md` file in `src/content/` changes, the plugin clears the content cache so the next request picks up the updated content. No server restart is needed.

## Middleware integration

The plugin loads `src/middleware.ts` on startup and runs it before every request, matching the behavior of `nix-js-kit start` and all deployment adapters.
