---
title: SSR Server
description: Programmatic SSR server with createSsrServer
section: Server
order: 3
---

# SSR Server

The `createSsrServer()` function gives you a programmatic Node HTTP server that renders pages on demand. This is what `nix-js-kit start` uses internally.

## Basic usage

```ts
import { createSsrServer } from "@deijose/nix-js-kit";

const ssr = await createSsrServer({
  appDir: "./src/app",
  publicDir: "./dist",
  clientEntry: "/_nix-js/entry-client.js",
  port: 3000,
});

await ssr.listen();
console.log("Server running at http://127.0.0.1:3000");
```

## Options

### `SsrServerOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `appDir` | `string` | `"src/app"` | Pages directory |
| `publicDir` | `string` | `"dist"` | Static files directory |
| `clientEntry` | `string` | `"/_nix-js/entry-client.js"` | Client bundle path |
| `port` | `number` | `3000` | Server port |
| `host` | `string` | `"127.0.0.1"` | Server host |
| `lang` | `string` | `"es"` | HTML lang attribute |
| `islandsDir` | `string` | `"src/islands"` | Islands directory |
| `cacheDir` | `string` | — | ISR cache directory |
| `defaultRevalidate` | `number` | `60` | Default ISR TTL (seconds) |
| `streaming` | `boolean` | `true` (if loading.ts exists) | Enable streaming |
| `actionSecurity` | `ActionSecurityOptions` | `{ enabled: true }` | CSRF configuration |

## ISR configuration

Enable ISR by setting `cacheDir` and `defaultRevalidate`:

```ts
const ssr = await createSsrServer({
  appDir: "./src/app",
  publicDir: "./dist",
  clientEntry: "/_nix-js/entry-client.js",
  cacheDir: ".nix-js/cache",
  defaultRevalidate: 60, // revalidate every 60 seconds
});
```

Individual pages can override the TTL via the `revalidate` export in `page.data.ts`:

```ts
// src/app/blog/[slug]/page.data.ts
export const load = async ({ params }) => {
  const post = await getPost(params.slug);
  return { post };
};

export const revalidate = 300; // 5 minutes for this page
```

## Streaming

Streaming is enabled by default when a `loading.ts` file exists in a route. The server renders the loading shell immediately and the client fetches the real content from `/__nix-js/render`.

```ts
const ssr = await createSsrServer({
  appDir: "./src/app",
  publicDir: "./dist",
  clientEntry: "/_nix-js/entry-client.js",
  streaming: true, // explicitly enable
});
```

## Server instance

`createSsrServer()` returns a `SsrServer` with:

```ts
interface SsrServer {
  listen(): Promise<void>;
  close(): Promise<void>;
  server: http.Server;
}
```

## Cache helpers

The kit exports cache helpers for programmatic cache management:

```ts
import {
  getCachedHtml,
  setCachedHtml,
  clearCache,
} from "@deijose/nix-js-kit";

// Check if a page is cached
const cached = await getCachedHtml("/blog/hello-world", ".nix-js/cache");
if (cached) {
  // Serve cached HTML
}

// Manually cache a page
await setCachedHtml("/blog/hello-world", html, ".nix-js/cache", 60);

// Clear the entire cache
await clearCache(".nix-js/cache");
```

## Custom server integration

You can embed the SSR server in a custom Node app:

```ts
import { createSsrServer } from "@deijose/nix-js-kit";
import { createServer } from "node:http";

async function main() {
  const ssr = await createSsrServer({
    appDir: "./src/app",
    publicDir: "./dist",
    clientEntry: "/_nix-js/entry-client.js",
    port: 3000,
  });

  await ssr.listen();

  // Graceful shutdown
  process.on("SIGTERM", () => ssr.close());
  process.on("SIGINT", () => ssr.close());
}

main();
```

:::tip
For production deployments, use the [adapters](/docs/deploy/adapters) instead of a custom server. They handle bundling, static file serving, and platform-specific configuration automatically.
:::
