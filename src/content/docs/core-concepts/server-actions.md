---
title: Server Actions
description: Type-safe server functions with CSRF protection and progressive enhancement
section: Core Concepts
order: 5
---

# Server Actions

Server actions are async functions that run on the server and can be called from the client. Create a `page.action.ts` file next to `page.ts`.

## Defining actions

```ts
// src/app/contact/page.action.ts
export async function submitContact(data: { name: string; email: string }) {
  // validate, write to DB, send email, etc.
  await saveContact(data);
  return { ok: true };
}
```

## Calling actions from the client

### `nixJsAction()` — reactive handle

```ts
import { nixJsAction } from "@deijose/nix-js-kit/action";

const contact = nixJsAction("submitContact", { page: "/contact" });

// In a template:
html`
  <form @submit=${(e: Event) => {
    e.preventDefault();
    contact.submit({ name: "Ada", email: "ada@example.com" });
  }}>
    <input name="name" />
    <input name="email" />
    <button type="submit" disabled=${() => contact.pending.value}>
      ${() => (contact.pending.value ? "Sending..." : "Send")}
    </button>
  </form>
  ${() => contact.error.value ? html`<p>${contact.error.value.message}</p>` : null}
  ${() => contact.data.value ? html`<p>Sent!</p>` : null}
`
```

`nixJsAction` returns:

- `submit(input)` — calls the action and updates signals
- `pending` — `Signal<boolean>`, true while running
- `error` — `Signal<Error | null>`
- `data` — `Signal<unknown | null>`, last successful result

### `callAction()` — low-level

```ts
import { callAction } from "@deijose/nix-js-kit/action";

const result = await callAction("submitContact", { name: "Ada" }, { page: "/contact" });
```

## Page scoping

Actions are scoped to their page path. The `page` option avoids name collisions:

```ts
const contact = nixJsAction("submit", { page: "/contact" });
const newsletter = nixJsAction("submit", { page: "/newsletter" });
```

If you omit `page`, the framework falls back to searching all scanned actions by name.

## `fail()` and `redirect()`

```ts
import { fail, redirect } from "@deijose/nix-js-kit";

export async function submitContact(data: { email: string }) {
  if (!data.email.includes("@")) {
    return fail(400, { message: "Invalid email" });
  }

  await saveContact(data);
  return redirect("/thank-you");
}
```

Both helpers accept either argument order:

```ts
fail(400, { message: "..." });  // (status, data)
fail({ message: "..." }, 400);  // (data, status)

redirect("/thank-you");          // (url)
redirect(303, "/thank-you");     // (status, url)
```

## Progressive enhancement

Actions work without JavaScript. Add hidden fields to a plain HTML form:

```html
<form action="/__nix-js/actions" method="POST">
  <input type="hidden" name="__nix_js_action_name" value="submitContact" />
  <input type="hidden" name="__nix_js_action_page" value="/contact" />
  <input name="name" />
  <input name="email" />
  <button type="submit">Send</button>
</form>
```

The server runs the action and redirects back to the referring page. If the client sends `Accept: application/json`, the result is returned as JSON instead.

## CSRF protection

CSRF protection is enabled by default. The server verifies the `Origin` (or `Referer`) header against the `Host` header:

```ts
import { nixJsKit } from "@deijose/nix-js-kit/vite";

nixJsKit({
  actionSecurity: {
    enabled: true,
    allowedOrigins: ["https://my-app.vercel.app"],
    strictOrigin: false,
  },
})
```

See [Security](/docs/security) for full details.

## Error handling

Action errors are stored in an ephemeral cookie (`__nix_js_action_error`) instead of URL params:

1. Action calls `fail(400, { message: "Invalid email" })`
2. Server sets the `__nix_js_action_error` cookie (SameSite=Lax, Max-Age=15s)
3. Server redirects back to the referring page
4. `renderPage` reads the cookie, populates `props.form`
5. Response includes a `Set-Cookie` header that clears the cookie

```ts
// src/app/contact/page.ts
export default function ContactPage({ form }: PageProps) {
  const error = form as { message?: string } | undefined;
  return html`
    <form action="/__nix-js/actions" method="POST">...</form>
    ${() => error?.message ? html`<p class="error">${error.message}</p>` : null}
  `;
}
```

## Action endpoint

The `POST /__nix-js/actions` endpoint is available in every server mode:

- `nix-js-kit dev`
- `nix-js-kit preview`
- `nix-js-kit start`
- All deployment adapters (Vercel, Netlify, Bun, Node)

The action name is resolved against the scanned `page.action.ts` modules and the return value is serialized as JSON.
