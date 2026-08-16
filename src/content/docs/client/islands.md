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
