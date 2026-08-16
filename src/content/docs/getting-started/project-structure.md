---
title: Project Structure
description: File conventions and directory layout
section: Getting Started
order: 4
---

# Project Structure

Nix.js Kit uses file-based conventions. Each file in `src/app/` maps to a URL or serves a special purpose.

## File conventions

| File | Purpose | Required |
| --- | --- | --- |
| `page.ts` | Page component (default export) | Yes (for each route) |
| `page.data.ts` | Data loader for the page | No |
| `page.action.ts` | Server actions for the page | No |
| `layout.ts` | Layout wrapping child pages | No |
| `layout.data.ts` | Data loader for the layout | No |
| `route.ts` | API endpoint (HTTP handlers) | No |
| `loading.ts` | Loading boundary for streaming | No |
| `404.page.ts` | Custom 404 error page | No |
| `500.page.ts` | Custom 500 error page | No |
| `middleware.ts` | Middleware (at project root) | No |
| `content/config.ts` | Content collection definitions | No |

## Directory structure

```text
my-app/
├── src/
│   ├── app/
│   │   ├── layout.ts              # root layout (wraps all pages)
│   │   ├── page.ts                # → /
│   │   ├── page.data.ts           # loader for home page
│   │   ├── page.action.ts         # server actions for home
│   │   ├── 404.page.ts            # custom 404
│   │   ├── 500.page.ts            # custom 500
│   │   ├── about/
│   │   │   └── page.ts            # → /about
│   │   ├── blog/
│   │   │   ├── layout.ts          # layout for /blog/*
│   │   │   ├── [slug]/
│   │   │   │   ├── page.ts        # → /blog/:slug
│   │   │   │   └── page.data.ts
│   │   │   └── loading.ts         # streaming boundary for /blog/*
│   │   ├── (marketing)/           # route group (URL-ignored)
│   │   │   ├── layout.ts          # shared layout for group
│   │   │   ├── pricing/
│   │   │   │   └── page.ts        # → /pricing
│   │   │   └── features/
│   │   │       └── page.ts        # → /features
│   │   └── api/
│   │       └── posts/
│   │           └── route.ts       # → /api/posts (API endpoint)
│   ├── content/
│   │   ├── config.ts              # collection definitions
│   │   └── blog/
│   │       ├── hello-world.md
│   │       └── second-post.md
│   └── islands/
│       ├── Counter.ts
│       └── nav/
│           └── MobileMenu.ts
├── middleware.ts                  # optional middleware
├── vite.config.ts
└── tsconfig.json
```

## How the scanner maps files to URLs

The route scanner walks `src/app/` recursively:

1. **`page.ts`** → URL is the directory path (relative to `src/app/`)
   - `src/app/page.ts` → `/`
   - `src/app/about/page.ts` → `/about`
   - `src/app/blog/[slug]/page.ts` → `/blog/:slug`

2. **`layout.ts`** → wraps all pages in the same directory and below
   - `src/app/layout.ts` → root layout (wraps everything)
   - `src/app/blog/layout.ts` → wraps all `/blog/*` pages

3. **`route.ts`** → API endpoint at the directory path
   - `src/app/api/posts/route.ts` → `GET/POST /api/posts`

4. **`[slug]`** → single dynamic segment
   - Matches one URL segment (e.g. `/blog/hello-world`)
   - Requires `generateStaticParams` for SSG

5. **`[...slug]`** → catch-all dynamic segment
   - Matches one or more URL segments (e.g. `/docs/intro/getting-started`)
   - Requires `generateStaticParams` for SSG

6. **`(group)`** → route group (ignored in URL)
   - `src/app/(marketing)/pricing/page.ts` → `/pricing` (not `/(marketing)/pricing`)
   - Can have its own `layout.ts` that applies to all children

## Route groups

Folders wrapped in parentheses are **ignored in the URL** but can hold a shared `layout.ts`:

```text
src/app/
├── (marketing)/
│   ├── layout.ts          # marketing shell (header + footer)
│   ├── pricing/page.ts    # → /pricing
│   └── features/page.ts   # → /features
├── (dashboard)/
│   ├── layout.ts          # dashboard shell (sidebar + nav)
│   └── settings/page.ts   # → /settings
```

This is useful for applying different layouts to different sections without affecting the URL structure.

## Dynamic routes

### `[slug]` — single segment

```text
src/app/blog/[slug]/page.ts  →  /blog/:slug
```

Requires `generateStaticParams`:

```ts
export const generateStaticParams = async () => [
  { slug: "hello-world" },
  { slug: "second-post" },
];
```

### `[...slug]` — catch-all

```text
src/app/docs/[...slug]/page.ts  →  /docs/:slug*
```

```ts
export const generateStaticParams = async () => [
  { slug: ["introduction"] },
  { slug: ["core-concepts", "routing"] },
  { slug: ["reference", "api"] },
];
```
