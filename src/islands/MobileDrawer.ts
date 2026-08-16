// ============================================================================
// MobileDrawer island — toggles sidebar visibility on mobile
// ============================================================================

import { html, signal } from "@deijose/nix-js";

function MobileDrawer() {
  const open = signal(false);

  return html`
        <button
            class="topbar-icon-btn menu-btn"
            aria-label="Toggle menu"
            @click=${() => (open.value = !open.value)}
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
                    y2="6"/
                >
                    <line
                        x1="3"
                        y1="12"
                        x2="21"
                        y2="12"/
                    >
                        <line
                            x1="3"
                            y1="18"
                            x2="21"
                            y2="18"/
                        >
                        </svg>
                    </button>
                    ${() =>
      open.value
        ? html`
                          <div class="drawer-backdrop open" @click=${() => (open.value = false)}>
                          </div>
                      `
        : null}
    `;
}

export default MobileDrawer;
