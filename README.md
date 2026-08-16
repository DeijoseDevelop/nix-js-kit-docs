# Nix.js Kit Docs

Official documentation site for [@deijose/nix-js-kit](https://github.com/DeijoseDevelop/nix-js-kit) — a full-stack meta-framework built on [Nix.js](https://github.com/DeijoseDevelop/nix-js-microframework).

## Overview

This documentation site is **built with the kit itself**, dogfooding every feature:

- **SSG** — 26 static HTML pages generated at build time
- **File-based routing** — `src/app/` with layouts, pages, and data loaders
- **Content collections** — 25 Markdown docs in `src/content/docs/`
- **Islands** — Search (⌘K), ThemeToggle, MobileDrawer, CodeCopy
- **Zero client JS by default** — only islands ship JavaScript (~26KB total)
- **SPA navigation** — client-side router with prefetch, View Transitions, and scroll restoration
- **Syntax highlighting** — Shiki with dual themes (github-dark / github-light)
- **SEO** — sitemap.xml, robots.txt, JSON-LD structured data, OpenGraph metadata
- **Anti-flash** — inline theme script in `<head>`, styles hoisted across navigations

## Tech Stack

- [Nix.js](https://github.com/DeijoseDevelop/nix-js-microframework) — reactive UI primitives (signals, no virtual DOM)
- [Nix.js Kit](https://github.com/DeijoseDevelop/nix-js-kit) — meta-framework (routing, SSG, islands, content)
- [Shiki](https://shiki.style) — syntax highlighting
- [Marked](https://marked.js.org) — Markdown parser
- [Bun](https://bun.sh) — package manager and runtime

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server (http://localhost:3000)
bun dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
nix-js-kit-docs/
├── public/                 # Static assets (logo, favicons, search index)
├── scripts/
│   ├── gen-search-index.ts # Generate search-index.json from content
│   ├── gen-seo.ts          # Generate sitemap.xml and robots.txt
│   ├── copy-css.ts         # Concatenate CSS into dist/styles.css
│   └── copy-public.ts      # Copy public/ to dist/
├── src/
│   ├── app/
│   │   ├── layout.ts       # Root layout (topbar, sidebar, TOC)
│   │   ├── layout.data.ts  # Layout data loader (nav, TOC, JSON-LD)
│   │   ├── page.ts         # Landing page
│   │   ├── page.data.ts    # Landing page data
│   │   ├── 404.page.ts     # Custom 404
│   │   ├── docs/[...slug]/ # Dynamic doc route
│   │   └── lib/            # Helpers (content scan, markdown, nav)
│   ├── content/docs/       # 25 Markdown documentation pages
│   ├── islands/            # Client islands (Search, ThemeToggle, etc.)
│   ├── styles/             # Design system (tokens, base, layout, components, prose)
│   └── entry-client.ts     # Island hydration + SPA router bootstrap
├── vercel.json             # Vercel deployment config
└── package.json
```

## Deploy

### Vercel

1. Import this repo on [Vercel](https://vercel.com)
2. Framework Preset: **Other**
3. Build Command: `bun run build`
4. Output Directory: `dist`
5. Install Command: `bun install`

The `vercel.json` already has these settings configured.

### Any static host

```bash
bun run build
# Deploy the dist/ folder to any static host (Netlify, Cloudflare Pages, GitHub Pages, etc.)
```

## Documentation Content

25 pages across 8 sections:

- **Getting Started** — Introduction, Installation, Quick Start, Project Structure
- **Core Concepts** — Routing, Pages & Layouts, Data Loading, Rendering Modes, API Routes, Server Actions, Error Pages
- **Client** — Islands, SPA Router, Metadata
- **Content** — Content Layer
- **Assets** — Images
- **Server** — SSR Server, Middleware, Security
- **Tooling** — CLI, Vite Plugin
- **Deploy** — Adapters
- **Reference** — API Reference, Comparison, Upgrade Guide

## License

MIT
