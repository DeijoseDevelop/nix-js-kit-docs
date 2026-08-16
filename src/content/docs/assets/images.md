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

## Subpath export

```ts
import { image } from "@deijose/nix-js-kit/image";
```
