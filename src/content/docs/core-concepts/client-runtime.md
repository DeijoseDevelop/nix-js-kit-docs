---
title: Client Runtime
description: Nix.js reactivity — templates, signals, effects, and the building blocks behind every page and island
section: Core Concepts
order: 8
---

# Client Runtime

Nix.js Kit is built on [Nix.js](https://nix-js.dev/), a reactive DOM micro-framework with no virtual DOM. Every page, layout, and island you write is a Nix.js template. Understanding these fundamentals unlocks the rest of the framework.

The entire runtime is **~14 KB** and has zero dependencies.

## Templates with `html`

Templates are tagged template literals. Interpolations are escaped by default — plain values become text nodes, never HTML.

```ts
// src/app/page.ts
import { html } from "@deijose/nix-js";

export default function HomePage() {
  const name = "Nix";
  return html`<h1>Hello, ${name}!</h1>`;
}
```

### Expressions

Any JavaScript expression can be interpolated:

```ts
html`
  <p>${count * 2}</p>
  <p>${items.length > 0 ? `${items.length} items` : "Empty"}</p>
  <p>${formatDate(now)}</p>
`
```

### Attributes and events

Attribute values and event listeners are declared with the same syntax. Function-valued attributes are treated as event listeners and bound with cleanup on dispose:

```ts
html`
  <a href=${`/blog/${slug}`} title=${title}>Read</a>
  <button @click=${() => (count += 1)}>Increment</button>
  <input value=${() => query.value} @input=${(e: Event) => { /* ... */ }} />
`
```

### Partial interpolation in attributes

Concatenations inside an attribute are rewritten automatically by the build pipeline, so this works:

```ts
html`<a href="/blog/${slug}">Read</a>`
```

It is transformed into a single interpolation (`"/blog/" + slug`). Full-value interpolations (`href=${slug}`) are handled natively.

## Signals — reactive state

A signal is a reactive container. Reading it inside a template subscribes that part of the DOM; writing it updates only the affected nodes.

```ts
import { html, signal } from "@deijose/nix-js";

function Counter() {
  const count = signal(0);

  return html`
    <p>Count: ${count}</p>
    <button @click=${() => (count.value += 1)}>+1</button>
  `;
}
```

- `signal(initial)` creates the signal
- `signal.value` reads and writes it
- Updates are tracked automatically — no reconciliation, no diff, no virtual DOM

## Derived state with `computed`

`computed()` memoizes derived values and recomputes only when its dependencies change:

```ts
import { html, signal, computed } from "@deijose/nix-js";

function Cart() {
  const items = signal<number[]>([2, 3, 5]);
  const total = computed(() => items.value.reduce((a, b) => a + b, 0));

  return html`<p>Total: ${total}</p>`;
}
```

## Effects with `effect`

`effect()` runs a callback whenever its signal dependencies change. It returns a dispose function:

```ts
import { signal, effect } from "@deijose/nix-js";

const theme = signal("dark");
const dispose = effect(() => {
  document.documentElement.setAttribute("data-theme", theme.value);
});

// Later, when the subscription is no longer needed:
dispose();
```

Effects created inside islands are disposed automatically when the island is removed during SPA navigation.

## Conditional rendering with `showWhen`

```ts
import { html, signal, showWhen } from "@deijose/nix-js";

function Alert() {
  const visible = signal(false);
  return html`
    ${showWhen(() => visible.value, () => html`<div class="alert">Heads up</div>`)}
  `;
}
```

You can also inline conditional expressions with `html` template functions:

```ts
${() => visible.value ? html`<div class="alert">Heads up</div>` : null}
```

## Lists with `repeat`

`repeat()` renders a keyed list with efficient DOM diffing. Items are keyed by `keyFn` so re-orders, inserts, and removals move existing DOM nodes instead of recreating them:

```ts
import { html, repeat } from "@deijose/nix-js";

function TodoList({ todos }: { todos: { id: number; text: string }[] }) {
  return html`
    <ul>
      ${repeat(
        todos,
        (t) => t.id,
        (t) => html`<li>${t.text}</li>`,
      )}
    </ul>
  `;
}
```

## Refs with `ref`

`ref()` gives you a direct reference to a DOM element after mount:

```ts
import { html, ref } from "@deijose/nix-js";

function Search() {
  const input = ref<HTMLInputElement>();

  const focus = () => input.el?.focus();

  return html`
    <input ref=${input} />
    <button @click=${focus}>Focus</button>
  `;
}
```

## Portals

`portal(template, container)` renders content into a different DOM location — commonly `document.body` to escape overflow clipping. The search modal in this documentation uses a portal for exactly that reason:

```ts
import { html, signal, portal } from "@deijose/nix-js";

function Modal() {
  const open = signal(false);

  return html`
    <button @click=${() => (open.value = true)}>Open</button>
    ${() => open.value ? portal(html`<div class="modal">...</div>`, document.body) : null}
  `;
}
```

## Transitions

`transition()` wraps dynamic content with a mount/exit animation:

```ts
import { html, signal, transition } from "@deijose/nix-js";

function Tabs() {
  const tab = signal("a");
  return html`
    ${transition(() => tab.value, (key) => html`<div class="panel">Panel ${key}</div>`)}
  `;
}
```

`prefers-reduced-motion` is respected automatically by the SPA router's view transitions.

## Where this runs

- **Server (SSG/SSR)**: templates are rendered to HTML by `renderToString` using happy-dom — `html` tags, interpolations, and static branches all work server-side.
- **Client**: the same template code runs directly against the real DOM inside islands, without hydration of the whole tree.

Signal updates after a page has been server-rendered are safe: the render pass disposes subscriptions, so late async writes never touch torn-down DOM.
