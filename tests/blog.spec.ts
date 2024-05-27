import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', {name: 'Posts'})).toBeVisible();
});

test('blog filters', async ({ page }) => {
  await page.goto('/blog');

  let list = page.locator('li');
  await expect(list).toHaveCount(9);

  // click DIY filter
  await page.getByLabel('DIY').click();

  list = page.locator('li')
  await expect(list).toBeLessThan(9)
})

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
