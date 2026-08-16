// ============================================================================
// Search island — ⌘K modal with client-side fuzzy search
// Uses portal() to render the modal at document.body level, escaping any
// overflow clipping from the island container.
// ============================================================================

import { html, signal, portal } from "@deijose/nix-js";

interface SearchEntry {
  slug: string;
  title: string;
  description: string;
  section: string;
  headings: string[];
  excerpt: string;
}

function Search() {
  const open = signal(false);
  const query = signal("");
  const results = signal<SearchEntry[]>([]);
  const selectedIdx = signal(0);
  let allEntries: SearchEntry[] = [];

  async function loadIndex() {
    if (allEntries.length > 0) return;
    try {
      const res = await fetch("/search-index.json");
      allEntries = await res.json();
    } catch {
      // In dev, the index might not be available yet
    }
  }

  function filter(q: string): SearchEntry[] {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    const scored: { entry: SearchEntry; score: number }[] = [];
    for (const e of allEntries) {
      let score = 0;
      if (e.title.toLowerCase().includes(lower)) score += 10;
      if (e.section.toLowerCase().includes(lower)) score += 5;
      if (e.description.toLowerCase().includes(lower)) score += 3;
      for (const h of e.headings) {
        if (h.toLowerCase().includes(lower)) score += 2;
      }
      if (e.excerpt.toLowerCase().includes(lower)) score += 1;
      if (score > 0) scored.push({ entry: e, score });
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => s.entry);
  }

  function navigate(slug: string) {
    window.location.href = `/docs/${slug}`;
    open.value = false;
  }

  function focusInput() {
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(".search-input");
      input?.focus();
    });
  }

  // ⌘K / Ctrl+K to open
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open.value = true;
        loadIndex();
        focusInput();
      }
      if (e.key === "Escape") open.value = false;
    });
  }

  return html`
        <button
            class="topbar-icon-btn"
            aria-label="Search"
            @click=${() => {
      open.value = true;
      loadIndex();
      focusInput();
    }}
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
            >
                <circle
                    cx="11"
                    cy="11"
                    r="8"/
                >
                    <line
                        x1="21"
                        y1="21"
                        x2="16.65"
                        y2="16.65"/
                    >
                    </svg>
                </button>

                ${() =>
      open.value
        ? portal(
          html`
                          <div
                              class="search-modal"
                              @mousedown=${(e: MouseEvent) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains("search-modal")) {
                open.value = false;
              }
            }}
                          >
                              <div class="search-panel">
                                  <div class="search-input-wrap">
                                      <span style="color:var(--text-3)">⌕</span>
                                      <input
                                          class="search-input"
                                          type="text"
                                          placeholder="Search docs..."
                                          value=${() => query.value}
                                          @input=${(e: Event) => {
              query.value = (e.target as HTMLInputElement).value;
              results.value = filter(query.value);
              selectedIdx.value = 0;
            }}
                                          @keydown=${(e: KeyboardEvent) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                selectedIdx.value = Math.min(
                  selectedIdx.value + 1,
                  results.value.length - 1,
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                selectedIdx.value = Math.max(
                  selectedIdx.value - 1,
                  0,
                );
              } else if (e.key === "Enter") {
                const r = results.value[selectedIdx.value];
                if (r) navigate(r.slug);
              } else if (e.key === "Escape") {
                open.value = false;
              }
            }}
                                      />
                                      <span style="font-size:11px;color:var(--text-3);border:1px solid var(--border);border-radius:var(--r-sm);padding:1px 5px;font-family:var(--font-mono)"> ESC </span>
                                  </div>
                                  <div class="search-results">
                                      ${() => {
              const r = results.value;
              if (query.value && r.length === 0) {
                return html`
                                              <div class="search-empty">
                                                  No results found
                                              </div>
                                          `;
              }
              if (!query.value) {
                return html`
                                              <div class="search-empty">
                                                  Start typing to search...
                                              </div>
                                          `;
              }
              return r.map(
                (entry: SearchEntry, i: number) => html`
                                              <div
                                                  class=${() =>
                    `search-result${i === selectedIdx.value ? " selected" : ""}`}
                                                  @click=${() => navigate(entry.slug)}
                                              >
                                                  <div class="search-result-section">
                                                      ${entry.section}
                                                  </div>
                                                  <div class="search-result-title">
                                                      ${entry.title}
                                                  </div>
                                                  <div class="search-result-excerpt">
                                                      ${entry.excerpt}
                                                  </div>
                                              </div>
                                          `,
              );
            }}
                                  </div>
                              </div>
                          </div>
                      `,
          document.body,
        )
        : null}
    `;
}

export default Search;
