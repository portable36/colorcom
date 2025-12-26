import { test, expect } from '@playwright/test'

test('account: order detail shows metadata and allows copy', async ({ page }) => {
  // create a fake order by calling the order API directly (fallback to seeded localStorage isn't enough for detail)
  const payload = {
    cartItems: [{ productId: 'prod-1', name: 'Red T-Shirt', price: 19.99, quantity: 1, options: { variant: 'M' } }],
    shippingAddress: { fullName: 'Test User', street: '1 Test Rd', city: 'Testville', state: 'TS', zipCode: '00000', country: 'Testland' }
  }
  // call internal API if available
  const res = await page.request.post('/api/orders', { data: payload })
  const body = await res.json()
  const id = body?.id || body?.data?.id
  await page.goto(`/account/orders/${id}`)
  await expect(page.getByText(/Order ID/)).toBeVisible()
  await expect(page.getByText(/Red T-Shirt/)).toBeVisible()
  await expect(page.getByText(/variant/)).toBeVisible()
  // click copy
  await page.click('button:has-text("Copy ID")')
  // clipboard should have id
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toBe(String(id))
})