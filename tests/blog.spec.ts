import { test, expect, generateReport, goto } from './utils'

test('blog page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await goto(page, '/blog')

  await expect(page).toHaveTitle(/Posts | heffner.dev/)
  await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible()

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    const { errors } = generateReport(accessibilityScanResults, 'blog')
    console.dir(errors, { depth: 5 })
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

// test('blog filters', async ({ page }) => {

// })

// test('blog search', async ({ page }) => {
//
// })
//
// test('see more posts', async ({ page }) => {
//
// })
//
// test('blog post table of contents', async ({ page }) => {
//
// })
