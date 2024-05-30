import { test, expect, generateReport } from './axe-test';

test('blog page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await page.goto('/blog')

  await expect(page).toHaveTitle(/heffner.dev | posts/);
  await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'blog')
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
