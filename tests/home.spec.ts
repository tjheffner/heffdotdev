import { test, expect, generateReport, goto } from './utils';

test.skip('Home page renders without a11y errors', async ({
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

test('header menu icon jumps to footer menu', async ({ page }) => {
  await page.goto('/');

  const menu = await page.getByText('Site Menu')

  // Click the menu button
  await menu.click()

  // Tab should focus first nav menu item
  await menu.press('Tab')

  await expect(page.getByRole('link', {name: 'Posts'})).toBeFocused()
})
