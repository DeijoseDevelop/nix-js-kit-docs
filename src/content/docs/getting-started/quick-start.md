---
title: Quick Start
description: Build your first Nix.js Kit app in 5 minutes
section: Getting Started
order: 3
---

# Quick Start

This guide walks through building a complete Nix.js Kit app with a page, a data loader, and an interactive island.

## 1. Create the project structure

```text
my-app/
├── src/
│   ├── app/
│   │   ├── layout.ts
│   │   ├── page.ts
│   │   └── page.data.ts
│   └── islands/
│       └── Counter.ts
├── vite.config.ts
└── tsconfig.json
```

## 2. Root layout

```ts
// src/app/layout.ts
import { html } from "@deijose/nix-js";
import type { LayoutProps } from "@deijose/nix-js-kit";

export default function RootLayout({ children }: LayoutProps) {
  return html`
    <html lang="en">
      <body>
        <nav>
          <a href="/">Home</a>
        </nav>
        <main id="app">${children}</main>
      </body>
    </html>
  `;
}
```

## 3. Data loader

```ts
// src/app/page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";

export const load: PageDataLoad = async () => {
  return { title: "Hello Nix.js Kit", count: 42 };
};
```

## 4. Home page

```ts
// src/app/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { island } from "@deijose/nix-js-kit";
import { load } from "./page.data.ts";
import Counter from "../islands/Counter";

export default function HomePage({ data }: PageProps<typeof load>) {
  return html`
    <article>
      <h1>${data.title}</h1>
      <p>The answer is ${data.count}.</p>
      ${island("Counter", Counter, { initial: 0 }, "load")}
    </article>
  `;
}
```

## 5. Interactive island

```ts
// src/islands/Counter.ts
import { html, signal } from "@deijose/nix-js";

export default function Counter({ initial }: { initial: number }) {
  const count = signal(initial);

  return html`
    <div>
      <button @click=${() => count.value--}>−</button>
      <span>${() => count.value}</span>
      <button @click=${() => count.value++}>+</button>
    </div>
  `;
}
```

## 6. Client entry

```ts
// src/entry-client.ts
import { hydrateIslands } from "@deijose/nix-js-kit/island";
import { startClientRouter } from "@deijose/nix-js-kit/router";
import Counter from "./islands/Counter";

hydrateIslands({ Counter });
startClientRouter();
```

:::tip
If you set `islandsDir` in your Vite config, `nix-js-kit build` auto-scans `src/islands/` and generates the entry for you. You don't need to write it manually.
:::

## 7. Run the dev server

```bash
nix-js-kit dev
```

Open `http://127.0.0.1:3000`. You should see your page with a working counter.

## 8. Build for production

```bash
nix-js-kit build
```

This generates:

```text
dist/
├── index.html
└── _nix-js/
    └── entry-client.js
```

## 9. Preview the production build

```bash
nix-js-kit preview
```

## 10. Run the SSR server

```bash
nix-js-kit start
```

The SSR server renders pages on demand and serves static assets from `dist/`.

## Next steps

- [Routing](/docs/core-concepts/routing) — learn about dynamic routes and route groups
- [Islands](/docs/client/islands) — understand hydration directives
- [Server actions](/docs/core-concepts/server-actions) — add interactivity with server-side logic
