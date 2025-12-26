import { test, expect } from '@playwright/test'

test('checkout: multi-step flow and confirmation', async ({ page }) => {
  // seed cart
  await page.addInitScript(() => {
    localStorage.setItem('colorcom_cart_v1', JSON.stringify([{ id: 'prod-1|', productId: 'prod-1', name: 'Red T-Shirt', price: 19.99, quantity: 1 }]))
  })

  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()

  // Step 1: shipping
  await page.fill('input[aria-invalid=false]:nth-of-type(1)', 'Test User')
  await page.fill('input[aria-invalid=false]:nth-of-type(2)', '123 Road')
  await page.fill('input[aria-invalid=false]:nth-of-type(3)', 'Townsville')
  await page.fill('input[aria-invalid=false]:nth-of-type(4)', 'CA')
  await page.fill('input[aria-invalid=false]:nth-of-type(5)', '90210')
  await page.fill('input[aria-invalid=false]:nth-of-type(6)', 'USA')

  await page.click('button:has-text("Continue to payment")')

  // Step 2: payment
  await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible()
  await page.fill('input[aria-invalid=false]:nth-of-type(1)', 'Test User')
  await page.fill('input[aria-invalid=false]:nth-of-type(2)', '4242424242424242')
  await page.fill('input[aria-invalid=false]:nth-of-type(3)', '12/30')
  await page.fill('input[aria-invalid=false]:nth-of-type(4)', '123')
  await page.click('button:has-text("Continue to review")')

  // Step 3: review
  await expect(page.getByRole('heading', { name: /Review/ })).toBeVisible()
  await page.click('button:has-text("Place order")')

  // Should navigate to confirmation and show order id
  await page.waitForURL(/checkout\/confirmation\?id=/)
  await expect(page.getByText(/Order ID/)).toBeVisible()
})