// ============================================================================
// Inline CSS — reads all style files and outputs a single CSS string
// ============================================================================

import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

export async function getInlineCss(): Promise<string> {
  const root = resolve(process.cwd());
  const stylesDir = join(root, "src", "styles");

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

  return parts.join("\n\n");
}
