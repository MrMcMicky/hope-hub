import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run start -- -H 127.0.0.1 -p ${PORT}`,
    port: PORT,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "playwright-local-secret-32-chars-minimum",
      ...(process.env.DEMO_ADMIN_EMAIL ? { DEMO_ADMIN_EMAIL: process.env.DEMO_ADMIN_EMAIL } : {}),
      ...(process.env.DEMO_ADMIN_PASSWORD ? { DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD } : {}),
      ...(process.env.DEMO_ADMIN_NAME ? { DEMO_ADMIN_NAME: process.env.DEMO_ADMIN_NAME } : {}),
      ...(process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {}),
    },
  },
});
