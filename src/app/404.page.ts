import { html } from "@deijose/nix-js";

export default function NotFoundPage() {
  return html`
    <div style="text-align:center;padding:120px 20px">
      <h1 style="font-size:4rem;color:var(--text-3);margin-bottom:16px">404</h1>
      <p style="color:var(--text-2);font-size:1.125rem;margin-bottom:32px">
        Page not found.
      </p>
      <a href="/" class="btn btn-primary">Back home →</a>
    </div>
  `;
}
