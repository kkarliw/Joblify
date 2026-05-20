/// <reference types="node" />
import { env } from "node:process";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  retries: env.CI ? 2 : 0,
  reporter: [["list"], env.CI ? ["html", { outputFolder: "playwright-report" }] : ["html", { open: "never" }]],
  use: {
    baseURL: env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173",
    trace: env.CI ? "on" : "retain-on-failure",
    headless: true,
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: !env.CI,
    timeout: 120_000,
    env: {
      VITE_API_URL: env.VITE_API_URL || "http://localhost:4000/api",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
