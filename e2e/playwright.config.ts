import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 5000 },
  use: {
    browserName: 'chromium',
    headless: true,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    actionTimeout: 10000,
    trace: 'retain-on-failure',
  },
});
