import { test, expect } from '@playwright/test';

test('account orders shows placed order', async ({ page }) => {
  // create an order directly via API so it appears in order history
  const orderRes = await page.request.post('http://localhost:3005/orders', {
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'default', 'x-user-id': 'guest' },
    data: JSON.stringify({ cartItems: [{ productId: 'prod-1', vendorId: 'vendor-unknown', name: 'Red T-Shirt', price: 19.99, quantity: 1 }], shippingAddress: { street: '123 Test St', city: 'Testville', state: 'TS', zipCode: '00000', country: 'Testland' } }),
  });
  expect(orderRes.status()).toBe(201);
  const json = await orderRes.json();

  // ensure the order is visible from order-service (poll briefly)
  let found = false;
  for (let i = 0; i < 20; i++) {
    const res = await page.request.get('http://localhost:3005/orders', { headers: { 'x-tenant-id': 'default', 'x-user-id': 'guest' } }).catch(() => null);
    if (res && res.ok()) {
      const list = await res.json();
      const arr = list.data || list;
      if (arr.find((o: any) => o.id === json.id)) { found = true; break; }
    }
    await page.waitForTimeout(500);
  }
  if (!found) throw new Error('Order not found in API after polling');

  // ensure the client-facing API also shows the order (poll the Next API) before loading the page
  let clientFound = false;
  for (let i = 0; i < 20; i++) {
    const r = await page.request.get('http://localhost:3000/api/orders').catch(() => null);
    if (r && r.ok()) {
      const list = await r.json();
      const arr = list.data || list || [];
      if (arr.find((o: any) => o.id === json.id)) { clientFound = true; break; }
    }
    await page.waitForTimeout(500);
  }
  if (!clientFound) throw new Error('Order not visible via /api/orders after polling');

  // visit the account orders page and assert the new order is listed
  await page.goto('/account/orders');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByText(json.id)).toBeVisible({ timeout: 15000 });
});
