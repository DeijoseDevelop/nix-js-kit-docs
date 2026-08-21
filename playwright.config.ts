import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: "bun run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
