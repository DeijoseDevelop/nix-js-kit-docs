---
title: Error Pages
description: Custom 404 and 500 pages
section: Core Concepts
order: 7
---

# Error Pages

Create custom error pages for 404 (not found) and 500 (server error) responses.

## 404 page

```ts
// src/app/404.page.ts
import { html } from "@deijose/nix-js";

export default function NotFoundPage() {
  return html`
    <article>
      <h1>404</h1>
      <p>Page not found.</p>
      <a href="/">Back home</a>
    </article>
  `;
}
```

## 500 page

```ts
// src/app/500.page.ts
import { html } from "@deijose/nix-js";

export default function ErrorPage() {
  return html`
    <article>
      <h1>500</h1>
      <p>Something went wrong.</p>
      <a href="/">Back home</a>
    </article>
  `;
}
```

## When error pages are rendered

| Mode | 404 | 500 |
| --- | --- | --- |
| SSG (`build`) | `dist/404.html` | `dist/500.html` |
| SSR (`start`) | Unmatched routes | Render failures |
| Vite dev | Unmatched routes | Render failures |
| Adapters (Vercel, Netlify, Bun, Node) | Unmatched routes | SSR failures |
| `preview` | Unmatched routes | Render failures |

## Data loaders for error pages

Error pages can have their own data loaders:

```ts
// src/app/404.page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";

export const load: PageDataLoad = async () => {
  return { popularLinks: ["/", "/blog", "/docs"] };
};
```

```ts
// src/app/404.page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { load } from "./404.page.data.ts";

export default function NotFoundPage({ data }: PageProps<typeof load>) {
  return html`
    <article>
      <h1>404</h1>
      <p>Page not found.</p>
      <ul>
        ${data.popularLinks.map((href) => html`<li><a href=${href}>${href}</a></li>`)}
      </ul>
    </article>
  `;
}
```

## `renderErrorPage()`

For custom server setups, use `renderErrorPage()` programmatically:

```ts
import { renderErrorPage } from "@deijose/nix-js-kit";

const html = await renderErrorPage({
  status: 404,
  routes,
  appDir: "./src/app",
});
```

:::note
Error pages receive the same `PageProps` as regular pages, including `params` and `searchParams`.
:::
