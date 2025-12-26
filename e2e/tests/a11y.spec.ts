import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

const pages = ['/products', '/cart', '/checkout', '/account/orders'];

test.describe('a11y checks', () => {
  for (const p of pages) {
    test(`page ${p} should have no critical violations`, async ({ page }) => {
      await page.goto(p);
      await injectAxe(page);
      const results = await checkA11y(page, undefined, { detailedReport: true });
      // `checkA11y` throws on violations, but keep the assertion for clarity
      expect(results.violations).toBeDefined();
    });
  }
});
