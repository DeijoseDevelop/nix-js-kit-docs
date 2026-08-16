---
title: Security
description: CSRF protection and action error handling
section: Server
order: 2
---

# Security

Nix.js Kit includes built-in CSRF protection for server actions and a secure error-handling mechanism that avoids leaking sensitive data in URLs.

## CSRF protection

Server actions accept POST requests to `/__nix-js/actions`. Without origin verification, a malicious site could submit forms to your actions on behalf of a logged-in user.

### Origin verification

The `verifyOrigin()` function checks the `Origin` (or `Referer` fallback) header against the `Host` header:

```ts
import { verifyOrigin } from "@deijose/nix-js-kit";

// In a custom server setup
const check = verifyOrigin(request);
if (check.denied) {
  return new Response("Forbidden", { status: 403 });
}
```

### Configuration

Configure CSRF protection via the `actionSecurity` option:

```ts
import { nixJsKit } from "@deijose/nix-js-kit/vite";

export default defineConfig({
  plugins: [
    nixJsKit({
      actionSecurity: {
        enabled: true,          // default: true
        allowedOrigins: [       // additional origins beyond the Host header
          "https://my-app.vercel.app",
          "https://preview.my-app.com",
        ],
        strictOrigin: true,     // reject cross-site requests entirely
      },
    }),
  ],
});
```

For the SSR server:

```ts
import { createSsrServer } from "@deijose/nix-js-kit";

const ssr = await createSsrServer({
  actionSecurity: {
    enabled: true,
    allowedOrigins: ["https://my-app.com"],
  },
});
```

### `OriginCheckOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Enable/disable CSRF checks |
| `allowedOrigins` | `string[]` | `[]` | Additional allowed origins |
| `strictOrigin` | `boolean` | `false` | Reject all cross-site requests |

:::note
When `strictOrigin` is `false` (default), same-site requests are always allowed. When `true`, only same-origin requests pass.
:::

## Action error cookies

When a server action fails (via `fail()`), the error data needs to reach the redirected page so the user can see what went wrong.

### The problem with URL params

Some frameworks put error data in URL query parameters (`?error=...`). This is problematic because:

- URLs are logged by proxies, CDNs, and analytics
- URLs appear in browser history
- Sensitive form data could be exposed

### The solution: ephemeral cookies

Nix.js Kit stores action errors in an ephemeral cookie:

- **Cookie name**: `__nix_js_action_error`
- **SameSite**: `Lax`
- **Max-Age**: 15 seconds
- **HttpOnly**: false (readable by client if needed, but typically consumed server-side)

The flow:

1. User submits a form
2. Action calls `fail(400, { message: "Invalid email" })`
3. Server sets the `__nix_js_action_error` cookie with the error data
4. Server redirects back to the referring page
5. `renderPage` reads the cookie, populates `props.form` with the error
6. The response includes a `Set-Cookie` header that clears the cookie
7. The client router also clears the cookie after consumption

### Accessing errors in pages

```ts
// src/app/contact/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";

export default function ContactPage({ form }: PageProps) {
  const error = form as { message?: string } | undefined;

  return html`
    <form action="/__nix-js/actions" method="POST">
      <input type="hidden" name="__nix_js_action_name" value="submitContact" />
      <input type="hidden" name="__nix_js_action_page" value="/contact" />
      <input name="email" />
      <button type="submit">Send</button>
    </form>
    ${() => (error?.message ? html`<p class="error">${error.message}</p>` : null)}
  `;
}
```

:::tip
The `form` prop is automatically populated from the error cookie. You don't need to read the cookie yourself.
:::

## API reference

### `verifyOrigin(request, options?)`

Returns `{ denied: boolean, reason?: string }`.

### `originForbidden(request, options?)`

Returns `true` if the request should be denied based on origin checks.

### `encodeActionErrorCookie(data)`

Serializes error data for the cookie.

### `decodeActionErrorCookie(value)`

Deserializes error data from the cookie.

### `setActionErrorCookieHeader(data)`

Returns a `Set-Cookie` header string for setting the error cookie.

### `clearActionErrorCookieHeader()`

Returns a `Set-Cookie` header string for clearing the error cookie.

### `ACTION_ERROR_COOKIE`

The cookie name constant: `"__nix_js_action_error"`.
