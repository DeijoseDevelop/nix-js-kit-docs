---
title: Adapters
description: Deploy to Vercel, Netlify, Bun, and Node
section: Deploy
order: 1
---

# Adapters

Nix.js Kit includes built-in adapters for the most common deployment platforms. Each adapter generates a self-contained server entry that serves static files and renders pages on demand.

## Vercel

```bash
nix-js-kit build
nix-js-kit adapter vercel
```

Produces a `.vercel/output` directory compatible with the Vercel Build Output API v3:

- `static/` — static files from `dist/`
- `functions/__nix-js-kit.func/index.js` — bundled SSR function
- `config.json` — routing configuration

Programmatic usage:

```ts
import { vercelAdapter } from "@deijose/nix-js-kit/adapters/vercel";

await vercelAdapter.build({
  root: process.cwd(),
  appDir: "src/app",
  islandsDir: "src/islands",
  outDir: "dist",
  clientEntry: "/_nix-js/entry-client.js",
  lang: "en",
});
```

## Netlify

```bash
nix-js-kit build
nix-js-kit adapter netlify
```

Produces:

- `netlify/functions/__nix-js-kit.mjs` — bundled SSR function (Netlify Functions v2)
- `netlify.toml` — redirects unmatched routes to the function

Static files stay in `dist/` and are served directly by Netlify.

```ts
import { netlifyAdapter } from "@deijose/nix-js-kit/adapters/netlify";

await netlifyAdapter.build({
  root: process.cwd(),
  appDir: "src/app",
  islandsDir: "src/islands",
  outDir: "dist",
  clientEntry: "/_nix-js/entry-client.js",
  lang: "en",
});
```

## Bun

```bash
nix-js-kit build
nix-js-kit adapter bun
bun run .nix-js/bun-server.ts
```

Generates:

- `.nix-js/bun-index.ts` — SSR handler entry
- `.nix-js/bun-server.ts` — Bun server serving `dist/` and rendering pages

The server respects the `PORT` environment variable (default `3000`).

```ts
import { bunAdapter } from "@deijose/nix-js-kit/adapters/bun";

await bunAdapter.build({
  root: process.cwd(),
  appDir: "src/app",
  islandsDir: "src/islands",
  outDir: "dist",
  clientEntry: "/_nix-js/entry-client.js",
  lang: "en",
});
```

:::tip
The Bun adapter supports `bun:sqlite` natively, making it ideal for projects using Bun-specific APIs.
:::

## Node

```bash
nix-js-kit build
nix-js-kit adapter node
node .nix-js/node-server.mjs
```

Generates a single bundled `.nix-js/node-server.mjs` that serves `dist/` and renders pages on demand. Requires Node 18+.

The server respects the `PORT` environment variable (default `3000`).

```ts
import { nodeAdapter } from "@deijose/nix-js-kit/adapters/node";

await nodeAdapter.build({
  root: process.cwd(),
  appDir: "src/app",
  islandsDir: "src/islands",
  outDir: "dist",
  clientEntry: "/_nix-js/entry-client.js",
  lang: "en",
});
```

## Custom adapter

You can build a custom adapter using the shared adapter helpers:

```ts
import type { Adapter, AdapterOptions } from "@deijose/nix-js-kit";

const myAdapter: Adapter = {
  async build(options: AdapterOptions) {
    // 1. Build the SSR entry
    // 2. Bundle it for your platform
    // 3. Generate platform-specific config files
  },
};
```

## What adapters do

All adapters share the same pattern:

1. **Bundle the SSR entry** — embeds the full route table, no runtime filesystem scanning
2. **Include `layout.data.ts` modules** in the registry
3. **Preserve action resolution** by page scope
4. **Serve the `/__nix-js/render` endpoint** (HTML or JSON) for SPA navigation
5. **Forward cookies** to API routes and server actions
6. **Render custom error pages** (404, 500)
7. **Run middleware** if `src/middleware.ts` exists

:::note
Adapters work with both Node (`node:sqlite`) and Bun (`bun:sqlite`) runtimes. The generated server entry detects the available runtime automatically.
:::
