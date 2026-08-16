// ============================================================================
// Landing page — hero with CTAs, feature cards, quick example
// ============================================================================

import { html } from "@deijose/nix-js";
import { raw } from "@deijose/nix-js-kit/content";
import type { PageProps, PageMetadata } from "@deijose/nix-js-kit";
import { getDocsNav, type NavSection } from "./lib/docs-nav";

export const generateMetadata = (): PageMetadata => ({
    title: "Nix.js Kit — Full-stack meta-framework for Nix.js",
    description:
        "File-based routing, SSG, SSR, ISR, islands, content collections, image optimization, middleware, and SPA-like navigation. Zero extra client runtime dependencies.",
    canonical: "https://kit.nix-js.dev/",
    openGraph: {
        type: "website",
        title: "Nix.js Kit — Full-stack meta-framework for Nix.js",
        description:
            "Next.js conventions with Astro-style islands. Zero client JS by default.",
        siteName: "Nix.js Kit",
        url: "https://kit.nix-js.dev/",
        image: "https://kit.nix-js.dev/og-image.png",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "Nix.js Kit — Full-stack meta-framework for Nix.js",
        description:
            "Next.js conventions with Astro-style islands. Zero client JS by default.",
        image: "https://kit.nix-js.dev/og-image.png",
    },
});

interface LandingData {
    sections: NavSection[];
    quickExampleHtml: string;
}

export default function HomePage({ data }: PageProps<unknown>) {
    const d = data as LandingData | undefined;
    const sections = d?.sections ?? [];
    const quickExampleHtml = d?.quickExampleHtml ?? "";

    return html`
        <!-- Hero -->
        <section class="hero">
            <div class="hero-eyebrow">
                Documentation · v1.4.7
            </div>
            <h1>
                Nix<em>.</em>js Kit
            </h1>
            <p class="hero-desc">
                A full-stack meta-framework with Next.js conventions and Astro-style islands. Zero client JS by default — Nix.js stays at ~14KB.
            </p>

            <div class="hero-badges">
                <span class="badge"><span class="badge-dot" style="background:var(--green)"></span> 119 tests passing </span><span class="badge"><span class="badge-dot" style="background:var(--brand-3)"></span> ~14 KB client runtime </span><span class="badge"><span class="badge-dot" style="background:var(--brand-2)"></span> TypeScript 7 </span><span class="badge"><span class="badge-dot" style="background:var(--gold)"></span> Zero dependencies </span>
            </div>

            <div class="hero-actions">
                <a class="btn btn-primary" href="/docs/getting-started/introduction"> Get started → </a>
                <a
                    class="btn btn-outline"
                    href="https://www.npmjs.com/package/@deijose/nix-js-kit"
                    target="_blank"
                >
                    npm package
                </a>
            </div>
        </section>

        <!-- Feature cards -->
        <section style="max-width:1100px;margin:0 auto;padding:0 var(--sp-6) var(--sp-16)">
            <div class="cards">
                <div class="card">
                    <span class="card-icon">📁</span>
                    <div class="card-title">
                        File-based routing
                    </div>
                    <div class="card-desc">
                        <code>page.ts</code>, <code>layout.ts</code>, dynamic routes <code>[slug]</code>, catch-all <code>[...slug]</code>, and route groups <code>(group)</code>.
                    </div>
                </div>
                <div class="card">
                    <span class="card-icon">🏝️</span>
                    <div class="card-title">
                        Islands architecture
                    </div>
                    <div class="card-desc">
                        Hydrate only the interactive components. <code>load</code>, <code>idle</code>, and <code>visible</code> directives.
                    </div>
                </div>
                <div class="card">
                    <span class="card-icon">⚡</span>
                    <div class="card-title">
                        SSG + SSR + ISR
                    </div>
                    <div class="card-desc">
                        Static generation, on-demand SSR, and incremental static regeneration with disk cache and TTL.
                    </div>
                </div>
                <div class="card">
                    <span class="card-icon">🔐</span>
                    <div class="card-title">
                        Server actions
                    </div>
                    <div class="card-desc">
                        Type-safe server functions with CSRF protection, progressive enhancement, and ephemeral error cookies.
                    </div>
                </div>
                <div class="card">
                    <span class="card-icon">📝</span>
                    <div class="card-title">
                        Content layer
                    </div>
                    <div class="card-desc">
                        Typed Markdown collections with YAML frontmatter, optional <code>zod</code> validation, and <code>marked</code> rendering.
                    </div>
                </div>
                <div class="card">
                    <span class="card-icon">🖼️</span>
                    <div class="card-title">
                        Image optimization
                    </div>
                    <div class="card-desc">
                        Responsive <code>image()</code> helper with srcset/sizes. Build-time WebP/AVIF via <code>sharp</code>.
                    </div>
                </div>
                <div class="card">
                    <span class="card-icon">🧭</span>
                    <div class="card-title">
                        SPA router
                    </div>
                    <div class="card-desc">
                        Client-side navigation with prefetch, View Transitions, scroll restoration, and head merge.
                    </div>
                </div>
                <div class="card">
                    <span class="card-icon">🛡️</span>
                    <div class="card-title">
                        Middleware
                    </div>
                    <div class="card-desc">
                        <code>src/middleware.ts</code> with path matchers for auth, redirects, and header injection.
                    </div>
                </div>
                <div class="card">
                    <span class="card-icon">🚀</span>
                    <div class="card-title">
                        Deploy anywhere
                    </div>
                    <div class="card-desc">
                        Adapters for Vercel, Netlify, Bun, and Node. Or run your own server with <code>createSsrServer</code>.
                    </div>
                </div>
            </div>
        </section>

        <!-- Quick example -->
        <section style="max-width:780px;margin:0 auto;padding:0 var(--sp-6) var(--sp-20)">
            <h2 style="text-align:center;margin-bottom:var(--sp-6)">
                Quick example
            </h2>
            <div class="code-block">
                <div class="code-block-head">
                    <span class="code-block-filename">src/app/page.ts</span><span class="code-block-lang">typescript</span>
                </div>
                ${raw(quickExampleHtml)}
            </div>

            <div style="text-align:center;margin-top:var(--sp-8)">
                <a class="btn btn-primary" href="/docs/getting-started/introduction"> Read the docs → </a>
            </div>
        </section>

        <!-- Footer -->
        <footer style="border-top:1px solid var(--border);padding:var(--sp-8) var(--sp-6);text-align:center;color:var(--text-3);font-size:var(--fs-sm)">
            <p>
                Nix.js Kit is open source —
                <a
                    href="https://github.com/DeijoseDevelop/nix-js-kit"
                    target="_blank"
                    rel="noopener"
                >
                    GitHub
                </a
        >
                · <a href="https://www.npmjs.com/package/@deijose/nix-js-kit" target="_blank">npm</a
        > · MIT License
            </p>
        </footer>

        <!-- Theme init -->
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
