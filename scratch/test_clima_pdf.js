const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  
  // Login
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', '***REDACTED***');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  
  // Navigate to clima
  await page.goto('http://localhost:3000/dashboard/clima');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Select the first field
  await page.selectOption('select', { index: 1 });
  await page.waitForTimeout(2000);

  const screenshotPath = path.join('C:', 'Users', 'fraso', '.gemini', 'antigravity', 'brain', 'e259101a-b69b-4c04-89da-4f9e027fc7af', 'web_clima_exportar_btn.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Try to click "Exportar PDF"
  try {
      const exportBtn = page.getByRole('button', { name: /Exportar PDF/i });
      await exportBtn.click({ force: true });
      await page.waitForTimeout(1500);
      
      const modalScreenshotPath = path.join('C:', 'Users', 'fraso', '.gemini', 'antigravity', 'brain', 'e259101a-b69b-4c04-89da-4f9e027fc7af', 'web_clima_exportar_modal.png');
      await page.screenshot({ path: modalScreenshotPath });
      console.log('Successfully opened the export modal and took screenshot.');
  } catch (err) {
      console.log('Button might be disabled or not found (e.g. no records for this field).', err.message);
  }

  await browser.close();
})();
