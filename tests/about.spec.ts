import { test, expect, generateReport, goto } from './utils'

test('About page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/about')

  await expect(page).toHaveTitle('About | heffner.dev')
  await expect(page.getByText('tanner heffner')).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'about')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

// axe skips hidden content, so the accordion has to be open before it scans.
test('Tracker panel renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/about')

  await page.locator('summary', { hasText: 'recent activity' }).click()
  // the rail loops, so aria-hidden clones of each slide sit either side of the
  // real row. match the real one or the locator hits a strict-mode violation.
  await expect(
    page
      .locator('.hz-carousel-slide:not([aria-hidden="true"])')
      .getByText('Trading in the Zone')
  ).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'tracker')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})
