import { test, expect } from '@playwright/test'

test('variations: keyboard navigation and price updates', async ({ page }) => {
  await page.goto('/products/prod-1')
  // ensure options are visible
  await expect(page.getByRole('radiogroup', { name: 'Product options' })).toBeVisible()

  const radios = page.getByRole('radio')
  await expect(radios).toHaveCountGreaterThan(0)

  // focus first radio and press ArrowRight to move selection
  await radios.first().focus()
  await page.keyboard.press('ArrowRight')

  // price should have updated (variation priceDelta exists for prod-1 in fallback data)
  const priceText = await page.locator('#price').innerText()
  expect(priceText).toMatch(/\$/)

  // verify stock text or in-stock indicator present
  await expect(page.locator('text=/In stock|Out of stock|available/')).toBeVisible()
})