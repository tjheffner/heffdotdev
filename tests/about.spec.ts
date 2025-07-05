import { test, expect, generateReport, goto } from './utils'

test('About page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/about')

  await expect(page).toHaveTitle(/About | heffner.dev/)
  await expect(page.getByText('tanner heffner')).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'about')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

test('Tracker page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/about/latest')

  await expect(page).toHaveTitle(/Recent Activity | heffner.dev/)
  await expect(page.getByText('Recent activity')).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'tracker')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})
