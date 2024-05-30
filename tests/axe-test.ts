// This file contains consistent configuration for a11y tests across other test files.
import { test as base } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createHtmlReport } from 'axe-html-reporter';
import fs from 'fs';

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder
}

// Extend base test by providing "makeAxeBuilder"
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
// so other test files can do import { test, export } from './axe-test'
export { expect } from '@playwright/test'

// Generate an easy readable html report for a given page.
export const generateReport = (accessibilityScanResults, key) => {
  const htmlReport = createHtmlReport({
    results: accessibilityScanResults,
    options: {
      projectKey: 'heffdotdev',
      doNotCreateReportFile: true
    },
  });

  const htmlReportDir = 'test-results/a11y'
  if (!fs.existsSync(htmlReportDir)) {
    fs.mkdirSync(htmlReportDir, { recursive: true })
  }
  fs.writeFileSync(`${htmlReportDir}/${key}.html`, htmlReport)

  return htmlReport
}
