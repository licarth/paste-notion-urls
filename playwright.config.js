import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: {
    baseURL: "https://www.notion.so",
    // Re-use auth state saved by `npm run save-auth`
    storageState: "./auth/notion.state.json",
    // Run headed so we can see what's happening
    headless: false,
    viewport: { width: 1280, height: 800 },
    // Bypass CSP so we can inject jQuery + our script
    bypassCSP: true,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
