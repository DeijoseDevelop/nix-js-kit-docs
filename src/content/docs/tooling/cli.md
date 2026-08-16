---
title: CLI
description: Command-line interface reference for nix-js-kit
section: Tooling
order: 1
---

# CLI

The `nix-js-kit` binary is available after installing the package.

## Commands

### `nix-js-kit build`

Builds the static site and client bundle.

```bash
nix-js-kit build
```

Options:

| Flag | Default | Description |
| --- | --- | --- |
| `-r, --root <dir>` | `cwd` | Project root |
| `-a, --app <dir>` | `src/app` | Pages directory |
| `-i, --islands <dir>` | `src/islands` | Islands directory |
| `-o, --out <dir>` | `dist` | Output directory |
| `-l, --lang <lang>` | `es` | HTML lang attribute |
| `--hydrate-import <spec>` | `@deijose/nix-js-kit/island` | Import path for hydrateIslands |
| `--client-config <path>` | `vite.client.config.ts` (auto) | Vite config for client bundle |

### `nix-js-kit dev`

Starts the dev server with rebuild-on-change. Any source change restarts the worker process.

```bash
nix-js-kit dev
```

The dev server:
- Watches `src/app/`, `src/islands/`, and `src/content/` for changes
- Restarts the worker on source changes (no stale module cache)
- Detects atomic saves (sed/editors) via `rename` events
- Exits cleanly on SIGTERM

### `nix-js-kit preview`

Serves the static build in production mode. Falls back to on-demand SSR for routes not in `dist/`.

```bash
nix-js-kit build
nix-js-kit preview
```

### `nix-js-kit start`

Runs the SSR server (renders pages on demand, serves static assets from `dist/`).

```bash
nix-js-kit build
nix-js-kit start
```

ISR options:

```bash
nix-js-kit start --cache-dir .nix-js/cache --default-revalidate 60
```

| Flag | Default | Description |
| --- | --- | --- |
| `-p, --port <number>` | `3000` | Server port |
| `-h, --host <address>` | `127.0.0.1` | Server host |
| `--cache-dir <dir>` | — | ISR cache directory |
| `--default-revalidate <sec>` | `60` | Default ISR TTL |

### `nix-js-kit adapter <name>`

Generates deployment configuration for a target platform.

```bash
nix-js-kit adapter vercel   # → .vercel/output
nix-js-kit adapter netlify  # → netlify/functions + netlify.toml
nix-js-kit adapter bun      # → .nix-js/bun-server.ts
nix-js-kit adapter node     # → .nix-js/node-server.mjs
```

## Programmatic API

You can use the CLI programmatically:

```ts
import { run, type CliOptions } from "@deijose/nix-js-kit";

await run({
  command: "build",
  root: process.cwd(),
  appDir: "src/app",
  islandsDir: "src/islands",
  outDir: "dist",
});
```

## Bun runtime

For Bun-managed projects, the CLI automatically re-executes itself under the Bun runtime. This ensures `bun:sqlite` and other Bun-specific APIs work correctly with `nix-js-kit build/dev/start/preview`.
