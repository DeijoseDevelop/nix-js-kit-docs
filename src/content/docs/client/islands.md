---
title: Islands
description: Interactive components with selective hydration
section: Client
order: 1
---

# Islands

Islands are interactive components that hydrate independently. The rest of the page stays static HTML — zero JavaScript for non-interactive content.

## Creating an island

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

## Using an island in a page

```ts
import { island } from "@deijose/nix-js-kit";
import Counter from "../islands/Counter";

export default function HomePage() {
  return html`
    <article>
      <h1>Counter Demo</h1>
      ${island("Counter", Counter, { initial: 0 }, "load")}
    </article>
  `;
}
```

## `island()` signature

```ts
island(
  name: string,           // registry name (must match hydrateIslands key)
  component: Function,    // the island component
  props?: object,         // props passed to the component
  directive?: "load" | "idle" | "visible" | "only",  // hydration trigger
  options?: {             // (v2.4.3+) SSR strategy and fallback
    ssr?: boolean,        // default true (false when directive is "only")
    fallback?: NixTemplate | string,  // HTML when SSR is skipped or component returns null
  },
)
```

## Hydration directives

| Directive | When it hydrates | SSR? | Best for |
| --- | --- | --- | --- |
| `load` | Immediately | Yes (component runs on server) | Above-the-fold interactivity |
| `idle` | `requestIdleCallback` | Yes (component runs on server) | Below-the-fold, non-critical |
| `visible` | `IntersectionObserver` | Yes (component runs on server) | Comments, widgets, heavy components |
| `only` | Immediately | **No** — client-only | Components using `document`/`window`/`navigator` |

```ts
// Hydrate immediately
island("Search", Search, {}, "load")

// Hydrate when browser is idle
island("Analytics", Analytics, {}, "idle")

// Hydrate when scrolled into view
island("Comments", Comments, { postId: "123" }, "visible")
```

## Client-only islands (`directive: "only"` / `ssr: false`)

Components that access browser-only globals (`document`, `window`,
`navigator`, `localStorage`, ...) in their body — carousels, charts,
third-party widgets — cannot run on the server. Two opt-out mechanisms
are provided, mirroring Astro `client:only` and Next.js
`dynamic(..., { ssr: false })`:

```ts
// Client-only, hydrates on load, empty fallback
island("Carousel", Carousel, { slides }, "only")

// Client-only + fallback HTML (string or NixTemplate)
island("Carousel", Carousel, { slides }, "only", {
  fallback: "<div class=\"skeleton\" />",
})

// Client-only + hydrate when visible (more flexible than "only")
island("Chart", Chart, { data }, "visible", { ssr: false })
```

When SSR is skipped, the component is **never called** on the server —
only `options.fallback` is rendered inside the island marker. The client
hydrates from scratch.

:::note v2.4.4 fix
In v2.4.3, `"only"` islands were skipped on the server (correct) but
**never hydrated on the client** — the hydrator only handled `"load"`,
`"idle"`, and `"visible"`. If you're on v2.4.3, either upgrade to
v2.4.4+ or use `island("Name", Component, props, "load", { ssr: false })`
as a workaround.
:::

### `fallback` option

`options.fallback` accepts a plain string or a `NixTemplate` (reactive,
with signals). It is rendered when:

- SSR is skipped (`"only"` or `ssr: false`), or
- The component returns `null` / `false` / `undefined` during SSR.

```ts
island("Widget", Widget, { id: 1 }, "load", {
  fallback: html`<p class="placeholder">Loading…</p>`,
})
```

### `isSSR()` — environment reads

For components that only need *environment* reads (`window.matchMedia`,
`localStorage`, `navigator.userAgent`), guard the access with `isSSR()`
instead of skipping SSR entirely — this preserves the SSR fallback HTML:

```ts
import { html, signal } from "@deijose/nix-js";
import { isSSR } from "@deijose/nix-js-kit";

function ThemeToggle() {
  const prefersDark = isSSR()
    ? false
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = signal(prefersDark);
  return html`<button @click=${() => (dark.value = !dark.value)}>${() => (dark.value ? "🌙" : "☀")}</button>`;
}

island("ThemeToggle", ThemeToggle, {}, "load")  // SSR works, no "only" needed
```

