const path = require('path');
const { chromium } = require(path.join(__dirname, '../frontend/node_modules/@playwright/test'));

const ARTIFACTS_DIR = 'C:\\Users\\fraso\\.gemini\\antigravity\\brain\\e259101a-b69b-4c04-89da-4f9e027fc7af';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('-> Login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', '***REDACTED***');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 20000 });
  console.log('-> Navigating to /dashboard/maquinaria...');
  await page.goto('http://localhost:3000/dashboard/maquinaria', { waitUntil: 'domcontentloaded' });

  // Wait for the provider card header to appear
  console.log('-> Waiting for John Deere text...');
  await page.locator('text=John Deere').first().waitFor({ timeout: 20000 });

  // Wait for synchronization spinner to finish
  console.log('-> Waiting for Sincronizando con John Deere to detach...');
  try {
    await page.locator('text=Sincronizando con John Deere').waitFor({ state: 'detached', timeout: 25000 });
  } catch (e) {
    console.log('Wait for sync detached error/timeout:', e.message);
  }
  await page.waitForTimeout(2000);

  // Take screenshot of maquinaria tab
  console.log('-> Capturing page state...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_ecosistema_maquinaria_tab.png'), fullPage: true });

  // Check machine fullscreen button
  const machineBtn = page.locator('button:has-text("Ampliar Mapa")').first();
  const machineCount = await machineBtn.count();
  console.log('-> Ampliar Mapa buttons:', machineCount);

  if (machineCount > 0) {
    console.log('-> Clicking Ampliar Mapa on machine...');
    await machineBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_ecosistema_maquinaria_fullscreen.png') });

    // Close modal
    console.log('-> Closing machine modal...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }

  // Switch to Campos tab
  const camposTab = page.locator('button:has-text("Campos & Granjas")').first();
  if (await camposTab.count() > 0) {
    console.log('-> Clicking Campos & Granjas tab...');
    await camposTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_ecosistema_campos_tab.png'), fullPage: true });

    const fieldBtn = page.locator('button:has-text("Ampliar")').first();
    const fieldCount = await fieldBtn.count();
    console.log('-> Ampliar buttons on fields:', fieldCount);

    if (fieldCount > 0) {
      console.log('-> Clicking Ampliar on field...');
      await fieldBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_ecosistema_campo_fullscreen.png') });

      // Close modal
      console.log('-> Closing field modal...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  }

  await browser.close();
  console.log('Done test_ecosistema_fullscreen successfully!');
}

main().catch(console.error);
