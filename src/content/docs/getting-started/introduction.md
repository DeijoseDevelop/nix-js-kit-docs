---
title: Introduction
description: What is Nix.js Kit and why use it?
section: Getting Started
order: 1
---

# Introduction

**Nix.js Kit** is a full-stack meta-framework built on top of [Nix.js](https://nix-js.dev/). It brings conventions similar to Next.js App Router and Astro to Nix.js — file-based routing, SSG, SSR, ISR, islands, content collections, image optimization, middleware, and SPA-like navigation.

## Why Nix.js Kit?

The key difference from other meta-frameworks is the **runtime cost**. Nix.js has no virtual DOM, so islands hydrate individual signals instead of full component trees. The result is a much smaller client bundle — **~15 KB** for the entire Nix.js runtime.

### Next.js conventions, Astro islands

| Feature | Nix.js Kit | Next.js | Astro |
| --- | --- | --- | --- |
| File-based routing | ✅ | ✅ | ✅ |
| Islands | ✅ | ❌ (RSC) | ✅ |
| Zero client JS by default | ✅ | ❌ | ✅ |
| Server actions | ✅ | ✅ | ❌ |
| Content collections | ✅ | ❌ | ✅ |
| Image optimization | ✅ | ✅ | ✅ |
| Middleware | ✅ | ✅ | ✅ |
| Client runtime | ~15 KB | ~100KB+ | ~0KB |

### Zero dependencies by default

The kit itself has **no hard runtime dependencies** on the client. Optional features use optional peer dependencies:

- `marked` — Markdown rendering (content layer)
- `zod` — Schema validation (content collections)
- `sharp` — Image optimization pipeline

## Features

- **SSG** — Static site generation from `src/app/` file conventions
- **SSR** — On-demand server-side rendering with `nix-js-kit start` (DOM-free since v2)
- **ISR** — Incremental static regeneration with disk cache and TTL
- **File-based routing** — `page.ts`, dynamic routes `[slug]`, catch-all `[...slug]`, optional catch-all `[[...slug]]`, route groups `(group)`
- **Layouts** — Nested `layout.ts` files wrap pages automatically
- **Data loading** — `page.data.ts` loaders with `PageProps<typeof load>` typing
- **Server actions** — `page.action.ts` with CSRF protection and progressive enhancement
- **API routes** — `route.ts` files for HTTP endpoints
- **Islands** — `island()` helper with `load`, `idle`, `visible` directives; `lazyIsland()` for deferred loading; HMR in dev
- **SPA router** — Client-side navigation with prefetch, View Transitions, and scroll restoration
- **Metadata API** — `generateMetadata()` with OpenGraph, Twitter cards, and head merge
- **Content layer** — Typed Markdown collections with YAML frontmatter; recursive nested directories
- **Image optimization** — Responsive `image()` helper with build-time WebP/AVIF; `getImage()` and `ImageService` for programmatic transforms; SHA-256 hashed variants with path containment and atomic writes
- **Middleware** — `src/middleware.ts` with path matchers
- **Error pages** — Custom `404.page.ts` and `500.page.ts`
- **Adapters** — Vercel, Netlify, Bun, and Node deployment targets with explicit capability contracts
- **Vite plugin** — `nixJsKit()` for a Vite-native dev server with island HMR
- **Unified Web handler** — `createWebHandler()` shared by dev, preview, start, and all adapters for identical behavior everywhere
- **CLI tools** — `check`, `routes`, `doctor` for project diagnostics
- **Security** — CSRF protection, production error sanitization, default security headers, body size limits, hardened static serving (Range/HEAD/ETag)

## Project structure

```text
my-app/
├── src/
│   ├── app/
│   │   ├── layout.ts          # root layout
│   │   ├── page.ts            # home page
│   │   ├── page.data.ts       # home loader
│   │   ├── page.action.ts     # home server actions
│   │   ├── 404.page.ts        # custom 404 page
│   │   ├── 500.page.ts        # custom 500 page
│   │   ├── blog/
│   │   │   ├── [slug]/
│   │   │   │   ├── page.ts
│   │   │   │   └── page.data.ts
│   │   │   └── layout.ts
│   │   └── api/
│   │       └── posts/
│   │           └── route.ts   # API endpoint
│   ├── content/               # content layer
│   │   ├── config.ts
│   │   └── blog/
│   │       └── hello-world.md
│   └── islands/               # interactive components
│       └── LikeButton.ts
├── middleware.ts              # optional middleware
└── vite.config.ts
```

## Next steps

- [Installation](/docs/getting-started/installation) — set up a new project
- [Quick start](/docs/getting-started/quick-start) — build your first page
- [Routing](/docs/core-concepts/routing) — learn the file conventions
