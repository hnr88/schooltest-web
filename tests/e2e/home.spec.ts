import { expect, test } from '@playwright/test';

test('home page renders with the Schooltest title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Schooltest/i);
});

test('articles page renders the module heading', async ({ page }) => {
  await page.goto('/articles');
  await expect(page.getByRole('heading', { name: /articles/i }).first()).toBeVisible();
});
