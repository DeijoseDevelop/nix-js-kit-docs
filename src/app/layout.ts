// ============================================================================
// Root layout — docs shell with sidebar, topbar, TOC, prev/next
// ============================================================================

import { html } from "@deijose/nix-js";
import { raw } from "@deijose/nix-js-kit/content";
import type { LayoutProps } from "@deijose/nix-js-kit";
import { getDocsNav, type NavSection } from "./lib/docs-nav";
import { renderMarkdown, type TocItem } from "./lib/markdown";

// Server-safe island marker — emits the same HTML markers as island() but
// without calling document.createElement (which doesn't exist in SSG/Node).
// Supports optional fallback content rendered server-side inside the marker.
function islandMarker(
    name: string,
    props: unknown = {},
    directive = "load",
    fallback = "",
) {
    const escaped = name
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const serialized = JSON.stringify(props ?? null)
        .replace(/</g, "\\u003c").replace(/'/g, "\\u0027");
    return raw(
        `<div data-nix-js-island="${escaped}" data-directive="${directive}" data-props='${serialized}'>${fallback}</div>`,
    );
}

export interface DocsLayoutData {
    sections: NavSection[];
    toc: TocItem[];
    prev?: { slug: string; title: string };
    next?: { slug: string; title: string };
    currentSlug: string;
    currentSection: string;
    currentTitle: string;
}

export default function DocsLayout({
    children,
    data,
}: LayoutProps<DocsLayoutData>) {
    const d = data as DocsLayoutData;
    if (!d) return html`
        <div>
            ${children}
        </div>
    `;

    return html`
        ${raw(
        '<link rel="stylesheet" href="/styles.css" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />',
    )}

        <a href="#main-content" class="skip-link">Skip to content</a>

        <div class="docs-layout">
            <!-- Topbar -->
            <header class="topbar">
                <div class="topbar-left">
                    ${islandMarker("MobileDrawer", {}, "load")}
                    <a href="/" class="topbar-brand">
                    <img src="/nix-js-logo.png" alt="Nix.js Kit" width="28" height="28" style="width:28px;height:28px;object-fit:contain" />
                    <span>Nix<em>.</em>js Kit</span></a><span class="topbar-version">v1.4.6</span>
                </div>

                <div class="topbar-breadcrumb">
                    <span>Docs</span><span class="sep">/</span><span class="sep">${d.currentSection}</span><span class="sep">/</span><span class="current">${d.currentTitle}</span>
                </div>

                <div class="topbar-right">
                    ${islandMarker("Search", {}, "load", '<button class="topbar-icon-btn" aria-label="Search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>')}
                    ${islandMarker("ThemeToggle", {}, "load", '<button class="theme-toggle" aria-label="Toggle theme"><span class="moon">🌙</span><span class="sun">☀</span></button>')}
                    <a
                        class="topbar-link"
                        href="https://github.com/DeijoseDevelop/nix-js-kit"
                        target="_blank"
                        rel="noopener"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                            GitHub
                        </a>
                    </div>
                </header>

                <!-- Sidebar -->
                <aside class="sidebar" id="sidebar" data-scroll-preserve="sidebar">
                    <nav>
                        ${d.sections.map(
        (section) => html`
        <div class="sidebar-group">
            <div class="sidebar-group-title">
                ${section.title}
            </div>
            ${section.items.map(
            (item) => html`
                    <a
                        class=${() =>
                    `sidebar-link${item.slug === d.currentSlug ? " active" : ""}`}
                        href=${`/docs/${item.slug}`}
                    >
                        ${item.title}
                    </a>
                `,
        )}
        </div>
    `,
    )}
                    </nav>
                </aside>

                <!-- Main content -->
                <main class="main" id="main-content">
                    <div class="content-wrapper">
                        <article class="prose">
                            ${children}
                        </article>

                        <!-- Prev/Next -->
                        <nav class="page-footer">
                            ${d.prev
            ? html`
            <a class="page-nav-link" href=${`/docs/${d.prev.slug}`}><span class="page-nav-label">← Previous</span><span class="page-nav-title">${d.prev.title}</span></a>
        `
            : html`
            <span></span>
        `}
                            ${d.next
            ? html`
            <a class="page-nav-link next" href=${`/docs/${d.next.slug}`}><span class="page-nav-label">Next →</span><span class="page-nav-title">${d.next.title}</span></a>
        `
            : html`
            <span></span>
        `}
                        </nav>

                        <a
                            class="edit-link"
                            href=${`https://github.com/DeijoseDevelop/nix-js-kit/edit/main/nix-js-kit-docs/src/content/docs/${d.currentSlug}.md`}
                            target="_blank"
                            rel="noopener"
                        >
                            ✎ Edit this page on GitHub
                        </a>
                    </div>
                </main>

                <!-- TOC -->
                ${d.toc.length > 0
            ? html`
            <aside class="toc">
                <div class="toc-title">
                    On this page
                </div>
                <ul class="toc-list">
                    ${d.toc.map(
                (item) => html`
                          <li>
                              <a class=${() => `toc-link level-${item.level}`} href=${`#${item.slug}`}>${item.text}</a>
                          </li>
                      `,
            )}
                </ul>
            </aside>
        `
            : html`
            <aside class="toc">
            </aside>
        `}
            </div>

            <!-- Code copy event delegation -->
            ${islandMarker("CodeCopy", {}, "load")}

            <!-- Theme init script (no-flash) -->
            <script>
                (function () {
        const stored = localStorage.getItem("nix-js-kit-docs-theme");
        if (stored) {
          document.documentElement.setAttribute("data-theme", stored);
        }
      })();
            </script>
    `;
}
