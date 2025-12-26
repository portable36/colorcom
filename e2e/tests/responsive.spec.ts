import { test, expect } from '@playwright/test'

test('responsive: product list adapts to breakpoints', async ({ page }) => {
  await page.goto('/products')

  // mobile
  await page.setViewportSize({ width: 375, height: 800 })
  await expect(page.locator('main')).toBeVisible()

  // tablet
  await page.setViewportSize({ width: 768, height: 900 })
  await expect(page.locator('.grid')).toBeVisible()

  // desktop
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.locator('.grid')).toBeVisible()
})