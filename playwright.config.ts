import { defineConfig } from "@playwright/test";
export default defineConfig({
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    ...(["chromium", "firefox", "webkit"] as const).flatMap((browserName) =>
      (browserName === "chromium" ? ["mobile"] : ["desktop", "mobile"]).map(
        (view) => ({
          name: browserName + "-" + view,
          testMatch: ["**/layout.spec.ts", "**/reliability.spec.ts"],
          use: {
            browserName,
            viewport:
              view === "mobile"
                ? { width: 390, height: 844 }
                : { width: 1280, height: 720 },
          },
        }),
      ),
    ),
  ],
  testDir: "tests/browser",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    reuseExistingServer: !process.env.CI,
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
  },
});
