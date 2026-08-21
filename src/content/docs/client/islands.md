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
  directive?: "load" | "idle" | "visible",  // hydration trigger
)
```

## Hydration directives

| Directive | When it hydrates | Best for |
| --- | --- | --- |
| `load` | Immediately | Above-the-fold interactivity |
| `idle` | `requestIdleCallback` | Below-the-fold, non-critical |
| `visible` | `IntersectionObserver` | Comments, widgets, heavy components |

```ts
// Hydrate immediately
island("Search", Search, {}, "load")

// Hydrate when browser is idle
island("Analytics", Analytics, {}, "idle")

// Hydrate when scrolled into view
island("Comments", Comments, { postId: "123" }, "visible")
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
