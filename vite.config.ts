import { defineConfig } from "vite";
import { nixJsKit } from "@deijose/nix-js-kit/vite";

export default defineConfig({
  plugins: [
    nixJsKit({
      appDir: "src/app",
      islandsDir: "src/islands",
      contentDir: "src/content",
      generatedEntry: ".nix-js/entry-client.ts",
      clientEntry: "/_nix-js/entry-client.js",
      lang: "en",
    }),
  ],
});
