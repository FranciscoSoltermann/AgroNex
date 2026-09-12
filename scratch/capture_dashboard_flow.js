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

  await page.waitForURL('**/dashboard**', { timeout: 20000 });
  console.log('-> Waiting for Dashboard data to populate...');
  await page.waitForSelector('text=Flujo Financiero: Costos vs Ingresos', { timeout: 25000 });
  await page.waitForTimeout(3000);

  // Capture full dashboard with the new financial flow chart
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_dashboard_flow.png'), fullPage: true });

  await browser.close();
  console.log('Done capturing financial flow chart!');
}

main().catch(console.error);
