import { test, expect } from '@playwright/test';

test('products: shows product listing and links', async ({ page }) => {
  await page.goto('/products');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('link', { name: /View Red T-Shirt/i })).toBeVisible({ timeout: 10000 });
});
