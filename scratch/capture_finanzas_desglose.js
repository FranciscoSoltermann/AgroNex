const path = require('path');
const { chromium } = require(path.join(__dirname, '../frontend/node_modules/@playwright/test'));

const ARTIFACTS_DIR = 'C:\\Users\\fraso\\.gemini\\antigravity\\brain\\e259101a-b69b-4c04-89da-4f9e027fc7af';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  console.log('-> Login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', '***REDACTED***');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 20000 });
  console.log('-> Navigating to /dashboard/finanzas...');
  await page.goto('http://localhost:3000/dashboard/finanzas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Take screenshot of finanzas page
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_finanzas_desglose_servicios.png'), fullPage: true });

  await browser.close();
  console.log('Done capturing finanzas desglose!');
}

main().catch(console.error);
