---
title: Pages and Layouts
description: Page components and nested layouts
section: Core Concepts
order: 2
---

# Pages and Layouts

## Pages

Each `page.ts` file exports a default component that receives `PageProps`:

```ts
// src/app/about/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { load } from "./page.data.ts";

export default function AboutPage({ data, params, searchParams }: PageProps<typeof load>) {
  return html`
    <article>
      <h1>${data.title}</h1>
      <p>Query: ${searchParams.get("tab") ?? "default"}</p>
    </article>
  `;
}
```

### `PageProps`

```ts
interface PageProps<TData, TLayout> {
  data: InferLoaderData<TData>;      // loader return value
  layoutData?: InferLoaderData<TLayout>; // nearest layout.data.ts return
  params: RouteParams;               // dynamic segment values
  searchParams: URLSearchParams;     // query string
  form?: unknown;                    // last action result (POST)
}
```

:::tip
`PageProps<typeof load>` automatically infers the data type from your loader — no manual typing needed.
:::

## Layouts

`layout.ts` files wrap all pages in the same directory and below:

```ts
// src/app/layout.ts
import { html } from "@deijose/nix-js";
import type { LayoutProps } from "@deijose/nix-js-kit";

export default function RootLayout({ children }: LayoutProps) {
  return html`
    <html lang="en">
      <body>
        <header><nav>...</nav></header>
        <main id="app">${children}</main>
        <footer>© 2025</footer>
      </body>
    </html>
  `;
}
```

### Nested layouts

Layouts chain automatically. For `src/app/blog/[slug]/page.ts`:

1. `src/app/layout.ts` (root)
2. `src/app/blog/layout.ts` (blog section)

Each layout receives `children` — the rendered output of the next layout or page in the chain.

### `LayoutProps`

```ts
interface LayoutProps<TData> {
  children: unknown;              // child page/layout output
  data?: InferLoaderData<TData>;  // layout.data.ts return value
}
```

## Layout data loaders

`layout.data.ts` provides data to the layout:

```ts
// src/app/layout.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";

export const load: PageDataLoad = async () => {
  return { siteName: "My Blog", nav: ["home", "about", "blog"] };
};
```

```ts
// src/app/layout.ts
import { html } from "@deijose/nix-js";
import type { LayoutProps } from "@deijose/nix-js-kit";
import { load } from "./layout.data.ts";

export default function RootLayout({ children, data }: LayoutProps<typeof load>) {
  return html`
    <html lang="en">
      <body>
        <header><h1>${data.siteName}</h1></header>
        <main id="app">${children}</main>
      </body>
    </html>
  `;
}
```

## HTML attributes

Loaders can return `htmlAttributes` to set attributes on the `<html>` element:

```ts
// src/app/layout.data.ts
export const load = async ({ request }) => {
  const theme = request?.headers.get("Cookie")?.includes("theme=dark")
    ? "dark" : "light";
  return {
    htmlAttributes: { "data-theme": theme },
  };
};
```

## Head scripts

Loaders can return `headScripts` — inline scripts injected into `<head>` that run before the first paint:

```ts
export const load = async ({ request }) => {
  const theme = getThemeFromCookie(request);
  return {
    headScripts: [
      `(function(){document.documentElement.setAttribute('data-theme','${theme}');})();`,
    ],
  };
};
```

:::note
Head scripts are the standard no-flash bootstrap pattern — they run synchronously before the deferred client bundle, preventing theme flashes on static pages.
:::
