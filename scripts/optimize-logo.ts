// ============================================================================
// One-off logo optimization — generates the small topbar logo variants from
// the original PNG (nix-js-logo.png → nix-js-logo-112.webp/png).
// Run: bun run scripts/optimize-logo.ts
// ============================================================================

import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

async function main() {
  const publicDir = resolve(process.cwd(), "public");
  const input = join(publicDir, "nix-js-logo.png");
  const meta = await sharp(input).metadata();
  console.log(`Source: ${meta.width}x${meta.height} ${Math.round(meta.size! / 1024)} KiB`);

  // 112px wide is ~2x the 56px retina topbar size; keeps the file tiny.
  const base = sharp(input).resize(112, 75, { fit: "inside" });

  const webp = join(publicDir, "nix-js-logo-112.webp");
  const png = join(publicDir, "nix-js-logo-112.png");
  await base.webp({ quality: 85 }).toFile(webp);
  await base.png({ compressionLevel: 9 }).toFile(png);

  const w = (await readFile(webp)).length;
  const p = (await readFile(png)).length;
  console.log(`Wrote ${webp.split("/").pop()} (${Math.round(w / 1024)} KiB) and ${png.split("/").pop()} (${Math.round(p / 1024)} KiB)`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
