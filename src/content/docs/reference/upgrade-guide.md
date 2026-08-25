---
title: Upgrade Guide
description: Migrate to newer versions of nix-js-kit
section: Reference
order: 3
---

# Upgrade Guide

## Upgrading to v2.4.4

v2.4.4 fixes two bugs introduced in v2.4.3 that prevented client-only
islands from hydrating on the client.

### Bugfix-only release

v2.4.4 is a bugfix release. No API changes — just upgrade:

```bash
bun add @deijose/nix-js-kit@^2.4.4
```

### What was broken in v2.4.3

1. **`directive: "only"` never hydrated** — `hydrateIslands()` only had
   branches for `"load"`, `"idle"`, and `"visible"`. Markers with
   `data-directive="only"` were silently skipped — the component never
   mounted, leaving the fallback HTML (or empty marker) permanently.

2. **`hydrateTemplate` did nothing for islands without SSR DOM** —
   Islands with `"only"` or `ssr: false` have no SSR-rendered DOM in
   the marker (only fallback HTML or nothing). `hydrateTemplate` walks
   existing DOM for hydration markers — when there's nothing to walk,
   it silently does nothing (templates with no bindings) or throws a
   mismatch and remounts (templates with bindings).

### What v2.4.4 does

1. `"only"` now hydrates immediately like `"load"` in `hydrateIslands()`.
2. The hydrator detects the absence of `<!--nix-` markers and does a
   fresh `_render` mount instead of `hydrateTemplate` — the correct
   operation when there's no SSR DOM to hydrate against.

### If you applied a workaround in v2.4.3

If you used `island("Name", Component, props, "load", { ssr: false })`
instead of `"only"` as a workaround, you can now switch back to
`island("Name", Component, props, "only")` — both work correctly in
v2.4.4. The workaround also continues to work.

---

## Upgrading to v2.4.3

v2.4.3 fixes a regression introduced in v2.4.0: `island()` crashed for
client-only components after the happy-dom fallback was removed. It also
adds two opt-out mechanisms for client-only islands and an `isSSR()`
guard for environment reads.

### No breaking changes

All additions are opt-in and backward compatible:

- `directive: "only"` is a new value (default remains `"load"`).
- `options` is a new optional 5th parameter.
- `isSSR()` is a new export.
- Existing `island("Name", Component, props, "load")` calls work
  unchanged.

### Migrating client-only components

If you had components that accessed `document`/`window`/`navigator` and
worked before v2.4.0 (because happy-dom provided a mock), they now
crash with `ReferenceError: document is not defined`. Fix them with one
of:

```ts
// 1. directive: "only" — skip SSR, hydrate on load
island("Carousel", Carousel, {}, "only")

// 2. options: { ssr: false } — skip SSR, keep any directive
island("Chart", Chart, { data }, "visible", { ssr: false })

// 3. isSSR() — guard environment reads (keeps SSR fallback HTML)
import { isSSR } from "@deijose/nix-js-kit";
function ThemeToggle() {
  const dark = signal(isSSR() ? false : matchMedia("(prefers-color-scheme: dark)").matches);
  // ...
}
island("ThemeToggle", ThemeToggle, {}, "load")
```

:::warning
`isSSR()` only works for environment reads (`window.matchMedia`,
`localStorage`, `navigator`). It does **not** work for
`document.querySelectorAll(".slide")` of the component's own children —
the DOM is not inserted when the function body runs. For that, use
`NixComponent.onMount()` + `ref`, or `directive: "only"`.
:::

### Fallback content

Use `options.fallback` to show loading content while the client-only
island hydrates:

```ts
island("Carousel", Carousel, {}, "only", {
  fallback: html`<div class="skeleton">Loading…</div>`,
})
```

---

## Upgrading to v2.4.0

v2.4.0 removes happy-dom entirely, renames the config file, and fixes CLI bundling bugs.

### Breaking changes

- **`happy-dom` fully removed** — the kit no longer references happy-dom anywhere. SSR uses the core's DOM-free `renderToString` (`@deijose/nix-js/server`) directly, with no DOM fallback. If you had `happy-dom` in your dependencies for SSR, you can remove it.
- **Config file renamed: `nix.config.*` → `nix-js.config.*`** — the generic `nix.config.ts` name could collide with other tools. The kit now looks for `nix-js.config.{ts,js,mjs}` first. Legacy `nix.config.*` files are still detected but emit a deprecation warning.

### Migration

```bash
# Rename config file
mv nix.config.ts nix-js.config.ts

# Remove happy-dom if you had it installed for SSR
bun remove happy-dom
```

