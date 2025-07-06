/* This file contains consistent configuration for a11y tests across other test files. */
import { test as base, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createHtmlReport } from 'axe-html-reporter'
import fs from 'fs'

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder
}

// Extend Playwright's base test by providing "makeAxeBuilder"
//
// This new "test" can be used in multiple test files, and each of them will get
// a consistently configured AxeBuilder instance.
export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use, testInfo) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
      ])
    // .exclude('#commonly-reused-element-with-known-issue');

    await use(makeAxeBuilder)
  },
})

// Exported here for convenience
// so other test files can do import { test, export } from './utils'
export { expect } from '@playwright/test'

// Generate readable report outputs for a given check.
export const generateReport = (accessibilityScanResults, key) => {
  // axe-html-reporter builds a nice page, use that.
  const htmlReport = createHtmlReport({
    results: accessibilityScanResults,
    options: {
      projectKey: 'heffdotdev',
      doNotCreateReportFile: true,
    },
  })

  // write report to file. test-results is gitignored
  const htmlReportDir = 'test-results/a11y'
  if (!fs.existsSync(htmlReportDir)) {
    fs.mkdirSync(htmlReportDir, { recursive: true })
  }
  fs.writeFileSync(`${htmlReportDir}/${key}.html`, htmlReport)

  // create useful json object
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
