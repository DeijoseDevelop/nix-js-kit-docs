// ============================================================================
// Markdown pipeline — marked + Shiki + callouts + heading anchors + TOC
// ============================================================================

import { marked } from "marked";
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
} from "shiki";

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  highlighter = await createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: [
      "typescript",
      "tsx",
      "javascript",
      "jsx",
      "bash",
      "json",
      "html",
      "css",
      "yaml",
      "markdown",
      "diff",
      "shell",
    ],
  });
  return highlighter;
}

// CSS variable names that shiki outputs for dual themes
const shikiVars = [
  "--shiki-foreground",
  "--shiki-background",
  "--shiki-token-constant",
  "--shiki-token-string",
  "--shiki-token-comment",
  "--shiki-token-keyword",
  "--shiki-token-number",
  "--shiki-token-boolean",
  "--shiki-token-tag",
  "--shiki-token-punctuation",
  "--shiki-token-function",
  "--shiki-token-operator",
  "--shiki-token-link",
  "--shiki-foreground",
];

export interface TocItem {
  level: number;
  text: string;
  slug: string;
}

export interface RenderResult {
  html: string;
  toc: TocItem[];
}

// ── Custom renderer with Shiki code blocks + heading anchors ──────────────

const renderer = {
  code({ text, lang }: { text: string; lang?: string }): string {
    const language = lang || "text";
    return `<!--CODE_BLOCK:${Buffer.from(text).toString("base64")}:${language}-->`;
  },
};

// ── Callout transform (:::note ... :::) ────────────────────────────────────

function transformCallouts(source: string): string {
  const calloutTypes: Record<string, { cls: string; label: string; icon: string }> = {
    note: { cls: "callout-note", label: "Note", icon: "ℹ" },
    tip: { cls: "callout-tip", label: "Tip", icon: "💡" },
    warning: { cls: "callout-warning", label: "Warning", icon: "⚠" },
    caution: { cls: "callout-danger", label: "Caution", icon: "⛔" },
    danger: { cls: "callout-danger", label: "Danger", icon: "⛔" },
  };

  // Line-based parser (robust where a regex over `\n:::` boundaries is not).
  // The inner body is parsed separately so markdown inside callouts renders.
  const lines = source.split("\n");
  const out: string[] = [];
  let type: string | null = null;
  let title = "";
  let body: string[] = [];

  const flush = () => {
    if (!type) return;
    const c = calloutTypes[type];
    const bodyHtml = marked.parse(body.join("\n"), { async: false }) as string;
    out.push(`<div class="callout ${c.cls}"><div class="callout-title">${c.icon} ${title.trim() || c.label}</div>${bodyHtml}</div>`);
    type = null;
    title = "";
    body = [];
  };

  for (const line of lines) {
    const open = line.match(/^:::(note|tip|warning|caution|danger)(?:\s+(.*))?$/);
    if (open) {
      flush();
      type = open[1];
      title = open[2] ?? "";
      continue;
    }
    if (type !== null && line.trim() === ":::") {
      flush();
      continue;
    }
    if (type !== null) body.push(line);
    else out.push(line);
  }
  flush();

  return out.join("\n");
}

// ── Heading slugifier ──────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ── Heading transform (add id + anchor link + collect TOC) ────────────────

function transformHeadings(html: string, toc: TocItem[]): string {
  return html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/g,
    (_match, levelStr: string, attrs: string, content: string) => {
      const level = parseInt(levelStr, 10);
      // Strip HTML tags from content for the slug
      const text = content.replace(/<[^>]+>/g, "").trim();
      const slug = slugify(text);
      toc.push({ level, text, slug });
      return `<h${level} id="${slug}"${attrs}><a href="#${slug}" class="anchor-link">#</a> ${content}</h${level}>`;
    },
  );
}

// ── Code block transform (replace placeholders with Shiki output) ─────────

async function transformCodeBlocks(html: string): Promise<string> {
  const hl = await getHighlighter();
  const isDark = true; // Default; the client toggles via CSS

  return html.replace(
    /<!--CODE_BLOCK:([A-Za-z0-9+/=]+):([a-zA-Z0-9]+)-->/g,
    (_match, b64: string, lang: string) => {
      const code = Buffer.from(b64, "base64").toString("utf8");
      try {
        const highlighted = hl.codeToHtml(code, {
          lang: lang as BundledLanguage,
          themes: {
            dark: "github-dark",
            light: "github-light",
          },
          defaultColor: "dark",
        });
        return highlighted;
      } catch {
        // Fallback: plain escaped code
        const escaped = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<pre><code>${escaped}</code></pre>`;
      }
    },
  );
}

// ── Standalone code highlighter (for use outside Markdown) ────────────────

export async function highlightCode(
  code: string,
  lang: string = "typescript",
): Promise<string> {
  const hl = await getHighlighter();
  try {
    return hl.codeToHtml(code, {
      lang: lang as BundledLanguage,
      themes: { dark: "github-dark", light: "github-light" },
      defaultColor: "dark",
    });
  } catch {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre><code>${escaped}</code></pre>`;
  }
}

// ── Main render function ───────────────────────────────────────────────────

export async function renderMarkdown(source: string): Promise<RenderResult> {
  const toc: TocItem[] = [];

  marked.use({
    breaks: false,
    gfm: true,
    renderer,
  });

  // First pass: callouts become HTML (inner body parsed separately)
  const withCallouts = transformCallouts(source);

  // Second pass: marked converts MD to HTML (code blocks become placeholders)
  let html = marked.parse(withCallouts, { async: false }) as string;

  // Transform headings (add anchors, collect TOC)
  html = transformHeadings(html, toc);

  // Replace code block placeholders with Shiki-highlighted HTML
  html = await transformCodeBlocks(html);

  return { html, toc };
}