:::warning `isSSR()` limitation
`isSSR()` is **not** a replacement for `"only"` / `ssr: false`. It only
works for environment reads. `document.querySelectorAll(".slide")` of
the component's own children will **not** work with `isSSR()` because
the DOM is not inserted when the function body runs (neither on the
server nor during hydration). For DOM queries of own children, use
`NixComponent.onMount()` + `ref` — `onMount` runs after the DOM is
inserted, the equivalent of React's `useEffect`.
:::

### SSR errors are not silenced

If an island component throws during SSR (with a directive other than
`"only"` and `ssr` not set to `false`), the error propagates wrapped
with the island name and remediation hints — it is never silently
swallowed. This matches Astro and Next.js, which never `try/catch` to
"auto-detect" client-only components:

```
[nix-js-kit] Island "Carousel" threw during SSR: document is not defined
  If the component accesses browser-only globals (document, window, etc.),
  use directive: "only" or options: { ssr: false } to skip server rendering.
  For environment reads (matchMedia, localStorage, navigator) you may guard
  the access with isSSR() from "@deijose/nix-js-kit".
```

## Hydrating on the client

### Manual entry

```ts
// src/entry-client.ts
import { hydrateIslands } from "@deijose/nix-js-kit/island";
import Counter from "./islands/Counter";

hydrateIslands({ Counter });
```

### Auto island scan

If you set `islandsDir` in your build config, `nix-js-kit build` scans `src/islands/` and generates the entry for you:

```ts
await build({
  appDir: "./src/app",
  islandsDir: "./src/islands",
  generatedEntry: "./.nix-js/entry-client.ts",
});
```

The registry name is the path relative to `islandsDir`:

- `src/islands/Counter.ts` → `"Counter"`
- `src/islands/nav/MobileMenu.ts` → `"nav/MobileMenu"`

## Island disposal

Before the SPA router swaps `#app.innerHTML`, old island effects are disposed via the `__nix_js_island_dispose` marker. This prevents leaked effects and stale DOM writes after navigation.

## `lazyIsland()` — deferred component loading

Since v2.0.2, the generated registry uses a discriminated `{ load }` lazy form so island modules are imported on demand without probing the component function (which could cause side effects or duplicate signal creation):

```ts
import { lazyIsland } from "@deijose/nix-js-kit/island";

const Counter = lazyIsland(() => import("./Counter").then((m) => m.default));

hydrateIslands({ Counter });
```

The `load` function is only called when the island actually hydrates, not at registry construction time. This keeps the initial bundle small and avoids executing component code for islands that never enter the viewport (e.g. `visible` directive).

:::note
The auto-generated entry from `scanIslands` already uses `lazyIsland()` internally. You only need it manually if you write your own entry file.
:::

## HMR (Hot Module Replacement)

Since v2.0.3, the Vite plugin registers `import.meta.hot.accept` on the generated client entry. When you edit an island module:

1. The old island instances are **disposed** (effects cleaned up, DOM detached).
2. The updated module is imported.
3. Islands **re-hydrate from the updated code** without a full page reload.

This means you can tweak an island's template, styles, or signal logic and see the change instantly — navigation count stays unchanged, no full refresh.

:::tip
HMR works with all three directives (`load`, `idle`, `visible`). Islands that haven't hydrated yet will pick up the new code on their next hydration trigger.
:::

## Null and empty islands

If an island component returns `null`, `false`, or `undefined`, hydration treats it as an empty island and **continues hydrating siblings**. The error is reported per-island without crashing global hydration:

```ts
// This won't break other islands on the page
export default function ConditionalWidget({ show }: { show: boolean }) {
  if (!show) return null;
  return html`<div>Visible!</div>`;
}
```

Since v2.4.3, when a component returns `null`/`false`/`undefined` during
SSR, the `options.fallback` is rendered into the marker instead of an
empty string:

```ts
island("ConditionalWidget", ConditionalWidget, { show: false }, "load", {
  fallback: "<p>Not visible</p>",
})
```

## Lower-level APIs

```ts
import { scanIslands, generateClientEntry } from "@deijose/nix-js-kit";

const islands = await scanIslands("./src/islands");
await generateClientEntry({ islands, outFile: "./.nix-js/entry-client.ts" });
```

## Subpath export

```ts
import { hydrateIslands } from "@deijose/nix-js-kit/island";
```

This subpath ensures the client bundle doesn't pull server-only code.
