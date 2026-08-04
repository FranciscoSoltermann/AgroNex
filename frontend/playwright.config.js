// QA temporal para navegación completa de AgroNex.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/qa',
  timeout: 120000,
  webServer: {
    command: 'npm run dev',
    cwd: __dirname,
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-qa' }],
  ],
});
