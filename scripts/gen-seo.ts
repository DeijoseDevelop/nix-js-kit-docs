// ============================================================================
// Generate sitemap.xml and robots.txt from docs content
// ============================================================================

import { generateSitemap, generateRobots } from "@deijose/nix-js-kit/seo";
import { resolve } from "node:path";
import { getCollection } from "@deijose/nix-js-kit/content";

async function main() {
  const siteUrl = "https://kit.nix-js.dev";
  const outDir = resolve(process.cwd(), "dist");

  const entries = await getCollection("docs");

  // Build URL list: landing + all docs
  const urls: string[] = ["/"];
  for (const entry of entries) {
    if (!entry.data.draft) {
      urls.push(`/docs/${entry.slug}`);
    }
  }

  // Generate sitemap.xml
  const sitemapPath = await generateSitemap({
    siteUrl,
    urls: urls.map((url) => ({
      url,
      changefreq: "weekly" as const,
      priority: url === "/" ? 1.0 : 0.8,
    })),
    outDir,
  });
  console.log(`✓ Generated sitemap.xml (${urls.length} URLs)`);

  // Generate robots.txt
  const robotsPath = await generateRobots({
    siteUrl,
    outDir,
    disallow: ["/_nix-js/", "/search-index.json"],
  });
  console.log("✓ Generated robots.txt");
}

main().catch((err) => {
  console.error("Failed to generate SEO files:", err);
  process.exit(1);
});
