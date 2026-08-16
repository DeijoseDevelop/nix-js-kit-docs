---
title: Environment Variables
description: Loader, server, and build-time secrets — what runs where
section: Server
order: 4
---

# Environment Variables

Environment variables work differently depending on where the code runs. The rule of thumb: **code that runs on the server reads `process.env` freely; code that ships to the browser must be inlined at build time or fetched at runtime.**

## Where code runs

| Code | Runs on | Can read `process.env` |
| --- | --- | --- |
| `page.data.ts`, `layout.data.ts` | Build (SSG) or server (SSR) | ✅ |
| `route.ts` (API routes) | Server | ✅ |
| `page.action.ts` (server actions) | Server | ✅ |
| `src/middleware.ts` | Server | ✅ |
| `page.ts` components | Build + browser (hydration) | ⚠️ only via explicit inlining |
| Islands | Browser | ❌ |

## Loaders (server-side)

Loaders run at build time for SSG and on request for SSR, so secrets are safe there:

```ts
// src/app/page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";

export const load: PageDataLoad = async () => {
  const api = process.env.CONTENT_API_URL!;
  const key = process.env.CONTENT_API_KEY!;

  const res = await fetch(api, {
    headers: { Authorization: `Bearer ${key}` },
  });
  return { items: await res.json() };
};
```

:::note
Loader data is serialized into the HTML (`<script id="nix-js-data">`). Only what you **return** from the loader is exposed to the client — never put secrets in the returned object.
:::

## API routes and server actions

```ts
// src/app/api/route.ts
export function GET() {
  return Response.json({ region: process.env.VERCEL_REGION ?? "local" });
}
```

```ts
// src/app/page.action.ts
import { fail } from "@deijose/nix-js-kit";

export async function subscribe(email: string) {
  const key = process.env.NEWSLETTER_KEY;
  if (!key) return fail(500, { error: "Newsletter not configured" });
  // ...
}
```

## Middleware

Middleware runs before API routes and pages, making it the right place for feature flags or tenant configuration:

```ts
// src/middleware.ts
import type { Middleware } from "@deijose/nix-js-kit";

export default (async (request, ctx) => {
  ctx.next({
    headers: {
      "x-app-mode": process.env.APP_MODE ?? "standard",
    },
  });
}) satisfies Middleware;
```

## Configuring values per environment

### Local

```bash
# .env.local (loaded by Bun/Node automatically)
CONTENT_API_URL=https://api.example.com
CONTENT_API_KEY=secret
```

### Vercel / Netlify / Bun / Node

Set the same names in the platform dashboard. Adapters inherit the host's environment — no extra configuration in Nix.js Kit.

## Client-visible values

If a component or island needs a value in the browser, pick one of these:

**1. Inline at build time (public constants):**

```ts
// src/app/lib/config.ts
export const siteUrl = process.env.SITE_URL ?? "https://example.com";
```

**2. Pass through loader data:**

```ts
export const load = async () => ({
  siteUrl: process.env.SITE_URL ?? "https://example.com",
});
```

```ts
export default function Page({ data }: PageProps<typeof load>) {
  return html`<p>Built by ${data.siteUrl}</p>`;
}
```

**3. Fetch at runtime from an API route** (for values that change per request):

```ts
// src/app/api/config/route.ts
export function GET() {
  return Response.json({ region: process.env.REGION });
}
```

## `.env` files

The dev server and CLI load `.env`, `.env.local`, `.env.development`, and `.env.production` using Bun/Node's native dotenv support. Prefix variables that must be exposed to the client — none are exposed automatically; everything is opt-in through the patterns above.

## Availability

- `process.env` — every server-side module (`data.ts`, `route.ts`, `action.ts`, `middleware.ts`, `vite.config.ts`, scripts)
- `Bun.env` — equivalent under Bun
- Loader data serialization — safe to include public config values
