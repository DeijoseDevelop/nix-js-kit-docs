// ============================================================================
// Copy public/ files to dist/ (the kit's build doesn't do this automatically)
// ============================================================================

import { cp, mkdir, exists } from "node:fs/promises";
import { resolve, join } from "node:path";

async function main() {
  const root = resolve(process.cwd());
  const publicDir = join(root, "public");
  const distDir = join(root, "dist");

  const publicExists = await exists(publicDir);
  if (!publicExists) {
    console.log("No public/ directory found, skipping.");
    return;
  }

  await mkdir(distDir, { recursive: true });
  await cp(publicDir, distDir, { recursive: true });
  console.log("✓ Copied public/ to dist/");
}

main().catch((err) => {
  console.error("Failed to copy public files:", err);
  process.exit(1);
});
