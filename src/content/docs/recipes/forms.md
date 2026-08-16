---
title: Forms with Server Actions
description: A validated contact form — server action, fail() errors, progressive enhancement, and a reactive island
section: Recipes
order: 2
---

# Forms with Server Actions

This recipe builds a contact form that works **with or without JavaScript**:

- No JS: a plain HTML form posts to the actions endpoint, the server redirects back, and the error appears via `props.form`
- With JS: the same action runs via `nixJsAction` in a small island with pending/error state

## 1. The action

```ts
// src/app/contact/page.action.ts
import { fail, redirect } from "@deijose/nix-js-kit";

export async function submitContact(input: {
  name: string;
  email: string;
  message: string;
}) {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) errors.name = "Name is required";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) {
    errors.email = "Enter a valid email";
  }
  if (input.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  }

  if (Object.keys(errors).length > 0) {
    return fail(400, { errors, values: input });
  }

  await sendMail({ to: "hello@example.com", ...input });
  return redirect("/contact/thanks");
}
```

## 2. The progressive form (no JS)

```ts
// src/app/contact/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";

interface FormError {
  errors?: Record<string, string>;
  values?: { name?: string; email?: string; message?: string };
}

export default function ContactPage({ form }: PageProps) {
  const state = form?.__nix_js_action_error === true ? (form.data as FormError) : undefined;
  const v = state?.values ?? {};

  return html`
    <h1>Contact</h1>

    ${state?.errors
      ? html`<ul class="errors">
          ${Object.entries(state.errors).map(
            ([field, msg]) => html`<li data-field=${field}>${msg}</li>`,
          )}
        </ul>`
      : null}

    <form action="/__nix-js/actions" method="POST" novalidate>
      <input type="hidden" name="__nix_js_action_name" value="submitContact" />
      <input type="hidden" name="__nix_js_action_page" value="/contact" />

      <label>
        Name
        <input name="name" value=${v.name ?? ""} required />
      </label>
      <label>
        Email
        <input name="email" type="email" value=${v.email ?? ""} required />
      </label>
      <label>
        Message
        <textarea name="message" rows="5">${v.message ?? ""}</textarea>
      </label>

      <button type="submit">Send</button>
    </form>
  `;
}
```

With JS disabled, submitting posts the hidden fields to `/__nix-js/actions`. On success the server 303-redirects to `/contact/thanks`; on failure it redirects back with the error cookie, which `renderPage` turns into `props.form`.

## 3. The reactive version (with JS)

The same page upgraded with a tiny island:

```ts
// src/islands/ContactForm.ts
import { html, signal } from "@deijose/nix-js";
import { nixJsAction } from "@deijose/nix-js-kit/action";
import { RedirectResponse } from "@deijose/nix-js-kit";

interface ErrorData {
  errors?: Record<string, string>;
}

function ContactForm({ initial }: { initial: { name: string; email: string } }) {
  const form = nixJsAction("submitContact", { page: "/contact" });
  const name = signal(initial.name);
  const email = signal(initial.email);
  const message = signal("");

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const result = await form.submit({
      name: name.value,
      email: email.value,
      message: message.value,
    });
    // The action returned redirect("/contact/thanks") — follow it.
    if (result instanceof RedirectResponse) {
      location.href = result.location;
    }
  };

  const failure = () => {
    const r = form.data.value;
    return r && !(r instanceof RedirectResponse) ? (r as ErrorData) : undefined;
  };

  return html`
    <form @submit=${onSubmit}>
      <label>
        Name
        <input value=${() => name.value} @input=${(e: Event) => (name.value = (e.target as HTMLInputElement).value)} />
      </label>
      <label>
        Email
        <input value=${() => email.value} @input=${(e: Event) => (email.value = (e.target as HTMLInputElement).value)} />
      </label>
      <label>
        Message
        <textarea @input=${(e: Event) => (message.value = (e.target as HTMLInputElement).value)}></textarea>
      </label>

      <button type="submit" disabled=${() => form.pending.value}>
        ${() => (form.pending.value ? "Sending..." : "Send")}
      </button>

      ${() => {
        const err = failure();
        return err?.errors
          ? html`
              <ul class="errors">
                ${Object.entries(err.errors).map(([, msg]) => html`<li>${msg}</li>`)}
              </ul>
            `
          : null;
      }}
    </form>
  `;
}

export default ContactForm;
```

Render it from the page with the island helper:

```ts
// src/app/contact/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { island } from "@deijose/nix-js-kit";
import ContactForm from "../islands/ContactForm";

export default function ContactPage({ form }: PageProps) {
  return html`
    <h1>Contact</h1>
    ${island("ContactForm", ContactForm, { initial: { name: "", email: "" } }, "load")}
  `;
}
```

The `nixJsAction` handle exposes `pending`, `error`, and `data` signals, so the UI updates reactively with no page reload and no manual DOM manipulation.

## 4. The success page

```ts
// src/app/contact/thanks/page.ts
import { html } from "@deijose/nix-js";

export default function ThanksPage() {
  return html`
    <h1>Thanks!</h1>
    <p>Your message is on its way. <a href="/contact">Send another</a></p>
  `;
}
```

## Key points

- One action serves both transports — the HTML form and the island call the exact same code path
- `fail()` data is relayed through an HttpOnly cookie, never the URL
- `redirect()` returns a `303` for form posts
- CSRF origin checks run automatically before the action executes (see [Security](/docs/server/security))
