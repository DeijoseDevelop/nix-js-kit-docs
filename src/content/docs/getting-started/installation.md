---
title: Installation
description: Set up a new Nix.js Kit project
section: Getting Started
order: 2
---

# Installation

## Requirements

- **Node.js** 18+ (or **Bun** 1.1+)
- **TypeScript** 7+ (recommended)

## Create a new project

### With Bun (recommended)

```bash
mkdir my-app && cd my-app
bun init -y
bun add @deijose/nix-js @deijose/nix-js-kit
```

### With npm

```bash
mkdir my-app && cd my-app
npm init -y
npm install @deijose/nix-js @deijose/nix-js-kit
```

## Optional peer dependencies

Install these only if you use the corresponding features:

```bash
# Content layer (Markdown collections)
bun add marked zod

# Image optimization (build-time pipeline)
bun add sharp
```

:::tip
If you don't install these, the kit works fine — the features just won't be available until you do.
:::

## TypeScript setup

```bash
bun add -d typescript@^7
```

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "paths": {
      "@deijose/nix-js-kit": ["./node_modules/@deijose/nix-js-kit/dist/lib/index.d.ts"],
      "@deijose/nix-js-kit/content": ["./node_modules/@deijose/nix-js-kit/dist/lib/content/index.d.ts"],
      "@deijose/nix-js-kit/image": ["./node_modules/@deijose/nix-js-kit/dist/lib/image/index.d.ts"],
      "@deijose/nix-js-kit/island": ["./node_modules/@deijose/nix-js-kit/dist/lib/island/index.d.ts"],
      "@deijose/nix-js-kit/router": ["./node_modules/@deijose/nix-js-kit/dist/lib/router/client.d.ts"],
      "@deijose/nix-js-kit/vite": ["./node_modules/@deijose/nix-js-kit/dist/lib/vite/index.d.ts"]
    }
  },
  "include": ["src", "vite.config.ts"]
}
```

:::note
TypeScript 7 removed `baseUrl`. The `paths` entries now resolve relative to the `tsconfig.json` file location.
:::

## Vite configuration

Create `vite.config.ts`:

```ts
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

## Verify installation

Create a minimal page:

```ts
// src/app/page.ts
import { html } from "@deijose/nix-js";

export default function HomePage() {
  return html`<h1>Hello, Nix.js Kit!</h1>`;
}
```

Build:

```bash
nix-js-kit build
```

If everything is set up correctly, you'll see `dist/index.html` in your output directory.

## Next steps

- [Quick start](/docs/getting-started/quick-start) — build a complete app
- [Project structure](/docs/getting-started/project-structure) — understand the file conventions
