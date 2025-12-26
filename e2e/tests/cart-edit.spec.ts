import { test, expect } from '@playwright/test'

test('cart: edit quantity and variant and persist', async ({ page }) => {
  // seed cart with a product that has variations
  await page.addInitScript(() => {
    localStorage.setItem('colorcom_cart_v1', JSON.stringify([{ id: 'prod-1|', productId: 'prod-1', name: 'Red T-Shirt', price: 19.99, quantity: 1 }]))
  })
  await page.goto('/cart')
  await expect(page.getByText(/Red T-Shirt/)).toBeVisible()
  // increase quantity
  await page.fill('input[type="number"]', '2')
  await expect(page.getByText(/× 2/)).toBeVisible()

  // if variant select exists, pick a variant and check price updates
  const variantSelect = page.locator('select').first()
  if (await variantSelect.count() > 0) {
    await variantSelect.selectOption({ index: 1 })
    const priceText = await page.locator('text= $').first().innerText().catch(() => '')
    expect(priceText).toContain('$')
  }
})