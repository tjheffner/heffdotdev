import { test, expect, generateReport, goto } from './utils';

test.skip('Gallery page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await page.goto('/gallery')

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'gallery')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})
