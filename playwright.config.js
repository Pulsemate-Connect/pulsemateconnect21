// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * PulseMate Playwright E2E Configuration
 *
 * Flows covered:
 *  - Patient: Login → Profile → Search Doctor → Book → Pay → Track Queue
 *  - Doctor:  Login → View Queue → Start Consultation → Complete Consultation
 *  - Reception: Check-In → Call Next → Complete Patient
 *  - Cycles: 100 appointment cycles end-to-end
 */
module.exports = defineConfig({
  testDir: './tests/e2e',

  // Run all tests in each file in parallel
  fullyParallel: false, // appointment cycles need sequential state

  // Fail the build if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // Global test timeout
  timeout: 60_000,

  // Expect timeout for assertions
  expect: { timeout: 10_000 },

  use: {
    // Base URL — frontend dev server
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect traces on retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on retry
    video: 'on-first-retry',

    // Action timeout
    actionTimeout: 15_000,

    // Navigation timeout
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start dev server if needed (comment out if running servers manually)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   cwd: './frontend',
  // },
});
