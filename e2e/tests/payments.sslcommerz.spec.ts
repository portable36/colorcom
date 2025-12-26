import { test, expect } from '@playwright/test';

// Flow:
// 1. Intercept POST /api/payments/sslcommerz/initiate and return a fake redirect with order id
// 2. Intercept navigation to the fake payment page (we just stub redirect)
// 3. After initiating payment, simulate calling the IPN endpoint to mark order paid
// 4. Visit confirmation page and assert status 'paid' is shown

test('checkout triggers SSLCommerz initiate and IPN marks order paid', async ({ page, request }) => {
  // Start with a seeded order by stubbing the initiate response
  let createdOrderId: string | null = null;

  await page.route('**/api/payments/sslcommerz/initiate', async (route) => {
    const post = await route.request().postDataJSON();
    // emulate that server created an order with id
    createdOrderId = `order-test-${Date.now()}`;
    const fakeRedirect = `https://fake-gateway.example/pay?orderId=${createdOrderId}`;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ redirectUrl: fakeRedirect, order: { id: createdOrderId, finalTotal: post.amount } }) });
  });

  // Stub the hosted payment page navigation to avoid leaving test
  await page.route('https://fake-gateway.example/**', async (route) => {
    // Immediately redirect back to the return URL with a simulated success
    const url = new URL(route.request().url());
    const orderId = url.searchParams.get('orderId');
    const returnUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/checkout/confirmation?id=${orderId}`;
    await route.fulfill({ status: 200, contentType: 'text/html', body: `<html><head><meta http-equiv="refresh" content="0;url=${returnUrl}"/></head><body>Redirecting...</body></html>` });
  });

  // Go to checkout, seed a cart via query to keep test deterministic
  await page.goto('/checkout?seed=demo');

  // Fill shipping
  await page.fill('input[aria-label="Full name"]', 'Test User');
  await page.fill('input[aria-label="Street"]', '123 Market St');
  await page.fill('input[aria-label="City"]', 'Dhaka');
  await page.fill('input[aria-label="Zip / Postal"]', '1205');
  await page.fill('input[aria-label="Country"]', 'Bangladesh');
  await page.click('button:has-text("Continue to payment")');

  // Fill payment (dummy card fields are not used since we redirect)
  await page.fill('input[aria-label="Name on card"]', 'Test User');
  await page.fill('input[aria-label="Card number"]', '4242424242424242');
  await page.fill('input[aria-label="Expiry (MM/YY)"]', '12/30');
  await page.fill('input[aria-label="CVV"]', '123');
  await page.click('button:has-text("Continue to review")');

  // Place order, which should call our initiate route and then navigate to the fake gateway which redirects back
  await Promise.all([
    page.waitForNavigation({ url: `**/checkout/confirmation?id=*` }),
    page.click('button:has-text("Place order")'),
  ]);

  // At this point, the order was created and the confirmation page loaded with order id
  // Before asserting, simulate IPN that marks the order as paid
  if (!createdOrderId) throw new Error('No order created during initiate');

  const ipnRes = await request.post('/api/payments/sslcommerz/ipn', { data: { tran_id: createdOrderId, status: 'VALID' } });
  expect(ipnRes.ok()).toBeTruthy();

  // Reload confirmation page to pick up latest status
  await page.goto(`/checkout/confirmation?id=${createdOrderId}`);

  // Assert that status shows 'paid' (or similar) and order ID is displayed
  await expect(page.locator('text=Order ID')).toContainText(createdOrderId);
  await expect(page.locator('text=Status')).toContainText(/paid/i);
});
