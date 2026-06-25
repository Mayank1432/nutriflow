const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  reporter: [['list']],
  use: {
    baseURL: process.env.PWA_BASE_URL || 'https://mayank1432.github.io/protein-diet-planner/',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
