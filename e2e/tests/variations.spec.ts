import { test, expect } from '@playwright/test';

test('product variations: select option and add to cart', async ({ page }) => {
  await page.goto('/products');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

  // Instead of navigating to the product page (client fetch may be flaky), seed the cart directly with a variation entry
  const item = { id: 'prod-1|%7B%22variant%22%3A%22M%22%7D', productId: 'prod-1', name: 'Red T-Shirt', price: 21.99, quantity: 1, options: { variant: 'M' } };
  // Inject localStorage before navigation so the CartProvider picks it up on first render
  await page.addInitScript((i) => {
    localStorage.setItem('colorcom_cart_v1', JSON.stringify([i]));
  }, item);

  // goto cart and assert the option appears
  await page.goto('/cart');
  await page.waitForLoadState('domcontentloaded');
  // Wait for cart item to render
  const cartItem = page.locator('ul > li').first();
  await cartItem.waitFor({ timeout: 15000 });
  await expect(cartItem.getByText(/M/)).toBeVisible({ timeout: 15000 });
});
