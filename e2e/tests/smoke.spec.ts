import { test, expect } from '@playwright/test';

test('smoke: browse, add to cart, checkout', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

  const addBtn = page.locator('button', { hasText: 'Add to cart' }).first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();

  // Wait for cart count to update in the header (must be > 0) then navigate to cart
  await expect(page.locator('a', { hasText: 'Cart (' })).toHaveText(/Cart \(([1-9]\d*)\)/, { timeout: 5000 });
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();
  await page.click('text=Proceed to Checkout');
  await expect(page).toHaveURL(/\/checkout/);

  await page.click('text=Place order');
  const result = page.locator('pre');
  await expect(result).toBeVisible({ timeout: 10000 });
  const text = await result.innerText();
  expect(text.length).toBeGreaterThan(0);
  // Accept success (id present) or any non-error object
  expect(/"id"\s*:\s*"?\w+"?/.test(text) || !/"error"/.test(text)).toBeTruthy();
});
