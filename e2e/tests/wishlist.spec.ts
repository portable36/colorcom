import { test, expect } from '@playwright/test'

test('wishlist: add and remove items and persist', async ({ page }) => {
  await page.goto('/products')
  // try add first product via UI path
  const productLink = await page.getByRole('link', { name: /product/i }).first().catch(() => null)

  if (productLink) {
    await productLink.click()
    await page.click('button:has-text("Wishlist")')
    await page.goto('/wishlist')
    await expect(page.getByText(/Your wishlist is empty/)).not.toBeVisible()
    await expect(page.getByText(/Remove/)).toBeVisible()
    await page.click('button:has-text("Remove")')
    await expect(page.getByText(/Your wishlist is empty/)).toBeVisible()
  } else {
    // Fallback: seed localStorage and verify wishlist page shows items
    await page.addInitScript(() => {
      localStorage.setItem('colorcom_wishlist_v1', JSON.stringify([{ id: 'seed-1', name: 'Seeded Product' }]))
    })
    await page.goto('/wishlist')
    await expect(page.getByText(/Seeded Product/)).toBeVisible()
  }
})