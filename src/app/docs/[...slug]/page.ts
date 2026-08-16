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

export const generateMetadata = (ctx: {
  data?: DocPageData;
}): PageMetadata => {
  const d = ctx.data;
  if (!d || d.notFound) {
    return { title: "Not Found — Nix.js Kit Docs" };
  }
  return {
    title: `${d.currentTitle} — Nix.js Kit Docs`,
    description: d.currentSection
      ? `${d.currentSection} — Nix.js Kit documentation`
      : "Nix.js Kit documentation",
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
