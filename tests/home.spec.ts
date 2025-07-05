import { test, expect, generateReport } from './utils'

test('Home page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/heffner.dev/)
  await expect(page.getByText('Creative technologist passionate about design systems, responsive web design and accessibility.')).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'homepage')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

