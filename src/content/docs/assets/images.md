---
title: Images
description: Responsive image optimization with sharp
section: Assets
order: 1
---

# Images

The `image()` helper generates responsive `<img>` tags with `srcset`, `sizes`, lazy loading, and CLS-preventing dimensions.

## Basic usage

```ts
import { image } from "@deijose/nix-js-kit";

export default function HeroPage() {
  return html`
    ${image({
      src: "/images/hero.jpg",
      alt: "Hero image",
      width: 1920,
      height: 1080,
    })}
  `;
}
```

Generates:

```html
<img
  src="/images/hero.jpg"
  alt="Hero image"
  width="1920"
  height="1080"
  loading="lazy"
  decoding="async"
/>
```

## Responsive srcset

```ts
image({
  src: "/images/hero.jpg",
  alt: "Hero",
  width: 1920,
  height: 1080,
  widths: [640, 1280, 1920],
  sizes: "100vw",
})
```

Generates:

```html
<img
  src="/images/hero.jpg"
  alt="Hero"
  width="1920"
  height="1080"
  srcset="/images/hero-640w.jpg 640w, /images/hero-1280w.jpg 1280w, /images/hero-1920w.jpg 1920w"
  sizes="100vw"
  loading="lazy"
  decoding="async"
/>
```

## Priority (above-the-fold)

```ts
image({
  src: "/images/hero.jpg",
  alt: "Hero",
  width: 1920,
  height: 1080,
  priority: true,
})
```

When `priority: true`:

- `loading="eager"` (instead of `lazy`)
- `fetchpriority="high"` is added

## `ImageOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | — | Image source path (required) |
| `alt` | `string` | — | Alt text (required) |
| `width` | `number` | — | Intrinsic width (required) |
| `height` | `number` | — | Intrinsic height (required) |
| `widths` | `number[]` | — | Width variants for srcset |
| `sizes` | `string` | — | Sizes attribute for srcset |
| `loading` | `"lazy"` \| `"eager"` | `"lazy"` | Loading strategy |
| `decoding` | `"async"` \| `"sync"` | `"async"` | Decoding hint |
| `priority` | `boolean` | `false` | Sets eager + fetchpriority=high |

## Build-time optimization with `sharp`

Install the optional peer dependency:

```bash
bun add sharp
```

When `sharp` is available, `build()` automatically:

1. Processes all images registered via `image()`
2. Generates WebP and AVIF variants at each requested width
3. Hashes file contents for indefinite caching
4. Writes optimized files to the output directory

```ts
import { isSharpAvailable } from "@deijose/nix-js-kit";

if (isSharpAvailable()) {
  console.log("sharp is installed — images will be optimized");
} else {
  console.log("sharp not found — images will pass through unoptimized");
}
```

## Build integration

```ts
import { build } from "@deijose/nix-js-kit";

const result = await build({
  appDir: "./src/app",
  outDir: "./dist",
  imageFormats: ["webp", "avif"],  // default: ["webp", "avif"]
});

console.log(`Processed ${result.imagesProcessed} images`);
```

## Programmatic pipeline

```ts
import { processImages, consumeImageRegistry } from "@deijose/nix-js-kit";

const registry = consumeImageRegistry();
const processed = await processImages({
  registry,
  outDir: "./dist/images",
  formats: ["webp", "avif"],
  widths: [640, 1280, 1920],
});
```

## `getImage()` — single image transform

Since v2.0.2, you can process a single image programmatically without going through the build registry:

```ts
import { getImage } from "@deijose/nix-js-kit/image";

const result = await getImage({
  src: "/images/hero.jpg",
  publicDir: "./public",
  outDir: "./dist/images",
  widths: [640, 1280, 1920],
  formats: ["webp", "avif"],
});

// result.variants: [{ url, width, height, format, size }, ...]
// result.entry: { src, width, height, hash, variants }
```

## `ImageService` — programmatic image API

`createImageService()` gives you a stateful image service with declared capabilities, useful for runtime transforms on serverless/edge hosts:

```ts
import { createImageService } from "@deijose/nix-js-kit/image";

const service = createImageService({
  publicDir: "./public",
  outDir: "./dist/images",
  capabilities: { imageRuntime: true, filesystem: "persistent" },
});

const result = await service.transform({
  src: "/images/hero.jpg",
  widths: [640, 1280],
  formats: ["webp"],
});
```

## Manifest API

The image manifest maps source URLs to their generated variants. Use it to validate markup URLs or inspect what was built:

```ts
import {
  readManifest,
  writeManifest,
  getManifestEntry,
  buildSrcset,
  buildPictureMarkup,
  validateManifestUrls,
  processImageBatch,
} from "@deijose/nix-js-kit/image";

// Read a previously written manifest
const manifest = await readManifest("./dist/images/manifest.json");

// Look up a specific image
const entry = getManifestEntry(manifest, "/images/hero.jpg");

// Build a srcset string from an entry
const srcset = buildSrcset(entry);

// Validate that every URL in your HTML exists in the manifest
validateManifestUrls(html, manifest);
```

## Build hardening (v2.0.2+)

The image pipeline was hardened with several guarantees:

- **SHA-256 transform keys** — variant filenames incorporate a hash of: content digest + normalized transform options + encoder version + naming version. The same request always produces the same URL; different options produce different URLs.
- **Path containment** — source and output paths are validated against `publicDir`/`outDir`. No traversal (`../`), NUL bytes, symlink escape, or Unicode separator tricks.
- **Atomic writes** — variants are written to a temp file then renamed, so partial writes never appear in the output.
- **Single-flight** — concurrent requests for the same transform key share one processing job instead of duplicating work.
- **Bounded concurrency** — a configurable pool (default 4) limits simultaneous sharp transforms.
- **`strict` mode** — when enabled, missing sources or failed transforms **fail the build** instead of silently emitting partial output.

```ts
import { processImages } from "@deijose/nix-js-kit";

await processImages({
  registry,
  outDir: "./dist/images",
  strict: true,        // fail on any error
  concurrency: 8,      // parallel sharp transforms
});
```

:::warning
`strict: true` is recommended for production builds. Without it, a missing source image produces a broken `srcset` entry that browsers silently skip.
:::

## Subpath export

```ts
import { image } from "@deijose/nix-js-kit/image";
```
