// ============================================================================
// Docs navigation — builds the sidebar nav tree from content entries
// ============================================================================

import { getDocsCollection, getDocEntry, type DocEntry } from "./content-scan";

export type { DocEntry } from "./content-scan";

export interface DocMeta {
  title: string;
  description: string;
  section: string;
  order: number;
  slug: string;
  draft?: boolean;
}

export interface NavSection {
  title: string;
  items: DocMeta[];
}

// Section display order
const SECTION_ORDER = [
  "Getting Started",
  "Core Concepts",
  "Client",
  "Content",
  "Assets",
  "Server",
  "Tooling",
  "Deploy",
  "Recipes",
  "Reference",
];

export async function getDocsNav(): Promise<NavSection[]> {
  const entries = await getDocsCollection();
  const docs = entries
    .filter((e) => !e.data.draft)
    .map((e) => ({
      title: e.data.title,
      description: e.data.description,
      section: e.data.section,
      order: e.data.order,
      slug: e.slug,
    }));

  const sections: NavSection[] = [];
  const sectionMap = new Map<string, DocMeta[]>();

  for (const doc of docs) {
    const arr = sectionMap.get(doc.section) ?? [];
    arr.push(doc);
    sectionMap.set(doc.section, arr);
  }

  for (const section of SECTION_ORDER) {
    const items = sectionMap.get(section);
    if (!items || items.length === 0) continue;
    items.sort((a, b) => a.order - b.order);
    sections.push({ title: section, items });
  }

  // Add any sections not in SECTION_ORDER at the end
  for (const [section, items] of sectionMap) {
    if (SECTION_ORDER.includes(section)) continue;
    items.sort((a, b) => a.order - b.order);
    sections.push({ title: section, items });
  }

  return sections;
}

export async function getPrevNext(
  slug: string,
): Promise<{ prev?: DocMeta; next?: DocMeta }> {
  const sections = await getDocsNav();
  const flat: DocMeta[] = [];
  for (const s of sections) flat.push(...s.items);

  const idx = flat.findIndex((d) => d.slug === slug);
  if (idx === -1) return {};

  return {
    prev: idx > 0 ? flat[idx - 1] : undefined,
    next: idx < flat.length - 1 ? flat[idx + 1] : undefined,
  };
}

export async function getDocBySlug(
  slug: string,
): Promise<DocEntry | undefined> {
  return await getDocEntry(slug);
}
