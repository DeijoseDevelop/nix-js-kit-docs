// ============================================================================
// Content scanner — recursively scans src/content/docs/ for .md files
// (the kit's getCollection only scans flat directories, so we do it ourselves)
// ============================================================================

import { readdir, readFile } from "node:fs/promises";
import { join, basename, relative, extname } from "node:path";
import { setContentRoot, parseDocument } from "@deijose/nix-js-kit/content";
import { resolve } from "node:path";

export interface DocEntry {
  collection: string;
  slug: string;
  data: {
    title: string;
    description: string;
    section: string;
    order: number;
    draft?: boolean;
  };
  body: string;
  filePath: string;
}

let contentRootInitialized = false;
function ensureContentRoot() {
  if (contentRootInitialized) return;
  setContentRoot(resolve(process.cwd(), "src/content"));
  contentRootInitialized = true;
}

async function scanDir(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanDir(path)));
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      files.push(path);
    }
  }
  return files;
}

export async function getDocsCollection(): Promise<DocEntry[]> {
  ensureContentRoot();
  const root = resolve(process.cwd(), "src/content");
  const docsDir = join(root, "docs");

  let files: string[];
  try {
    files = await scanDir(docsDir);
  } catch {
    return [];
  }

  const entries: DocEntry[] = [];
  for (const filePath of files) {
    const relPath = relative(docsDir, filePath);
    const slug = basename(relPath, ".md").replace(/\//g, "/");
    const source = await readFile(filePath, "utf8");
    const { data, body } = parseDocument(source);

    entries.push({
      collection: "docs",
      slug: relPath.replace(/\.md$/, ""),
      data: data as DocEntry["data"],
      body,
      filePath,
    });
  }

  return entries;
}

export async function getDocEntry(
  slug: string,
): Promise<DocEntry | undefined> {
  const entries = await getDocsCollection();
  return entries.find((e) => e.slug === slug);
}
