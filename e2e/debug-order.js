const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle' });
  await page.locator('button', { hasText: 'Add to cart' }).first().click();
  await page.goto('http://localhost:3000/cart');
  await page.getByText('Proceed to Checkout').click();
  await page.waitForURL('**/checkout');
  await page.click('text=Place order');
  await page.waitForSelector('pre', { timeout: 10000 });
  const text = await page.locator('pre').innerText();
  console.log('ORDER RESPONSE:', text);
  await browser.close();
})();