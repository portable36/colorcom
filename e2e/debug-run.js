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
  await browser.close();
})();