import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist/_nix-js",
    emptyOutDir: false,
    rollupOptions: {
      input: ".nix-js/entry-client.ts",
      output: {
        entryFileNames: "entry-client.js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash][extname]",
      },
    },
  },
});
