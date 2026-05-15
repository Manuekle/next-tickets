import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3456',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx next start -p 3456',
    port: 3456,
    timeout: 30000,
    reuseExistingServer: true,
    cwd: process.cwd(),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
