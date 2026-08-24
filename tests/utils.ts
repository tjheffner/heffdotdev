/* Shared a11y test setup, used by the other test files. */
import { test as base, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createHtmlReport } from 'axe-html-reporter'
import fs from 'fs'

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder
}

// Extends Playwright's base test with "makeAxeBuilder", so every test file gets
// the same AxeBuilder setup.
export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use, testInfo) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
      ])

    await use(makeAxeBuilder)
  },
})

// Re-exported so test files can import { test, expect } from './utils'
export { expect } from '@playwright/test'

// Generate readable report outputs for a given check.
export const generateReport = (accessibilityScanResults, key) => {
  const htmlReport = createHtmlReport({
    results: accessibilityScanResults,
    options: {
      projectKey: 'heffdotdev',
      doNotCreateReportFile: true,
    },
  })

  // test-results is gitignored
  const htmlReportDir = 'test-results/a11y'
  if (!fs.existsSync(htmlReportDir)) {
    fs.mkdirSync(htmlReportDir, { recursive: true })
  }
  fs.writeFileSync(`${htmlReportDir}/${key}.html`, htmlReport)

  const errors = accessibilityScanResults.violations.map((v) => {
    return {
      issue: v.id,
      count: v.nodes.length,
      description: v.description,
      errors: v.nodes.map((n) => {
        return {
          html: n.html,
          impact: n.impact,
          target: n.target,
          summary: n.failureSummary,
        }
      }),
    }
  })

  return {
    htmlReport,
    errors,
  }
}

// gives sveltekit a chance to hydrate before playwright starts testing
export const goto = async (
  page: Page,
  url: string,
  opts?: { waitForStarted?: boolean }
) => {
  await page.goto(url)
  if (opts?.waitForStarted !== false) {
    await page.waitForSelector('body.started', { timeout: 5000 })
  }
}
