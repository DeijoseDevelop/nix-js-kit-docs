// ============================================================================
// Home page data — loads nav sections for the landing page
// ============================================================================

import type { PageDataLoad } from "@deijose/nix-js-kit";
import { getDocsNav } from "./lib/docs-nav";
import { highlightCode } from "./lib/markdown";

const quickExampleCode = [
  '// src/app/page.ts',
  'import { html } from "@deijose/nix-js";',
  'import type { PageProps } from "@deijose/nix-js-kit";',
  'import { island } from "@deijose/nix-js-kit";',
  'import { load } from "./page.data.ts";',
  'import Counter from "../islands/Counter";',
  "",
  "export default function HomePage({ data }: PageProps<typeof load>) {",
  "  return html`",
  "    <article>",
  "      <h1>${data.title}</h1>",
  "      <p>The answer is ${data.count}.</p>",
  '      ${island("Counter", Counter, { initial: 0 }, "load")}',
  "    </article>",
  "  `;",
  "}",
].join("\n");

export const load: PageDataLoad = async () => {
  const sections = await getDocsNav();
  const headScripts = [
    "(function(){try{var t=localStorage.getItem('nix-js-kit-docs-theme');if(t){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();",
  ];
  const quickExampleHtml = await highlightCode(quickExampleCode, "typescript");
  return { sections, headScripts, quickExampleHtml };
};
