---
title: Build API
description: build(), scanRoutes, documentShell, and BuildConfig — the programmatic SSG pipeline
section: Tooling
order: 3
---

# Build API

The SSG pipeline behind `nix-js-kit build` is exposed as plain functions. Use them to embed the build in your own tooling, build scripts, or CI pipelines.

## `build()` — generate the static site

```ts
import { build } from "@deijose/nix-js-kit";

const result = await build({
  appDir: "src/app",
  outDir: "dist",
  root: process.cwd(),
  clientEntry: "/_nix-js/entry-client.js",
  lang: "en",
  islandsDir: "src/islands",
  generatedEntry: ".nix-js/entry-client.ts",
  publicDir: "public",
});
```

**`BuildConfig`:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `appDir` | `string` | — (required) | Absolute path to `src/app` |
| `outDir` | `string` | — (required) | Absolute output directory |
| `root` | `string` | — | Project root; action paths in HTML are relative to it |
| `clientEntry` | `string` | `/_nix-js/entry-client.js` | URL of the client bundle |
| `lang` | `string` | `es` | HTML `lang` attribute |
| `islandsDir` | `string` | — | Scan islands and auto-generate the client entry (requires `generatedEntry`) |
| `generatedEntry` | `string` | — | Where the generated `entry-client.ts` is written |
| `hydrateImport` | `string` | `@deijose/nix-js-kit/island` | Import spec for `hydrateIslands` |
| `routerImport` | `string` | `@deijose/nix-js-kit/router` | Import spec for `startClientRouter` |
| `publicDir` | `string` | — | Copies public assets; required for image processing |
| `imageFormats` | `ImageFormat[]` | `["webp", "avif"]` | Build-time image variants |
| `renderEndpoint` | `boolean` | `true` | `false` emits the static marker so the router skips the render endpoint |

**`BuildResult`:** `{ pages, skipped, files, islands, generatedEntry?, imagesProcessed }`

- `pages` — number of HTML files generated
- `skipped` — dynamic routes without `generateStaticParams`
- `files` — absolute paths of all generated HTML files
- `islands` — discovered island modules
- `imagesProcessed` — number of image variants generated (0 if sharp is missing)

## `scanRoutes()` — inspect the route tree

Scans `appDir` and returns the full route table without building:

```ts
import { scanRoutes } from "@deijose/nix-js-kit";

const routes = await scanRoutes("src/app");

console.log(routes.pages);   // PageRoute[] with path, pagePath, layouts, params...
console.log(routes.api);     // ApiRoute[] for route.ts files
console.log(routes.error404); // 404.page.ts, if present
```

Dynamic routes (paths containing `:`) require a `generateStaticParams` export; routes without one land in `BuildResult.skipped` instead of failing the build.

## `documentShell()` — assemble a full HTML document

Wraps rendered body HTML into a complete document with `<head>`, metadata, scripts, and the data/actions payloads:

```ts
import { documentShell } from "@deijose/nix-js-kit";

const html = documentShell({
  body: `<div id="app"><h1>Hello</h1></div>`,
  title: "Hello",
  lang: "en",
  headLinks: [
    '<link rel="icon" href="/favicon.ico" />',
  ],
  headScripts: [
    `console.log("boot")`,
  ],
  clientEntry: "/_nix-js/entry-client.js",
});
```

**`ShellOptions` highlights:**

| Option | Description |
| --- | --- |
| `body` | Inner HTML of `#app` (required) |
| `title` | `<title>` text (default `Nix.js Kit App`) |
| `lang` | `<html lang>` (default `es`) |
| `htmlAttributes` | Extra attributes for `<html>` |
| `headScripts` | Synchronous inline scripts (no-flash bootstraps, JSON-LD — complete `<script>` tags are passed through) |
| `headLinks` | Raw HTML strings injected into `<head>` (favicons, manifest, theme-color, styles) |
| `data` | Serialized loader data (`<script id="nix-js-data">`) |
| `actions` | Per-page action names (`<script id="nix-js-actions">`) |
| `metadata` | `PageMetadata` → title/meta/OG/Twitter tags via `buildHeadTags` |
| `renderEndpoint` | `false` adds the static marker meta |

## Building the client bundle

`build()` generates the HTML, not the client JS. The CLI runs the Vite build for the hydration bundle automatically; when calling `build()` directly, run Vite yourself with the [interpolation plugin](/docs/vite-plugin):

```ts
// scripts/build-site.ts
import { build } from "@deijose/nix-js-kit";

await build({
  appDir: "src/app",
  outDir: "dist",
  islandsDir: "src/islands",
  generatedEntry: ".nix-js/entry-client.ts",
  publicDir: "public",
});
```

```bash
vite build --config vite.client.config.ts
```

## Typical CI script

```json
{
  "scripts": {
    "build": "bun run scripts/gen-search-index.ts && bun run scripts/build-site.ts && vite build --config vite.client.config.ts && bun run scripts/copy-public.ts"
  }
}
```

## Availability

- `build`, `scanRoutes`, `documentShell`, `buildHeadTags`, `scanIslands`, `generateClientEntry`, `matchRoute`, `matchApiRoute` — `@deijose/nix-js-kit`
- Types: `BuildConfig`, `BuildResult`, `ShellOptions`, `PageRoute`, `ScannedRoutes`, `ApiRoute`, `IslandModule`, `GenerateEntryOptions`
