import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { getCollection } from "@deijose/nix-js-kit/content";

interface SearchEntry {
  title: string;
  description: string;
  section: string;
  slug: string;
  headings: string[];
  excerpt: string;
}

async function main() {
  const entries = await getCollection("docs");
  const root = resolve(process.cwd());
  const publicDir = join(root, "public");
  await mkdir(publicDir, { recursive: true });

  const searchEntries: SearchEntry[] = entries
    .filter((e) => !e.data.draft)
    .map((entry) => {
      const headings: string[] = [];
      const lines = entry.body.split("\n");
      for (const line of lines) {
        const m = line.match(/^#{2,3}\s+(.+)$/);
        if (m && m[1]) headings.push(m[1].trim());
      }

      const excerpt = entry.body
        .replace(/^---[\s\S]*?---/, "")
        .replace(/^#+\s+.+$/gm, "")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`[^`]+`/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/:::[\w\s]*$/gm, "")
        .replace(/\n+/g, " ")
        .trim()
        .slice(0, 200);

      return {
        title: entry.data.title,
        description: entry.data.description,
        section: entry.data.section,
        slug: entry.slug,
        headings,
        excerpt,
      };
    });

  const outPath = join(publicDir, "search-index.json");
  await writeFile(outPath, JSON.stringify(searchEntries, null, 2));
  console.log(`✓ Generated search-index.json (${searchEntries.length} entries)`);
}

main().catch((err) => {
  console.error("Failed to generate search index:", err);
  process.exit(1);
});
