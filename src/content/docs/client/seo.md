---
title: SEO & Sitemaps
description: Sitemap.xml, robots.txt, JSON-LD structured data, and per-page metadata
section: Client
order: 4
---

# SEO & Sitemaps

Nix.js Kit ships helpers for the three pillars of on-page SEO: per-page metadata, structured data (JSON-LD), and sitemap/robots files. Metadata generation itself is covered in [Metadata API](/docs/client/metadata).

## Structured data with `jsonLd`

`jsonLd()` returns a complete `<script type="application/ld+json">` tag ready for `headScripts`:

```ts
// src/app/page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";
import { jsonLd } from "@deijose/nix-js-kit/seo";

export const load: PageDataLoad = async () => ({
  headScripts: [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "My App",
      url: "https://my-app.dev",
    }),
  ],
});
```

Arrays are serialized as JSON arrays, so you can pass several schemas at once:

```ts
jsonLd([articleSchema, breadcrumbSchema]);
```

## Sitemap

`generateSitemap()` writes `sitemap.xml` into `outDir` at build time:

```ts
// scripts/gen-sitemap.ts
import { generateSitemap, generateRobots } from "@deijose/nix-js-kit/seo";

await generateSitemap({
  siteUrl: "https://my-app.dev",
  outDir: "dist",
  urls: [
    { url: "/", priority: 1.0, changefreq: "daily" },
    { url: "/about", priority: 0.5, changefreq: "monthly" },
    { url: "/blog", lastmod: "2026-01-15", priority: 0.8, changefreq: "weekly" },
    // Or just strings:
    "/contact",
  ],
});
```

`SitemapEntry` supports `url`, `lastmod`, `changefreq` (`always` | `hourly` | `daily` | `weekly` | `monthly` | `yearly` | `never`), and `priority` (`0.0`–`1.0`). The base URL's trailing slash is normalized and paths are XML-escaped.

## Robots

`generateRobots()` writes `robots.txt`:

```ts
await generateRobots({
  siteUrl: "https://my-app.dev",
  outDir: "dist",
  disallow: ["/admin", "/api"],
  // Or full per-user-agent rules:
  rules: [
    { userAgent: "*", allow: ["/"], disallow: ["/admin"] },
    { userAgent: "Googlebot", crawlDelay: 2 },
  ],
});
```

A `Sitemap: <siteUrl>/sitemap.xml` line is always appended.

## Wiring it into the build

Add a script to `package.json` and chain it into the build, right after the SSG step:

```json
{
  "scripts": {
    "build": "nix-js-kit build && bun run scripts/gen-sitemap.ts"
  }
}
```

The script must run after `nix-js-kit build` so `dist/` exists.

## Per-page robots control

The `robots` field in `PageMetadata` controls the `<meta name="robots">` tag per page:

```ts
// src/app/page.ts
export const generateMetadata = () => ({
  title: "Admin",
  robots: "noindex, nofollow",
});
```

## Static-site URL conventions

On Vercel static and similar hosts, `sitemap.xml` and `robots.txt` at the root of `public/` (or `dist/`) are served automatically — no rewrites needed.

## Availability

- `jsonLd`, `generateSitemap`, `generateRobots` — `@deijose/nix-js-kit/seo`
- `headScripts` / `headLinks` (favicon, manifest, `theme-color`) — returned by any loader, merged into `<head>` automatically
- The SPA router persists `link[rel=icon]`, `apple-touch-icon`, `manifest`, and `theme-color` across client-side navigations
