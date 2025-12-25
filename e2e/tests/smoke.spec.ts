import { test, expect } from '@playwright/test';

test('smoke: browse, add to cart, checkout', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

  const addBtn = page.locator('button', { hasText: 'Add to cart' }).first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();

  // Confirm cart was persisted to localStorage then navigate to cart
  await page.waitForFunction(() => !!localStorage.getItem('colorcom_cart_v1'));
  const stored = await page.evaluate(() => localStorage.getItem('colorcom_cart_v1'));
  if (!stored) throw new Error('Cart not persisted to localStorage');
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
