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
  await page.waitForTimeout(4000);

  // 1. Dashboard screenshot
  console.log('-> Capturing Dashboard Home...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_dashboard.png'), fullPage: false });

  // 2. Lotes screenshot with Lote 2 selected
  console.log('-> Navigating to Lotes and selecting Lote 2...');
  await page.goto('http://localhost:3000/dashboard/lotes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Select lote 2 in the first select dropdown
  const selects = page.locator('select');
  const count = await selects.count();
  if (count > 0) {
    const loteSelect = selects.first();
    const options = await loteSelect.locator('option').allTextContents();
    console.log('Lote options found:', options);
    // Find index or value of option containing 'lote 2'
    const opts = await loteSelect.locator('option').all();
    for (const opt of opts) {
      const text = await opt.textContent();
      if (text.includes('lote 2') || text.includes('campo sur')) {
        const val = await opt.getAttribute('value');
        console.log(`Selecting lote option: "${text}" with value "${val}"`);
        await loteSelect.selectOption(val);
        break;
      }
    }
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_lotes_campania.png'), fullPage: true });

  // 3. Finanzas screenshot in USD
  console.log('-> Navigating to Finanzas and toggling USD...');
  await page.goto('http://localhost:3000/dashboard/finanzas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  // Click the USD button in the currency toggle
  const usdBtn = page.locator('button:has-text("USD")');
  if (await usdBtn.count() > 0) {
    console.log('Toggling USD currency...');
    await usdBtn.first().click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_finanzas_usd.png'), fullPage: false });

  // 4. Analitica screenshot
  console.log('-> Navigating to Analitica...');
  await page.goto('http://localhost:3000/dashboard/analitica', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_analitica.png'), fullPage: false });

  await browser.close();
  console.log('-> All detailed screenshots captured successfully!');
}

main().catch(console.error);
