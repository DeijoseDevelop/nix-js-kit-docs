// ============================================================================
// MobileDrawer island — toggles sidebar visibility on mobile
// Opens/closes the real #sidebar element (outside this island), locks page
// scroll while open, and closes on backdrop click or Escape.
// ============================================================================

import { html, signal } from "@deijose/nix-js";

function MobileDrawer() {
  const open = signal(false);

  // Clear any stale drawer state after client-side navigation
  if (typeof document !== "undefined") {
    document.body.classList.remove("drawer-open");
  }

  const setOpen = (next: boolean) => {
    open.value = next;
    const sidebar = document.getElementById("sidebar");
    sidebar?.classList.toggle("open", next);
    document.body.classList.toggle("drawer-open", next);
    if (next) {
      document.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") setOpen(false);
        },
        { once: true },
      );
    }
  };

  return html`
        <button
            class="topbar-icon-btn menu-btn"
            aria-label="Toggle menu"
            aria-expanded=${() => String(open.value)}
            @click=${() => setOpen(!open.value)}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
            >
                <line
                    x1="3"
                    y1="6"
                    x2="21"
                    y2="6"
                />
                <line
                    x1="3"
                    y1="12"
                    x2="21"
                    y2="12"
                />
                <line
                    x1="3"
                    y1="18"
                    x2="21"
                    y2="18"
                />
            </svg>
        </button>
        ${() =>
      open.value
        ? html`
                            <div
                                class="drawer-backdrop open"
                                @click=${() => setOpen(false)}
                            >
                            </div>
                        `
        : null}
    `;
}

export default MobileDrawer;
