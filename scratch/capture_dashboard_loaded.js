const path = require('path');
const { chromium } = require(path.join(__dirname, '../frontend/node_modules/@playwright/test'));

const ARTIFACTS_DIR = 'C:\\Users\\fraso\\.gemini\\antigravity\\brain\\e259101a-b69b-4c04-89da-4f9e027fc7af';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  console.log('-> Login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', '***REDACTED***');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('-> Waiting for Dashboard data to load...');
  await page.waitForSelector('text=Resumen Operativo', { timeout: 10000 });
  await page.waitForTimeout(6000); // Wait for React Query to populate all cards

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_dashboard_loaded.png'), fullPage: true });
  console.log('-> Dashboard loaded screenshot captured!');

  await browser.close();
}

main().catch(console.error);