Run `nix-js-kit doctor` to check for legacy config files and other issues.

### Fixes

- CLI bundling bug where the image registry had a dual instance (CLI bundle vs library chunk), causing `consumeImageRegistry()` to always return `[]`.
- `raw()` missing `renderServer` — caused "Template does not support server rendering" errors after happy-dom removal.

---

## Upgrading to v2.3.0

v2.3.0 delegates template interpolation to the Vite plugin when available.

### No breaking changes

```bash
bun add @deijose/nix-js-kit@^2.3.0
```

### What changed

When `@deijose/vite-plugin-nix-js` >= 1.1.0 is installed, the kit's legacy interpolation transform is skipped (the plugin's state-machine lexer takes precedence). The kit's transform remains as a fallback for projects that use the kit without the plugin.

### Migration

Install the Vite plugin for the best interpolation support:

```bash
bun add @deijose/vite-plugin-nix-js@^1.1.0
```

---

## Upgrading to v2.2.0

v2.2.0 adds native partial attribute interpolation when using Nix.js core >= 3.3.

### No breaking changes

```bash
bun add @deijose/nix-js-kit@^2.2.0
```

### What changed

When the installed Nix.js core exposes `templateFeatures.partialAttributeInterpolation` (core >= 3.3), the kit no longer injects the legacy `nixJsInterpolationPlugin` transform. Partial attributes now run through the runtime's native normalization, preserving fine-grained reactivity.

New `interpolation: "auto" | "legacy" | "off"` option on `nixJsKit()`, `buildClientBundle()`, and `transformProjectFiles()`:
- `"auto"` (default) — uses native when available, legacy otherwise
- `"legacy"` — forces the old transform for migrations (emits deprecation warning)
- `"off"` — disables interpolation transform entirely

---

## Upgrading to v2.1.0

v2.1.0 adds five major features: route-level code-splitting, layout slots, cache adapters, real Suspense streaming, and makes happy-dom an optional peer dependency.

### No breaking changes

```bash
bun add @deijose/nix-js-kit@^2.1.0
```

### New features

#### Layout slots

