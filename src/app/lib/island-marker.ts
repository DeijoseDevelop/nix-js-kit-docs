// ============================================================================
// Server-safe island helper — emits the same markers as island() but without
// calling document.createElement (which doesn't exist in SSG/Node).
// ============================================================================

import { raw } from "@deijose/nix-js-kit/content";
import type { IslandDirective } from "@deijose/nix-js-kit";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeProps(props: unknown): string {
  return JSON.stringify(props ?? null)
    .replace(/</g, "\\u003c")
    .replace(/'/g, "\\u0027");
}

/**
 * Emits an island placeholder marker as raw HTML.
 * On the client, hydrateIslands() finds these markers and mounts the real component.
 * This is the SSG-safe equivalent of island() from the kit.
 */
export function islandMarker(
  name: string,
  props: unknown = {},
  directive: IslandDirective = "load",
) {
  const marker = `<div data-nix-js-island="${escapeHtml(name)}" data-directive="${directive}" data-props='${serializeProps(props)}'></div>`;
  return raw(marker);
}
