---
title: Upgrade Guide
description: Migrate to newer versions of nix-js-kit
section: Reference
order: 3
---

# Upgrade Guide

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
