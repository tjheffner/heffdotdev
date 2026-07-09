import { test, expect, generateReport, goto } from './utils'

// Playground routes live under the (nowrapper) layout group, which never sets
// `body.started` (that's only wired up in the (main) layout). Skip waiting for
// it so the page-load helper doesn't time out.
const gotoPlayground = (page, url: string) =>
  goto(page, url, { waitForStarted: false })

test('Playground index renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await gotoPlayground(page, '/playground')

  await expect(page).toHaveTitle('Playground | heffner.dev')
  await expect(
    page.getByRole('heading', { name: 'Playground', level: 1 })
  ).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'playground')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

test('Glowfield playground renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await gotoPlayground(page, '/playground/glowfield')

  await expect(page).toHaveTitle('Glowfield playground')
  await expect(
    page.getByRole('heading', { name: 'Glowfield', level: 1 })
  ).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'playground-glowfield')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

test('Triangles playground renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await gotoPlayground(page, '/playground/triangles')

  await expect(page).toHaveTitle('Triangle Wrangler | heffner.dev')
  await expect(
    page.getByRole('heading', { name: 'Triangle Wrangler', level: 1 })
  ).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'playground-triangles')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})