`*.slot.ts` files are now detected by the route scanner and passed to layout components as named slots (`slots.sidebar`, `slots.header`, etc.). See [Pages and Layouts](/docs/core-concepts/pages-and-layouts#layout-slots-v210).

#### Cache adapters

New `createRedisCacheAdapter()` and `createCloudflareKVCacheAdapter()` in `@deijose/nix-js-kit/cache`. See [Rendering Modes — Cache adapters](/docs/core-concepts/rendering-modes#cache-adapters-v210).

#### Real Suspense streaming

`streamBoundary()` and `createStreamingResponse()` now emit a `<template>` chunk + replacement script that swaps the fallback `<div>` for the resolved content in-place (using `replaceWith`), instead of the old `innerHTML` append pattern.

#### Route-level code-splitting

The generated client entry uses `import()` per island, producing separate chunks per page for a minimal initial bundle. This is automatic — no configuration needed.

---

## Upgrading to v2.0.x

v2.0 is a major release that adds DOM-free SSR, a unified Web handler, adapter capabilities, image pipeline hardening, island HMR, recursive content collections, and production error sanitization. It requires `@deijose/nix-js@^3.0.0`.

### Breaking changes

- **`@deijose/nix-js` peer dependency** — bumped to `^3.0.0` (DOM-free SSR, hydration markers).
- **SSR is now DOM-free** — `renderToString` no longer uses happy-dom. Templates render directly from descriptors. Hydration markers (`<!--nix-N-->`, `data-nix-e-*`) are emitted by default.
- **Unified Web handler** — `dev`, `preview`, `start`, and all adapters now share `createWebHandler()`. If you had custom request handling logic that duplicated the CLI pipeline, migrate to `createWebHandler` from `@deijose/nix-js-kit/runtime`.
- **Production errors are sanitized** — `String(err)` is no longer used in responses. Use `publicErrorResponse()` for custom error handling.
- **Log prefixes** — all internal logs now use `[nix-js]` (core) and `[nix-js-kit]` (kit), not `[Nix]`.

### New features (non-breaking, opt-in)

- **`lazyIsland()`** — deferred island component loading without probing.
- **Island HMR** — Vite plugin hot-swaps island modules without full page reload.
- **`getImage()` / `ImageService`** — programmatic single-image and runtime image transforms.
- **Image hardening** — SHA-256 transform keys, path containment, atomic writes, single-flight, `strict` mode.
- **`AdapterCapabilities`** — explicit host capability declarations with build-time validation.
- **Static Range/If-Range/HEAD** — full HTTP semantics for static file serving.
- **Recursive content collections** — `getCollection()` scans nested directories with derived slugs.
- **CLI commands** — `check`, `routes`, `doctor`.
- **`RequestContext`** — unified per-request context with `params`, `locals`, `cookies`, `signal`, `requestId`.

### Migration steps

1. Update both packages:

```bash
bun add @deijose/nix-js@^3 @deijose/nix-js-kit@^2
```

2. Run `nix-js-kit doctor` to diagnose version mismatches and config issues.
3. Run `nix-js-kit check` to typecheck and validate routes.
4. Run `nix-js-kit build` to verify the build.
5. If you have custom servers, migrate to `createWebHandler()` from `@deijose/nix-js-kit/runtime`.

:::note
The v1 → v2 migration guide with detailed API mapping is in `docs/nix-js-kit/nix-js-kit-v1-v2-migration-guide.md` (draft). The automated migration report tool is planned for a later v2.x release.
:::

## Upgrading to v1.3.0

v1.3.0 is a minor release with new features and no breaking changes. However, if you were using internal identifiers from v1.2.6 or earlier, some were renamed for consistency.

### Naming changes (v1.2.7 → v1.3.0)

If you referenced internal identifiers in custom code, update them:

| Old | New | Location |
| --- | --- | --- |
| `__nix_action_error` | `__nix_js_action_error` | Action error cookie |
| `data-nix-head` | `data-nix-js-head` | Head tag marker |
| `nix-stream-*` | `nix-js-stream-*` | Stream boundary IDs |

:::note
These are internal identifiers. If you only use the public API (`nixJsAction`, `island()`, `build()`, etc.), no changes are needed.
:::

### New optional peer dependencies

v1.3.0 adds three optional peer dependencies:

```bash
bun add marked zod sharp
# or
npm install marked zod sharp
```

Install them only if you use the corresponding features:

- `marked` — Content layer (Markdown rendering)
- `zod` — Content layer (schema validation)
- `sharp` — Image optimization (build-time pipeline)

### TypeScript 7

v1.3.0 upgraded to TypeScript 7.0.2 (native Go compiler). If you haven't already:

```bash
bun add -d typescript@^7
```

TypeScript 7 removes `baseUrl` from `tsconfig.json`. Update your `paths` to be relative to the config file:

```json
{
  "compilerOptions": {
    "paths": {
      "@deijose/nix-js-kit": ["./node_modules/@deijose/nix-js-kit/dist/lib/index.d.ts"],
      "@deijose/nix-js-kit/content": ["./node_modules/@deijose/nix-js-kit/dist/lib/content/index.d.ts"]
    }
  }
}
```

:::tip
TypeScript 7's `paths` resolve relative to the `tsconfig.json` file location, not to `baseUrl`. You no longer need `baseUrl` at all.
:::

### New features (non-breaking)

All new features in v1.3.0 are opt-in:

- **Metadata API** — export `generateMetadata()` from `page.ts`
- **Content layer** — create `src/content/config.ts` and `.md` files
- **Image optimization** — use `image()` helper in pages
- **Middleware** — create `src/middleware.ts`
- **CSRF protection** — enabled by default, configure via `actionSecurity`
- **Prefetch** — automatic in the SPA router
- **View Transitions** — automatic when the browser supports it

No existing code needs to change to benefit from these features.

## Upgrading from v1.2.x to v1.2.7

v1.2.7 renamed public API identifiers for consistency:

| Old | New |
| --- | --- |
| `nixAction` | `nixJsAction` |
| `NixAction` (interface) | `NixJsAction` |
| `nixKit` (Vite plugin) | `nixJsKit` |
| `NixKitViteOptions` | `NixJsKitViteOptions` |

Update your imports:

```ts
// Old
import { nixAction } from "@deijose/nix-js-kit/action";

// New
import { nixJsAction } from "@deijose/nix-js-kit/action";
```

```ts
// Old
import { nixKit } from "@deijose/nix-js-kit/vite";

// New
import { nixJsKit } from "@deijose/nix-js-kit/vite";
```

## General upgrade steps

1. Check the [CHANGELOG](https://github.com/DeijoseDevelop/nix-js-kit/blob/main/nix-js-kit/CHANGELOG.md) for breaking changes
2. Update the package: `bun add @deijose/nix-js-kit@latest`
3. Run `tsc --noEmit` to catch any type errors
4. Run `nix-js-kit build` to verify the build
5. Run your tests
