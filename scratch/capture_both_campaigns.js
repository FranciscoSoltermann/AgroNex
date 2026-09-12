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
  await page.waitForTimeout(6000);

  // 1. Dashboard with both campaigns
  console.log('-> Capturing Dashboard Home with 2 active campaigns...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_dashboard_completo.png'), fullPage: true });

  // 2. Analítica with both crops (Soja + Maíz)
  console.log('-> Capturing Analitica...');
  await page.goto('http://localhost:3000/dashboard/analitica', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_analitica_completa.png'), fullPage: true });

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
