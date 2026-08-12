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

// The tracker lives in an accordion panel now, so it has to be opened before
// axe will look at it — closed <details> content is hidden and gets skipped.
test('Tracker panel renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/about')

  await page.locator('summary', { hasText: 'recent activity' }).click()
  // the rail loops, so every slide also exists as aria-hidden clones either side
  // of the real row — match the real one or this is a strict-mode violation
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
