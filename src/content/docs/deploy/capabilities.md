---
title: Adapter Capabilities
description: Explicit host capability contracts — streaming, filesystem, image runtime, background work, and body size limits
section: Deploy
order: 2
---

# Adapter Capabilities

Since v2.0.2, every deployment host declares an explicit `AdapterCapabilities` object. The framework uses it to decide which features are safe to enable: streaming, filesystem access, runtime image transforms, background work, and body size limits.

Invalid or incompatible capability combinations **fail at build time** with a diagnostic message, instead of producing a broken deployment.

## `AdapterCapabilities`

```ts
import type { AdapterCapabilities } from "@deijose/nix-js-kit/runtime";

interface AdapterCapabilities {
  /** Whether the host supports streaming responses (ReadableStream bodies). */
  streaming: boolean;
  /** Filesystem access model of the host. */
  filesystem: "none" | "readonly" | "persistent" | "ephemeral";
  /** Whether the host can run image transforms at request time. */
  imageRuntime: boolean;
  /** Whether the host allows background work after the response completes. */
  backgroundWork: boolean;
  /** Maximum request body size in bytes accepted by the host (if any). */
  maxBodySize?: number;
}
```

## Default capability presets

Three presets cover the most common host types:

| Preset | Streaming | Filesystem | Image runtime | Background work | Max body |
| --- | --- | --- | --- | --- | --- |
| `DEFAULT_CAPABILITIES` (Node/Bun) | `true` | `persistent` | `true` | `true` | unlimited |
| `SERVERLESS_CAPABILITIES` (Vercel/Netlify) | `true` | `ephemeral` | `false` | `false` | 1 MB |
| `EDGE_CAPABILITIES` (Cloudflare/Deno) | `true` | `readonly` | `false` | `false` | 1 MB |

```ts
import {
  DEFAULT_CAPABILITIES,
  SERVERLESS_CAPABILITIES,
  EDGE_CAPABILITIES,
  createCapabilities,
} from "@deijose/nix-js-kit/runtime";

// Use a preset
const caps = SERVERLESS_CAPABILITIES;

// Or customize
const custom = createCapabilities({
  streaming: true,
  filesystem: "ephemeral",
  imageRuntime: false,
  backgroundWork: false,
  maxBodySize: 5_000_000,
});
```

## `validateCapabilities()`

Validates a capability declaration against the features your app uses. The CLI `adapter` command runs this automatically at build time:

```ts
import { validateCapabilities, SERVERLESS_CAPABILITIES } from "@deijose/nix-js-kit/runtime";

const result = validateCapabilities(SERVERLESS_CAPABILITIES, {
  isr: true,       // requires persistent filesystem
  images: true,    // requires imageRuntime or readable filesystem
  streaming: true, // requires streaming=true
});

if (!result.ok) {
  console.error(result.problems);
  // [
  //   "ISR requires a persistent filesystem; the host declares filesystem=\"ephemeral\".",
  //   "On-demand image transforms require either imageRuntime=true or a readable filesystem; the host has neither."
  // ]
}
```

### Validation rules

| Feature | Requirement |
| --- | --- |
| `isr` | `filesystem` must be `"persistent"` |
| `images` (runtime) | `imageRuntime` must be `true`, or `filesystem` must be `"readonly"` or `"persistent"` |
| `streaming` | `streaming` must be `true` |

## Helper functions

```ts
supportsStreaming(capabilities): boolean
supportsPersistentStorage(capabilities): boolean  // filesystem === "persistent"
supportsWritableFilesystem(capabilities): boolean // "persistent" or "ephemeral"
```

## How adapters use capabilities

Each built-in adapter declares its capabilities:

- **Node adapter** — `DEFAULT_CAPABILITIES` (full filesystem, streaming, image runtime).
- **Bun adapter** — `DEFAULT_CAPABILITIES`.
- **Vercel adapter** — `SERVERLESS_CAPABILITIES` (ephemeral filesystem, no image runtime).
- **Netlify adapter** — `SERVERLESS_CAPABILITIES`.

The framework checks capabilities before enabling features:

- **ISR** — only enabled when `supportsPersistentStorage()` is true.
- **Runtime image transforms** — only enabled when `imageRuntime` is true (or a readable filesystem is available for pre-built variants).
- **Streaming** — `renderStreamingPage` checks `supportsStreaming()`; falls back to buffered responses when false.
- **Background work** — cache cleanup, image processing, etc. are skipped when `backgroundWork` is false.

## Custom adapter capabilities

If you build a custom adapter, declare its capabilities:

```ts
import { createCapabilities, type Adapter } from "@deijose/nix-js-kit";

const myAdapter: Adapter = {
  capabilities: createCapabilities({
    streaming: true,
    filesystem: "readonly",
    imageRuntime: false,
    backgroundWork: false,
    maxBodySize: 500_000,
  }),
  async build(options) {
    // ...
  },
};
```

:::tip
Run `nix-js-kit adapter <name>` to validate capabilities at build time. The command reports any incompatible feature/capability combinations before you deploy.
:::

## Subpath export

```ts
import {
  DEFAULT_CAPABILITIES,
  SERVERLESS_CAPABILITIES,
  EDGE_CAPABILITIES,
  createCapabilities,
  supportsStreaming,
  supportsPersistentStorage,
  supportsWritableFilesystem,
  validateCapabilities,
  type AdapterCapabilities,
  type FilesystemCapability,
  type CapabilityOptions,
  type CapabilityDiagnostics,
} from "@deijose/nix-js-kit/runtime";
```
