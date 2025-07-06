import { test, expect, generateReport, goto } from './utils'

test('Gallery page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/gallery')

  await expect(page).toHaveTitle(/Gallery | heffner.dev/)

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'gallery')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})
