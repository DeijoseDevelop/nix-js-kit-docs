---
title: Protected Routes with Auth
description: HttpOnly session cookie, login API, and middleware guarding private pages
section: Recipes
order: 3
---

# Protected Routes with Auth

This recipe protects a dashboard with a session cookie:

- A login **API route** verifies credentials and sets an HttpOnly session cookie
- **Middleware** guards `/dashboard/*` and redirects anonymous visitors to `/login`
- Pages and API routes read the session from the request

No auth library is required — the pattern works with any token store.

## 1. Session helper

```ts
// src/app/lib/session.ts
import { createSign } from "node:crypto";

const SECRET = process.env.SESSION_SECRET!;
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  userId: string;
  name: string;
}

// A signed session token, e.g. "userId.signature"
export function signSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createSign("sha256").update(payload).update(SECRET).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  const expected = createVerify("sha256").update(payload).update(SECRET).digest("base64url");
  if (signature !== expected) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "nix_session";
```

```ts
// src/app/lib/session.ts — imports
import { createSign, createVerify } from "node:crypto";
```

## 2. Login page

The form posts to an **API route** — API handlers return full `Response` objects, so they can set the session cookie:

```ts
// src/app/login/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";

export default function LoginPage({ searchParams }: PageProps) {
  const error = searchParams.get("error");

  return html`
    <h1>Log in</h1>

    ${error ? html`<p class="error">Invalid email or password</p>` : null}

    <form action="/api/login" method="POST">
      <label>Email <input name="email" type="email" required /></label>
      <label>Password <input name="password" type="password" required /></label>
      <button type="submit">Log in</button>
    </form>
  `;
}
```

## 3. The login API route

```ts
// src/app/api/login/route.ts
import { verifyPassword, findUser } from "../../lib/users";
import { signSession, SESSION_COOKIE } from "../../lib/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const user = await findUser(email);
  if (!user || !(await verifyPassword(user, password))) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login?error=1" },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/dashboard",
      "Set-Cookie": `${SESSION_COOKIE}=${signSession({ userId: user.id, name: user.name })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    },
  });
}
```

The plain HTML form posts here, the browser follows the 302, and the HttpOnly cookie is set — no client JavaScript involved.

## 4. Middleware guard

```ts
// src/middleware.ts
import type { Middleware } from "@deijose/nix-js-kit";
import { verifySession, SESSION_COOKIE } from "./src/app/lib/session";

export default (async (request, ctx) => {
  const url = new URL(request.url);

  // Allow the login flow through.
  if (url.pathname === "/login" || url.pathname.startsWith("/api/")) {
    return ctx.next();
  }

  // Only guard /dashboard.
  if (url.pathname.startsWith("/dashboard")) {
    const session = verifySession(request.headers.get("Cookie")?.split(`${SESSION_COOKIE}=`)[1]?.split(";")[0]);
    if (!session) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }
    // Attach the session to loaders via response headers.
    return ctx.next({ headers: { "x-session-user": session.userId } });
  }

  return ctx.next();
}) satisfies Middleware;
```

With `config.matcher`, the same guard can run only for matching paths — see [Middleware](/docs/server/middleware).

## 5. Reading the session in a dashboard page

```ts
// src/app/dashboard/page.data.ts
import type { PageDataLoad } from "@deijose/nix-js-kit";

export const load: PageDataLoad = async ({ request }) => {
  const userId = request?.headers.get("x-session-user");
  const profile = await getUserProfile(userId);
  return { profile };
};
```

```ts
// src/app/dashboard/page.ts
import { html } from "@deijose/nix-js";
import type { PageProps } from "@deijose/nix-js-kit";
import { load } from "./page.data";

export default function DashboardPage({ data }: PageProps<typeof load>) {
  return html`
    <h1>Dashboard</h1>
    <p>Welcome back, ${data.profile.name}!</p>
    <form action="/api/logout" method="POST">
      <button type="submit">Log out</button>
    </form>
  `;
}
```

```ts
// src/app/api/logout/route.ts
import { SESSION_COOKIE } from "../../lib/session";

export function POST() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly`,
    },
  });
}
```

## 6. Reading the session in an API route

```ts
// src/app/api/me/route.ts
import { verifySession, SESSION_COOKIE } from "../../lib/session";

export function GET(request: Request) {
  const token = request.headers
    .get("Cookie")
    ?.split(`${SESSION_COOKIE}=`)[1]?.split(";")[0];
  const session = verifySession(token);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(session);
}
```

## Security notes

- The cookie is `HttpOnly` + `SameSite=Lax`; the token never reaches client JS
- CSRF is handled automatically for **server actions** by the origin check (see [Security](/docs/server/security)); API routes that mutate state should verify the `Origin`/`Referer` header themselves, or rely on SameSite cookies + content-type checks
- Middleware runs before API routes, so the API check above is defense-in-depth
- Use a long random `SESSION_SECRET` and rotate it on deploy

## Flow summary

1. Anonymous user visits `/dashboard` → middleware 302 → `/login?error=1`
2. Form posts to `/api/login` → API route verifies, 302 to `/dashboard` with `Set-Cookie`
3. Browser lands on `/dashboard` with the session cookie → middleware validates → page loads with `x-session-user` header → loader fetches the profile
4. Logout POSTs to `/api/logout`, clears the cookie, redirects to `/login`
