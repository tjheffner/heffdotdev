import { test, expect, generateReport } from './axe-test';

test('Home page renders without a11y errors', async ({
  page,
  makeAxeBuilder,
}) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/heffner.dev/);
  await expect(page.getByText('welcome to my page')).toBeVisible();

  const accessibilityScanResults = await makeAxeBuilder().analyze()

  if (accessibilityScanResults.violations.length > 0) {
    generateReport(accessibilityScanResults, 'homepage')
  }

  expect(accessibilityScanResults.violations.length).toEqual(0)
})

test('dark mode toggle', async ({ page }) => {
  await page.goto('/');

  // Click the dark mode toggle.
  await page.getByRole('button', { name: 'Toggle Dark Mode' }).click();

  await expect(page.locator('html')).toHaveAttribute('class', 'dark');
});
