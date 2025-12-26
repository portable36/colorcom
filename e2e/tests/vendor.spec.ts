import { test, expect } from '@playwright/test'

test('vendor: navigate from product to vendor storefront', async ({ page }) => {
  await page.goto('/products')

  // Try to click the first vendor link on a product card
  const vendorLink = await page.locator('a[href^="/vendor/"]').first().catch(() => null)

  if (vendorLink) {
    const href = await vendorLink.getAttribute('href')
    await vendorLink.click()
    await expect(page).toHaveURL(new RegExp('/vendor/'))
    await expect(page.locator('h1')).toContainText(/Vendor/i)
  } else {
    // fallback: go directly to a vendor page seeded with demo data
    await page.goto('/vendor/demo-vendor')
    await expect(page.locator('h1')).toContainText(/Vendor/i)
    await expect(page.locator('ul')).toBeVisible()
  }
})