// ============================================================================
// Layout data loader — loads nav, current doc, TOC, prev/next
// (runs for every page, has access to params)
// ============================================================================

import type { PageDataLoad } from "@deijose/nix-js-kit";
import { jsonLd } from "@deijose/nix-js-kit/seo";
import { getDocsNav, getPrevNext } from "./lib/docs-nav";
import { getDocEntry } from "./lib/content-scan";
import { renderMarkdown } from "./lib/markdown";
import { getInlineCss } from "./lib/inline-css";

const SITE_URL = "https://kit.nix-js.dev";

export const load: PageDataLoad = async ({ params }) => {
  const sections = await getDocsNav();

  // Anti-flash theme script — runs in <head> before body renders
  const headScripts: string[] = [
    "(function(){try{var t=localStorage.getItem('nix-js-kit-docs-theme');if(t){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();",
  ];

  // Inline CSS — all styles in a single <style> in <head>: zero render-blocking
  // requests. Escaped so a stray `</style>` in the CSS cannot break the tag.
  const inlineCss = await getInlineCss();
  const safeCss = inlineCss.replace(/<\/style>/gi, "<\\/style>");

  // Favicon, manifest and inline styles — injected into <head> via headLinks
  const headLinks: string[] = [
    `<style>${safeCss}</style>`,
    '<link rel="icon" type="image/x-icon" href="/ico/favicon.ico" />',
    '<link rel="apple-touch-icon" sizes="180x180" href="/ico/apple-icon-180x180.png" />',
    '<link rel="icon" type="image/png" sizes="32x32" href="/ico/favicon-32x32.png" />',
    '<link rel="icon" type="image/png" sizes="16x16" href="/ico/favicon-16x16.png" />',
    '<link rel="manifest" href="/ico/manifest.json" />',
    '<meta name="theme-color" content="#2d21a6" />',
  ];

  // For the landing page (no slug param), just return sections
  const slugParts = (params as Record<string, unknown>).slug;
  if (!slugParts) {
    // WebSite structured data for the landing page
    headScripts.push(
      jsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Nix.js Kit",
        url: SITE_URL,
        description:
          "Full-stack meta-framework for Nix.js — file-based routing, SSG, SSR, islands, and zero client JS by default.",
      }),
    );
    return {
      headScripts,
      headLinks,
      sections,
      toc: [],
      prev: undefined,
      next: undefined,
      currentSlug: "",
      currentSection: "",
      currentTitle: "Home",
      docHtml: "",
      notFound: false,
    };
  }

  const slug = Array.isArray(slugParts)
    ? slugParts.join("/")
    : (slugParts as string) || "introduction";

  const entry = await getDocEntry(slug);

  if (!entry) {
    return {
      headScripts,
      headLinks,
      sections,
      toc: [],
      prev: undefined,
      next: undefined,
      currentSlug: slug,
      currentSection: "",
      currentTitle: "Not Found",
      docHtml: "",
      notFound: true,
    };
  }

  const { html: docHtml, toc } = await renderMarkdown(entry.body);
  const { prev, next } = await getPrevNext(slug);

  // TechArticle structured data for doc pages
  headScripts.push(
    jsonLd({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: entry.data.title,
      description: entry.data.description,
      articleSection: entry.data.section,
      url: `${SITE_URL}/docs/${slug}`,
      author: {
        "@type": "Person",
        name: "Deiver Vasquez",
      },
      publisher: {
        "@type": "Organization",
        name: "Nix.js Kit",
      },
    }),
  );

  return {
    headScripts,
    headLinks,
    sections,
    toc,
    prev: prev ? { slug: prev.slug, title: prev.title } : undefined,
    next: next ? { slug: next.slug, title: next.title } : undefined,
    currentSlug: slug,
    currentSection: entry.data.section,
    currentTitle: entry.data.title,
    docHtml,
    notFound: false,
  };
};
