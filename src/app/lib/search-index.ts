// ============================================================================
// Search index — generates a JSON index for client-side search
// ============================================================================

import { getCollection } from "@deijose/nix-js-kit/content";
import type { DocMeta } from "./docs-nav";

export interface SearchEntry {
  slug: string;
  title: string;
  description: string;
  section: string;
  headings: string[];
  excerpt: string;
}

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const entries = await getCollection<DocMeta>("docs");
  const index: SearchEntry[] = [];

  for (const entry of entries) {
    if (entry.data.draft) continue;

    // Extract headings from body (## and ### lines)
    const headings: string[] = [];
    const lines = entry.body.split("\n");
    for (const line of lines) {
      const m = line.match(/^#{2,3}\s+(.+)$/);
      if (m && m[1]) headings.push(m[1].trim());
    }

    // First 200 chars of body as excerpt (strip markdown)
    const excerpt = entry.body
      .replace(/^---[\s\S]*?---/, "")
      .replace(/[#*`>_~\-\[\]()!]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);

    index.push({
      slug: entry.slug,
      title: entry.data.title,
      description: entry.data.description,
      section: entry.data.section,
      headings,
      excerpt,
    });
  }

  return index;
}
