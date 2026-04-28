const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));
  
  console.log('Navigating to khomanguon.io.vn...');
  await page.goto('https://khomanguon.io.vn', { waitUntil: 'networkidle2' });
  
  console.log('Clicking products link...');
  await page.click('a[href="/products"]');
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('DONE');
  await browser.close();
})();
