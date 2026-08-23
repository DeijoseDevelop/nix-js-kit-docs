import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";

async function main() {
  const root = resolve(process.cwd());
  const stylesDir = join(root, "src", "styles");
  const distDir = join(root, "dist");

  const files = [
    "tokens.css",
    "base.css",
    "layout.css",
    "components.css",
    "prose.css",
  ];

  const parts: string[] = [];
  for (const file of files) {
    try {
      const content = await readFile(join(stylesDir, file), "utf8");
      parts.push(content);
    } catch {
      // Skip missing files
    }
  }

  const css = parts.join("\n\n");
  await mkdir(distDir, { recursive: true });
  await writeFile(join(distDir, "styles.css"), css);
  console.log(`✓ Wrote dist/styles.css (${css.length} bytes)`);
}

main().catch((err) => {
  console.error("Failed to write CSS:", err);
  process.exit(1);
});
