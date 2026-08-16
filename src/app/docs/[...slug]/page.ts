// ============================================================================
// Docs page — renders a Markdown doc entry inside the docs layout
// ============================================================================

import { html } from "@deijose/nix-js";
import { raw } from "@deijose/nix-js-kit/content";
import type {
  PageProps,
  PageMetadata,
  GenerateStaticParams,
} from "@deijose/nix-js-kit";
import { getDocsCollection } from "../../lib/content-scan";
import type { DocsLayoutData } from "../../layout";
import type { load } from "./page.data";

interface DocPageData extends DocsLayoutData {
  docHtml: string;
  notFound: boolean;
}

const SITE_URL = "https://kit.nix-js.dev";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const OG_IMAGE_ALT = "Nix.js Kit — full-stack meta-framework for Nix.js";
const OG_IMAGE_WIDTH = 1731;
const OG_IMAGE_HEIGHT = 909;
const OG_IMAGE_TYPE = "image/jpeg";

export const generateMetadata = (ctx: {
  data?: DocPageData;
}): PageMetadata => {
  const d = ctx.data;
  if (!d || d.notFound) {
    return {
      title: "Not Found — Nix.js Kit Docs",
      canonical: `${SITE_URL}/404`,
      robots: "noindex, follow",
    };
  }
  const slug = d.currentSlug;
  const url = `${SITE_URL}/docs/${slug}`;
  const title = `${d.currentTitle} — Nix.js Kit Docs`;
  const description = d.currentSection
    ? `${d.currentSection} — Nix.js Kit documentation`
    : "Nix.js Kit documentation";
  return {
    title,
    description,
    canonical: url,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Nix.js Kit",
      image: OG_IMAGE,
      imageAlt: OG_IMAGE_ALT,
      imageWidth: OG_IMAGE_WIDTH,
      imageHeight: OG_IMAGE_HEIGHT,
      imageType: OG_IMAGE_TYPE,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image: OG_IMAGE,
      imageAlt: OG_IMAGE_ALT,
    },
  };
};

export const generateStaticParams: GenerateStaticParams = async () => {
  const entries = await getDocsCollection();

  return entries
    .filter((e) => !e.data.draft)
    .map((e) => ({
      slug: e.slug.split("/"),
    }));
};

export default function DocPage({ data }: PageProps<typeof load>) {
  const d = data as DocPageData | undefined;

  if (!d || d.notFound) {
    return html`
        <div style="text-align:center;padding:80px 20px">
            <h1 style="font-size:3rem;color:var(--text-3)">
                404
            </h1>
            <p style="color:var(--text-2);margin:16px 0">
                This documentation page doesn't exist yet.
            </p>
            <a href="/" class="btn btn-primary">Back home</a>
        </div>
    `;
  }

  return html`
        ${raw(d.docHtml || "")}
    `;
}
