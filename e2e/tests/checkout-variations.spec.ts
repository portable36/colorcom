import { test, expect } from '@playwright/test';

test('checkout: place order with variation options and see confirmation', async ({ page }) => {
  // Seed cart with variation item
  const item = { id: 'prod-1|%7B%22variant%22%3A%22M%22%7D', productId: 'prod-1', name: 'Red T-Shirt', price: 21.99, quantity: 1, options: { variant: 'M' } };
  await page.addInitScript((i) => {
    localStorage.setItem('colorcom_cart_v1', JSON.stringify([i]));
  }, item);

  // Navigate to checkout
  await page.goto('/checkout');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();

  // Click place order and wait for redirect to confirmation
  await page.getByRole('button', { name: /Place order/i }).click();

  // Wait for the confirmation page to show an order id
  await page.waitForURL(/\/checkout\/confirmation\?id=.*/);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByText(/Order ID:/)).toBeVisible({ timeout: 15000 });

  // Metadata should include our variant
  await expect(page.getByText(/"variant":\s*"M"/)).toBeVisible({ timeout: 15000 });
});