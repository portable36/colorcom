const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const main = await page.evaluate(() => document.querySelector('main')?.innerHTML || 'NO_MAIN');
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()));
  console.log('MAIN:', main.slice(0, 500));
  console.log('BUTTONS:', buttons);

  // Seed the cart in localStorage and navigate to /cart to see restore behavior
  await page.evaluate(() => localStorage.setItem('colorcom_cart_v1', JSON.stringify([{ id: 'prod-1', name: 'Red T-Shirt', price: 19.99, quantity: 1 }])));
  await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const main2 = await page.evaluate(() => document.querySelector('main')?.innerHTML || 'NO_MAIN');
  console.log('MAIN2:', main2.slice(0, 500));
  const stored2 = await page.evaluate(() => localStorage.getItem('colorcom_cart_v1'));
  console.log('STORED CART AFTER NAV:', stored2);
  await browser.close();
})();