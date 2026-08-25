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

## Layout slots (v2.1.0+)

In addition to `children`, layouts can receive **named slots** from `*.slot.ts` files. This lets you compose multiple content areas (sidebar, header, footer) into a single layout without prop drilling.

### Defining a slot

Create a `*.slot.ts` file next to your `page.ts`. The file name becomes the slot name:

```ts
// src/app/(marketing)/pricing/sidebar.slot.ts
import { html } from "@deijose/nix-js";

export default function PricingSidebar() {
  return html`
    <aside class="pricing-sidebar">
      <h3>Plans</h3>
      <ul>
        <li><a href="#free">Free</a></li>
        <li><a href="#pro">Pro</a></li>
      </ul>
    </aside>
  `;
}
```

### Consuming slots in a layout

The route scanner detects `*.slot.ts` files and passes them to the nearest layout as named slots via `LayoutProps.slots`:

```ts
// src/app/(marketing)/layout.ts
import { html } from "@deijose/nix-js";
import type { LayoutProps } from "@deijose/nix-js-kit";

export default function MarketingLayout({ children, slots }: LayoutProps) {
  return html`
    <html lang="en">
      <body>
        <main id="app">
          <div class="layout">
            <div class="layout-content">${children}</div>
            ${slots.sidebar ?? ""}
          </div>
        </main>
      </body>
    </html>
  `;
}
```

### Slot type

```ts
interface LayoutProps<TData> {
  children: unknown;
  data?: InferLoaderData<TData>;
  slots?: Record<string, unknown>; // named slots from *.slot.ts
}
```

:::tip
Slots are optional — if a page doesn't define a `*.slot.ts` file, the corresponding `slots.<name>` is `undefined`. Use `slots.sidebar ?? ""` to render nothing when the slot is absent.
:::

### Multiple slots

You can define multiple slots per route:

```
src/app/(marketing)/pricing/
  page.ts
  sidebar.slot.ts
  header.slot.ts
```

Each slot is available as `slots.sidebar` and `slots.header` in the layout.

:::note
Slots work with route groups (`(group)`) — the slot is passed to the nearest layout in the chain, including group layouts.
:::
