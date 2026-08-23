import { html } from "@deijose/nix-js";

function CodeCopy() {
  // Use event delegation on document
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains("code-block-copy")) return;

      const block = target.closest(".code-block");
      if (!block) return;
      const pre = block.querySelector("pre");
      if (!pre) return;

      const code = pre.textContent || "";
      navigator.clipboard?.writeText(code).catch(() => { });
      target.classList.add("copied");
      target.textContent = "Copied!";
      setTimeout(() => {
        target.classList.remove("copied");
        target.textContent = "Copy";
      }, 1600);
    });
  }

  return html`
        <!-- CodeCopy: no visual output, event delegation only -->
    `;
}

export default CodeCopy;
