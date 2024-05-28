import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/blog');
  await expect(page).toHaveTitle(/heffner.dev | posts/);

  await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
});

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
