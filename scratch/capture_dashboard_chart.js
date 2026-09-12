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
  console.log('-> Waiting for Dashboard data to load...');
  await page.waitForSelector('text=Rentabilidad y Flujo Financiero', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // 1. Screenshot mode "Por Campaña"
  console.log('-> Capturing Por Campaña...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_dashboard_chart_campania.png'), fullPage: true });

  // 2. Click "Flujo Temporal" button
  console.log('-> Switching to Flujo Temporal...');
  const flujoBtn = page.getByRole('button', { name: 'Flujo Temporal' });
  await flujoBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_dashboard_chart_temporal.png'), fullPage: true });

  await browser.close();
  console.log('Done capturing dashboard chart modes!');
}

main().catch(console.error);
