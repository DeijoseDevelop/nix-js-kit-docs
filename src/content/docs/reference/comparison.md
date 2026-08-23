---
title: Comparison
description: How Nix.js Kit compares to Astro and Next.js
section: Reference
order: 2
---

# Comparison

## Feature matrix

| Feature | Nix.js Kit | Astro | Next.js |
| --- | --- | --- | --- |
| **SSG** | ✅ | ✅ | ✅ |
| **SSR** | ✅ | ✅ | ✅ |
| **ISR** | ✅ | ✅ | ✅ |
| **File-based routing** | ✅ | ✅ | ✅ |
| **Dynamic routes** | ✅ `[slug]`, `[...slug]` | ✅ | ✅ |
| **Route groups** | ✅ `(group)` | ✅ | ✅ |
| **Layouts** | ✅ Nested | ✅ | ✅ |
| **API routes** | ✅ `route.ts` | ✅ | ✅ |
| **Server actions** | ✅ `page.action.ts` | ❌ | ✅ |
| **Islands** | ✅ | ✅ | ❌ (RSC) |
| **Zero client JS** | ✅ | ✅ | ❌ |
| **Client runtime** | ~15 KB | ~0KB | ~100KB+ |
| **SPA router** | ✅ | ✅ | ✅ |
| **View Transitions** | ✅ | ✅ | ✅ (experimental) |
| **Prefetch** | ✅ Viewport + hover | ✅ | ✅ |
| **Scroll restoration** | ✅ | ✅ | ✅ |
| **Metadata API** | ✅ `generateMetadata()` | ✅ `<head>` | ✅ |
| **Content collections** | ✅ | ✅ | ❌ |
| **Markdown** | ✅ `marked` (optional) | ✅ Built-in | ❌ MDX |
| **Schema validation** | ✅ `zod` (optional) | ✅ `zod` | ❌ |
| **Image optimization** | ✅ `sharp` (optional) | ✅ `sharp` | ✅ `sharp` |
| **Middleware** | ✅ | ✅ | ✅ |
| **Error pages** | ✅ | ✅ | ✅ |
| **Streaming** | ⚠️ Experimental | ✅ | ✅ |
| **CSRF protection** | ✅ Built-in | ❌ | ✅ |
| **Progressive enhancement** | ✅ | ❌ | ✅ |
| **Vite plugin** | ✅ | ✅ | ❌ |
| **TypeScript** | ✅ TS 7 (Go) | ✅ TS 5 | ✅ TS 5 |
| **Adapters** | Vercel, Netlify, Bun, Node | Many | Vercel, Node |

## When to choose Nix.js Kit

### Choose Nix.js Kit if:

- You want **Next.js conventions** (file-based routing, layouts, actions, API routes) **without the React tax**
- You want **Astro-style islands** with fine-grained signals instead of full hydration
- You want a **single framework** that handles both content sites and interactive apps
- You value **zero client dependencies** and a ~15 KB runtime
- You want **TypeScript 7** with the native Go compiler
- You want **CSRF protection** and **progressive enhancement** built-in

### Choose Astro if:

- You need the **largest ecosystem** of integrations (MDX, React, Vue, Svelte components)
- You need **more adapters** (Cloudflare, Deno, etc.)
- You want **mature streaming** support
- You're building a content-heavy site with minimal interactivity

### Choose Next.js if:

- You're already invested in the **React ecosystem**
- You need **React Server Components**
- You want the **largest community** and commercial support
- You need advanced features like `next/font`, `next/script`, Turbopack
- You're building a highly interactive app where React's ecosystem matters

## Philosophy differences

### Nix.js Kit
- **Signal-based reactivity** — no virtual DOM, no diffing
- **Tagged template literals** — no JSX, no compiler step
- **Zero dependencies** — optional peer deps only for content/images
- **Progressive enhancement** — actions work without JavaScript

### Astro
- **Multi-framework** — use React, Vue, Svelte, or plain HTML
- **Islands by default** — zero JS unless you opt in
- **Content-first** — built for blogs, docs, marketing sites

### Next.js
- **React-first** — everything is a React component
- **RSC** — server components reduce client bundle
- **Full-stack** — API routes, actions, database, caching all built-in
- **Vercel-optimized** — best DX on Vercel's platform
