import { test, expect, generateReport, goto } from './utils';

test('Work page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await page.goto('/work')

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'work')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})
