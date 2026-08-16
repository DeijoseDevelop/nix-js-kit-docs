---
title: API Routes
description: HTTP endpoints with route.ts files
section: Core Concepts
order: 6
---

# API Routes

Create `route.ts` files to handle HTTP requests (REST APIs, webhooks, etc.).

## Basic API route

```ts
// src/app/api/posts/route.ts
import type { RouteHandler } from "@deijose/nix-js-kit";

export const GET: RouteHandler = async ({ request }) => {
  const posts = await getAllPosts();
  return Response.json(posts);
};

export const POST: RouteHandler = async ({ request }) => {
  const body = await request.json();
  const post = await createPost(body);
  return Response.json(post, { status: 201 });
};
```

## Dynamic API routes

```ts
// src/app/api/posts/[slug]/route.ts
export const GET: RouteHandler = async ({ params }) => {
  const post = await getPost(params.slug as string);
  if (!post) return new Response("Not Found", { status: 404 });
  return Response.json(post);
};

export const DELETE: RouteHandler = async ({ params }) => {
  await deletePost(params.slug as string);
  return new Response(null, { status: 204 });
};
```

## Handler signature

```ts
type RouteHandler = (ctx: {
  request: Request;
  params: RouteParams;
}) => Promise<Response> | Response;
```

## Supported methods

Export any of these named functions:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `HEAD`
- `OPTIONS`

## Cookies and auth

Cookies are forwarded to API routes in every server mode:

```ts
export const GET: RouteHandler = async ({ request }) => {
  const session = request.headers.get("Cookie")?.match(/session=([^;]+)/);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUser(session[1]);
  return Response.json({ user });
};
```

## `matchApiRoute()`

For custom server setups, use `matchApiRoute()` to dispatch:

```ts
import { matchApiRoute } from "@deijose/nix-js-kit";

const match = matchApiRoute("/api/posts/123", apiRoutes);
if (match) {
  const handler = match.route.handlers[request.method];
  if (handler) {
    return await handler({ request, params: match.params });
  }
}
```

## Availability

API routes work in:

- `nix-js-kit dev` (Vite dev server)
- `nix-js-kit preview`
- `nix-js-kit start`
- All deployment adapters (Vercel, Netlify, Bun, Node)
