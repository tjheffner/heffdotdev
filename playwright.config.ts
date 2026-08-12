import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: 2,
  /* No CI worker override: Playwright's default is half the available cores,
   * which is 2 on a standard GitHub runner. Forcing 1 made the suite serial and
   * it ran past the job timeout. 2 is also about as much concurrency as the
   * deployed preview wants — /about fans out to four third-party APIs per
   * request, so piling on more parallel hits invites rate limiting. */

  /* `list` so a CI log shows per-test progress — with html alone the run prints
   * nothing on a non-TTY runner, and a cancelled job is undiagnosable. `html`
   * stays for the uploaded artifact. */
  reporter: process.env.CI ? [['list'], ['html']] : 'html',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Ask /about for fixed activity payloads instead of its four third-party
     * APIs — see about/+page.server.ts. Applies to every request because no
     * other route reads the header, which keeps this to one line instead of a
     * duplicated set of per-browser projects. A production deploy refuses it. */
    extraHTTPHeaders: { 'x-activity-fixtures': '1' },
  },

  /* Locally, boot the dev server so `npm test` is self-contained. In CI we
   * point at a deployed Netlify preview via PLAYWRIGHT_TEST_BASE_URL, so skip
   * starting a server there. */
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        /* Lets the locally-booted server honour the fixture header, so
         * `npm test` needs no setup. Deployed environments opt in themselves. */
        env: { ALLOW_ACTIVITY_FIXTURES: 'true' },
      },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
})
