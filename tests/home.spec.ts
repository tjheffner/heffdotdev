import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/heffner.dev/);
  await expect(page.getByText('welcome to my page')).toBeVisible();
});

test('dark mode', async ({ page }) => {
  await page.goto('/');

  // Click the dark mode toggle.
  await page.getByRole('button', { name: 'Toggle Dark Mode' }).click();

  await expect(page.locator('html')).toHaveAttribute('class', 'dark');
});
