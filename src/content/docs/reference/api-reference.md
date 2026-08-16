---
title: API Reference
description: Complete API reference for @deijose/nix-js-kit
section: Reference
order: 1
---

# API Reference

Complete reference for all exports from `@deijose/nix-js-kit`.

## Main package

### Types

```ts
import type {
  RouteParams,           // Record<string, string | string[]>
  PageProps,             // { data, layoutData?, params, searchParams, form? }
  LayoutProps,           // { children, data? }
  LoadContext,           // { params, searchParams, request? }
  PageDataLoad,          // (ctx: LoadContext) => Promise<TData> | TData
  GenerateStaticParams,  // () => Promise<RouteParams[]> | RouteParams[]
  PageMetadata,          // { title, description, canonical, robots, openGraph, twitter, other }
  OpenGraphMetadata,     // { type, title, description, url, image, siteName, locale }
  TwitterMetadata,       // { card, title, description, image }
  MetadataContext,       // LoadContext & { data? }
  GenerateMetadata,      // (ctx: MetadataContext) => Promise<PageMetadata> | PageMetadata
} from "@deijose/nix-js-kit";
```

### Rendering

```ts
renderToString(factory: () => NixTemplate): Promise<string>
documentShell(options: ShellOptions): string
buildHeadTags(metadata: PageMetadata): string
```

### Build

```ts
build(config: BuildConfig): Promise<BuildResult>
scanRoutes(appDir: string): Promise<ScannedRoutes>
```

### Islands

```ts
island(name: string, component: IslandComponent, props?: object, directive?: IslandDirective): NixTemplate
scanIslands(islandsDir: string): Promise<IslandModule[]>
generateClientEntry(options: GenerateEntryOptions): Promise<void>
```

### SSR

```ts
createSsrServer(options: SsrServerOptions): Promise<SsrServer>
renderPage(options: RenderPageOptions): Promise<RenderPageResult>
renderErrorPage(options: RenderErrorPageOptions): Promise<RenderPageResult>
renderStreamingPage(options: StreamingPageOptions): Promise<string>
renderPageBody(options: RenderPageBodyOptions): Promise<{ body: string; title: string }>
```

### Routing

```ts
matchRoute(pathname: string, routes: PageRoute[]): MatchResult | null
matchApiRoute(pathname: string, routes: ApiRoute[]): ApiMatchResult | null
```

### Actions

```ts
handleActionRequest(request: Request, resolver: ActionResolver, options?: ActionSecurityOptions): Promise<Response>
scanActions(appDir: string): Promise<ActionRegistry>
verifyOrigin(request: Request, options?: OriginCheckOptions): { denied: boolean; reason?: string }
originForbidden(request: Request, options?: OriginCheckOptions): boolean
encodeActionErrorCookie(data: unknown): string
decodeActionErrorCookie(value: string): unknown
setActionErrorCookieHeader(data: unknown): string
clearActionErrorCookieHeader(): string
fail(status: number, data?: unknown): ActionFailure  // or fail(data, status)
redirect(status: number, url: string): RedirectResponse  // or redirect(url, status?)
```

### Cache (ISR)

```ts
getCachedHtml(path: string, cacheDir: string): Promise<CacheEntry | null>
setCachedHtml(path: string, html: string, cacheDir: string, revalidate: number): Promise<void>
clearCache(cacheDir: string): Promise<void>
```

### Images

```ts
image(options: ImageOptions): NixTemplate
processImages(options: PipelineOptions): Promise<ProcessedImage[]>
consumeImageRegistry(): ImageRegistry
isSharpAvailable(): boolean
```

### Middleware

```ts
loadMiddleware(root: string): Promise<LoadedMiddleware | null>
matchesMiddleware(path: string, config: MiddlewareConfig): boolean
runMiddleware(middleware: Middleware, request: Request): MiddlewareResult
streamBoundary(options: StreamBoundaryOptions): NixTemplate
```

### Adapters

```ts
vercelAdapter.build(options: AdapterOptions): Promise<void>
netlifyAdapter.build(options: AdapterOptions): Promise<void>
bunAdapter.build(options: AdapterOptions): Promise<void>
nodeAdapter.build(options: AdapterOptions): Promise<void>
```

### Client router

```ts
startClientRouter(): void
navigateTo(pathname: string, search?: string, push?: boolean): void
```

## Subpath exports

### `@deijose/nix-js-kit/action`

```ts
callAction(name: string, args?: unknown | unknown[], options?: { page?: string }): Promise<unknown>
nixJsAction(name: string, options?: { page?: string }): {
  submit(input: unknown): Promise<unknown>;
  pending: Signal<boolean>;
  error: Signal<Error | null>;
  data: Signal<unknown | null>;
}
```

### `@deijose/nix-js-kit/island`

```ts
hydrateIslands(registry: IslandRegistry): void
```

### `@deijose/nix-js-kit/router`

```ts
startClientRouter(): void
navigateTo(pathname: string, search?: string, push?: boolean): void
```

### `@deijose/nix-js-kit/content`

```ts
defineCollection(def: CollectionDefinition): CollectionDefinition
getCollection<TData>(name: string): Promise<ContentEntry<TData>[]>
getEntry<TData>(collection: string, slug: string): Promise<ContentEntry<TData> | undefined>
getEntries<TData>(collection: string, slugs: string[]): Promise<ContentEntry<TData>[]>
renderEntryHTML(entry: ContentEntry): Promise<string>
renderMarkdown(source: string): Promise<string>
raw(html: string): unknown
parseDocument(source: string): ParsedFrontmatter
parseFrontmatter(raw: string): Record<string, unknown>
splitFrontmatter(source: string): { raw: string; body: string }
setContentRoot(root: string): void
clearContentCache(): void
createValidator(schema: unknown): SchemaValidator
getZod(): unknown
```

### `@deijose/nix-js-kit/image`

```ts
image(options: ImageOptions): NixTemplate
processImages(options: PipelineOptions): Promise<ProcessedImage[]>
consumeImageRegistry(): ImageRegistry
isSharpAvailable(): boolean
```

### `@deijose/nix-js-kit/vite`

```ts
nixJsKit(options?: NixJsKitViteOptions): Plugin[]
```

### `@deijose/nix-js-kit/adapters/vercel`

```ts
vercelAdapter: Adapter
```

### `@deijose/nix-js-kit/adapters/netlify`

```ts
netlifyAdapter: Adapter
```

### `@deijose/nix-js-kit/adapters/bun`

```ts
bunAdapter: Adapter
```

### `@deijose/nix-js-kit/adapters/node`

```ts
nodeAdapter: Adapter
```
