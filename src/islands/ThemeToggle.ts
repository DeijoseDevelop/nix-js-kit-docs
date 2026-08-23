import { html } from "@deijose/nix-js";

function ThemeToggle() {
  return html`
        <button
            class="theme-toggle"
            aria-label="Toggle theme"
            @click=${() => {
      const current =
        document.documentElement.getAttribute("data-theme") ??
        (window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("nix-js-kit-docs-theme", next);
    }}
        >
            <span class="moon">🌙</span><span class="sun">☀</span>
        </button>
    `;
}

export default ThemeToggle;
